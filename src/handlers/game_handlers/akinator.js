import configuration from '../../helper/config/connect.js';
import { getSession, handleAnswer } from '../../utils/games/index.js';

const akinatorHandler = async ({ from, isAdmin, isGroup, body, message, groupMetadata }, client, settings) => {
	const session = getSession(from);

	if (!session) {
		return;
	}

	const playAkinator = async () => {
		const handle = await handleAnswer(from, body);
		const { question, answers, status, progress, progressBar, arrow } = handle;

		if (status === 'waiting') {
			return;
		}

		const akinatorMessage = `${question}\n\n${answers
			.map((v, i) => `${i + 1}. ${v}`)
			.join('\n')}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`;

		if (status === 'playing') {
			await client.instance.reply(akinatorMessage, { from, quoted: message, groupMetadata });
		} else if (status === 'win') {
			const { absolute_picture_path: absolutePath, name, description } = answers[answers.length - 1];

			await client.instance.send(
				from,
				{
					image: { url: absolutePath },
					caption: `Name : ${name}\nDescription : ${description}\nProgress : ${progress}\n${progressBar}`
				},
				{ groupMetadata, quoted: message }
			);
		} else if (status === 'exitted') {
			await client.instance.reply('You have exited the game.', { from, quoted: message, groupMetadata });
		} else if (status === 'back') {
			if (handle.isFailed) {
				await client.instance.reply('You cannot go back.', { from, quoted: message, groupMetadata });
			} else {
				await client.instance.reply(akinatorMessage, { from, quoted: message, groupMetadata });
			}
		}
	};

	if ((!isGroup || isAdmin || settings[from]?.games === 'enable') && !configuration.OPTIONS.onlyLogs) {
		await playAkinator();
	}
};

export default akinatorHandler;
