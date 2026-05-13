import { startAkinator, setMessages } from '../../utils/games/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'akinator',
	minifiedDescription: 'Play Akinator',
	description: 'Play Akinator.',
	usage: '!akinator',
	category: 'Games',
	aliases: ['aki', 'playaki', 'playakinator'],
	cooldown: 2,
	limit: 2,
	status: 'disable',
	async run({ from, message }, client) {
		const aki = await startAkinator(from);

		if (aki?.error) {
			return await client.reply(from, aki.error, message);
		}

		const { question, answers, progress, progressBar, arrow } = aki;

		const messages = await client.reply(
			from,
			`[?] \`${question}\`\n\n${answers
				.map((v, i) => `${i + 1}. ${v}`)
				.join('\n')}\n6. Exit\n7. Back/Undo\n\n> Progress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`,
			message
		);

		setMessages(from, { originalMessage: messages });
	}
};
