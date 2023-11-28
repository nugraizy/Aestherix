import { startAkinator } from '../../utils/games/index.js';

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
	status: 'enable',
	async run({ from, message, groupMetadata }, client) {
		const aki = await startAkinator(from);

		if ('error' in aki) {
			return await client.instance.reply(aki.error, { from, quoted: message, groupMetadata });
		}

		const { question, answers, progress, progressBar, arrow } = aki;

		await client.instance.reply(
			`${question}\n\n${answers
				.map((v, i) => `${i + 1}. ${v}`)
				.join('\n')}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
