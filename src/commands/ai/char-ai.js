import configuration from '../../helper/config/connect.js';
import { ChatGPTDialogue } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'charai',
	minifiedDescription: 'Chat AI',
	description: 'Chat with AI.',
	category: 'AI',
	usage: '!charai <start/stop>',
	aliases: ['ai'],
	cooldown: 3,
	limit: 5,
	status: 'enable',
	async run({ args, query, from, cmd, message, groupMetadata, prefix, pushname }, client) {
		if (!configuration.OPTIONS.ai) {
			return await client.instance.reply('ChatGPT AI is disabled', { from, quoted: message, groupMetadata });
		}

		if (!query) {
			return await client.instance.reply(
				`Please specify a command.\n\nUsage : \n${prefix + cmd} start\n${prefix + cmd} stop`,
				{
					from,
					quoted: message,
					groupMetadata
				}
			);
		}

		if (args[1] === 'start') {
			if (configuration.user.charAI.get(from)) {
				return await client.instance.reply('You already chatting with AI', { from, quoted: message, groupMetadata });
			}

			configuration.user.charAI.set(
				from,
				new ChatGPTDialogue({
					name: pushname,
					time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
				})
			);

			return await client.instance.reply('AI chat has been started', { from, quoted: message, groupMetadata });
		}

		if (args[1] === 'stop') {
			if (!configuration.user.charAI.get(from)) {
				return await client.instance.reply('You not chatting with AI', { from, quoted: message, groupMetadata });
			}

			configuration.user.charAI.delete(from);
			return await client.instance.reply('AI chat has been stopped', { from, quoted: message, groupMetadata });
		}

		return await client.instance.reply(`Invalid command.\n\nUsage : \n${cmd} start\n${cmd} stop`, {
			from,
			quoted: message,
			groupMetadata
		});
	}
};
