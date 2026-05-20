import configuration from '../../helper/config/connect.js';
import { ChatGPTDialogue } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const LIST_FLAGS = new Set(['--list-char', '--chars', '-c', '-ls']);

const DEFAULT_CHARACTER = 'Zero_Two';

function getCharacterList() {
	const instance = new ChatGPTDialogue('_', '_', DEFAULT_CHARACTER);

	return instance.getCharacters;
}

function formatCharacterList(characters, prefix, cmd) {
	let text = 'Available Characters'.formatHeaders() + '\n\n';

	for (const char of characters) {
		text += `• ${char.replace(/_/g, ' ')}\n`;
	}

	text += `\nUsage: ${prefix}${cmd} start <character_name>`;
	text += `\nExample: ${prefix}${cmd} start Marin_Kitagawa`;
	return text;
}

export default defineCommand({
	name: 'charai',
	minifiedDescription: 'Chat AI',
	description: 'Chat with AI.',
	category: 'AI',
	usage: '!charai `<start/stop/--chars>` [character]',
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
				`Please specify a command.\n\nUsage:\n${prefix + cmd} start [character]\n${prefix + cmd} stop\n${prefix + cmd} --chars`,
				message
			);
		}

		if (LIST_FLAGS.has(args[1])) {
			const characters = getCharacterList();

			return await client.reply(from, formatCharacterList(characters, prefix, cmd), message);
		}

		if (args[1] === 'start') {
			if (configuration.charAI.get(from)) {
				return await client.reply(from, 'You already chatting with AI', message);
			}

			const characters = getCharacterList();
			const requested = args[2] || DEFAULT_CHARACTER;
			const character = characters.find((c) => c.toLowerCase() === requested.toLowerCase().replace(/ /g, '_'));

			if (!character) {
				return await client.reply(
					from,
					`Character "${requested}" not found.\n\n${formatCharacterList(characters, prefix, cmd)}`,
					message
				);
			}

			configuration.charAI.set(
				from,
				new ChatGPTDialogue(pushname, new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), character)
			);

			return await client.reply(from, `AI chat started with ${character.replace(/_/g, ' ')}`, message);
		}

		if (args[1] === 'stop') {
			if (!configuration.charAI.get(from)) {
				return await client.reply(from, 'You not chatting with AI', message);
			}

			configuration.charAI.delete(from);
			return await client.reply(from, 'AI chat has been stopped', message);
		}

		return await client.reply(
			from,
			`Invalid command.\n\nUsage:\n${prefix + cmd} start [character]\n${prefix + cmd} stop\n${prefix + cmd} --chars`,
			message
		);
	}
});
