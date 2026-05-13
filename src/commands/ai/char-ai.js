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
	usage: '!charai `<start/stop>`',
	aliases: ['ai'],
	cooldown: 3,
	limit: 5,
	status: 'enable',
	async run({ args, query, from, cmd, message, prefix, pushname }, client) {
		if (!configuration.flags.ai) {
			return await client.reply(from, 'ChatGPT AI is disabled', message);
		}

		if (!query) {
			return await client.reply(
				from,
				`Please specify a command.\n\nUsage : \n${prefix + cmd} start\n${prefix + cmd} stop`,
				message
			);
		}

		if (args[1] === 'start') {
			if (configuration.charAI.get(from)) {
				return await client.reply(from, 'You already chatting with AI', message);
			}

			configuration.charAI.set(
				from,
				new ChatGPTDialogue(pushname, new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), 'Zero_Two')
			);

			return await client.reply(from, 'AI chat has been started', message);
		}

		if (args[1] === 'stop') {
			if (!configuration.charAI.get(from)) {
				return await client.reply(from, 'You not chatting with AI', message);
			}

			configuration.charAI.delete(from);
			return await client.reply(from, 'AI chat has been stopped', message);
		}

		return await client.reply(from, `Invalid command.\n\nUsage : \n${cmd} start\n${cmd} stop`, message);
	}
};
