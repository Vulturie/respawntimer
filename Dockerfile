### Build Step
FROM python:3-alpine AS builder

# Node + pnpm + build eszközök (node-gyp-hez is)
RUN apk add --no-cache nodejs npm git python3 make g++ libtool autoconf automake
RUN npm install -g pnpm

WORKDIR /usr/src/app

# monorepo-struktúrád szerint a backend mappából dolgozunk
COPY backend/package*.json ./
RUN pnpm install --frozen-lockfile || pnpm install

# források bemásolása és build
COPY backend ./
RUN pnpm run build

### Serve Step
FROM python:3-alpine AS app

# Runtime-hoz kell a nodejs + ffmpeg
RUN apk add --no-cache nodejs npm ffmpeg

WORKDIR /app

# buildelt kimenet + runtime fájlok
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/audio ./audio
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules

ENV NODE_ENV=production
# prism-media / @discordjs/voice így biztosan megtalálja
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV TZ=Europe/Budapest

# Ha nem szolgálsz HTTP-t, az EXPOSE felesleges, de nem zavar:
# EXPOSE 8080

ENTRYPOINT ["node", "./dist/src/index.js"]
