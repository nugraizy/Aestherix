import configuration from '../../helper/config/connect.js';
import { getSession, handleAnswer } from '../../utils/games/index.js';

const akinatorHandler = async ({ from, isAdmin, isGroup, body, message }, client, settings) => {
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

		const akinatorMessage = `[?] \`${question}\`\n\n${answers
			.map((v, i) => `${i + 1}. _${v}_`)
			.join('\n')}\n6. Exit\n7. Back/Undo\n\nProgress : \`${progress.toFixed(2)}% ${arrow}\`\n> ${progressBar}`;

		const {
			originalMessage: { key }
		} = session;

		if (status === 'playing') {
			return await client.instance.send(from, { edit: key, text: akinatorMessage }, {});
		}

		if (status === 'win') {
			const { absolute_picture_path: absolutePath, name, description } = answers[answers.length - 1];

			await client.instance.send(
				from,
				{ edit: key, text: `Akinator Game is Over.\n\nProgress : \`${progress}\`\n> ${progressBar}` },
				{}
			);

			return await client.instance.send(
				from,
				{
					image: { url: absolutePath },
					caption: `Name : \`${name}\`\nDescription : \`${description}\`\n\nProgress : \`${progress}\`\n> ${progressBar}`
				},
				{ quoted: message }
			);
		}

		if (status === 'exitted') {
			return await client.instance.reply('You have exited the game.', { from, quoted: message });
		}

		if (status === 'back') {
			if (handle.isFailed) {
				return await client.instance.reply('You cannot go back.', { from, quoted: message });
			}

			await client.instance.reply(akinatorMessage, { from, quoted: message });
		}
	};

	if ((!isGroup || isAdmin || settings[from]?.games === 'enable') && !configuration.OPTIONS.onlyLogs) {
		await playAkinator();
	}
};

export default akinatorHandler;
