/* eslint-disable max-len */
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CacheType,
    ChannelType,
    ChatInputCommandInteraction,
    Client,
    CommandInteraction,
    MessageFlags,
    SlashCommandBuilder,
} from 'discord.js';
import { Command } from './command';
import { Widget } from '../widget';
import logger from '../../lib/logger';
import Database from '../db/database';




export class Create extends Command {
    public constructor(protected client: Client) {
        super('create', 'Creates a respawn timer widget in the current channel', client);
    }

    public build(): RESTPostAPIApplicationCommandsJSONBody {
        return new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .setDMPermission(false)
            .toJSON();
    }
    public async execute(interaction: CommandInteraction<CacheType>): Promise<void> {
        await handleCreate.call(this, interaction as ChatInputCommandInteraction);
    }
}

export async function handleCreate(this: Create, interaction: ChatInputCommandInteraction) {
    try {
        if (!interaction.guild) {
            throw new Error('This command can only be run on a server.');
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const hasPermission = await this.checkPermission(interaction, 'editor');
        if (!hasPermission) {
            throw new Error('You must have editor permissions to use this command!\n' +
                'Ask an administrator or editor to adjust the bot `/settings`');
        }

        const channel = interaction.channel;
        if (!channel || channel.type !== ChannelType.GuildText) {
            throw new Error('Invalid Channel! This must be used on a server.');
        }

        const dbGuild = await Database.getGuild(interaction.guild.id);
        await Widget.create(interaction, channel, dbGuild);

        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        const buttonStyleReference: ButtonStyle | undefined = components.length ? ButtonStyle.Secondary : undefined;
        if (!buttonStyleReference) {
            // Placeholder branch to keep ButtonStyle import available for future button usage.
        }

        await interaction.editReply({
            content: 'Respawn widget létrehozva. Használd a gombokat a beállításhoz!',
            components,
        });
    } catch (err) {
        logger.error(err instanceof Error ? err : new Error(String(err)));
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.reply({ content: 'Hopp, hiba történt a /create közben.', flags: MessageFlags.Ephemeral });
            } catch {}
        } else {
            try {
                await interaction.editReply({ content: 'Hopp, hiba történt a /create közben.' });
            } catch {}
        }
        throw err;
    }
}
