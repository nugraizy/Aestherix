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
		if (!configuration.OPTIONS.ai) {
			return await client.instance.reply(from, 'ChatGPT AI is disabled', message);
		}

		if (!query) {
			return await client.instance.reply(
				from,
				`Please specify a command.\n\nUsage : \n${prefix + cmd} start\n${prefix + cmd} stop`,
				message
			);
		}

		if (args[1] === 'start') {
			if (configuration.user.charAI.get(from)) {
				return await client.instance.reply(from, 'You already chatting with AI', message);
			}

			configuration.user.charAI.set(
				from,
				new ChatGPTDialogue({
					name: pushname,
					time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
				})
			);

			return await client.instance.reply(from, 'AI chat has been started', message);
		}

		if (args[1] === 'stop') {
			if (!configuration.user.charAI.get(from)) {
				return await client.instance.reply(from, 'You not chatting with AI', message);
			}

			configuration.user.charAI.delete(from);
			return await client.instance.reply(from, 'AI chat has been stopped', message);
		}

		return await client.instance.reply(from, `Invalid command.\n\nUsage : \n${cmd} start\n${cmd} stop`, message);
	}
};
