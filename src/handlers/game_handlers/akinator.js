import configuration from '../../helper/config/connect.js';
import { getSession, handleAnswer } from '../../utils/games/index.js';

let akinatorHandler;

akinatorHandler = async ({ from, isAdmin, isGroup, body, message, groupMetadata }, client, settings) => {
	if (!getSession(from)) {
		return;
	}

	const play = async () => {
		const handle = await handleAnswer(from, body);
		const { question, answers, status, progress, progressBar, arrow } = handle;

		if (status === 'waiting') {
			return;
		}

		if (status === 'playing') {
			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`${question}\n\n${answers
					.map((v, i) => `${i + 1}. ${v}`)
					.join('\n')}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`
			);
		}

		if (status === 'win') {
			await client[botNum].send(
				from,
				{
					image: { url: answers[answers.length - 1].absolute_picture_path },
					caption: `Name : ${answers[answers.length - 1].name}\nDescription : ${
						answers[answers.length - 1].description
					}\nProgress : ${progress}\n${progressBar}`
				},
				{ groupMetadata, quted: message }
			);
		}

		if (status === 'exitted') {
			await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You have exitted the game.');
		}

		if (status === 'back') {
			if (handle.isFailed) {
				/* eslint-disable-next-line */
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, "You can't go back.");
			}

			await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`${question}\n\n${answers
					.map((v, i) => `${i + 1}. ${v}`)
					.join('\n')}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`
			);
		}
	};

	if (isGroup && (settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await play();
	} else if (!isGroup && !configuration.OPTIONS.onlyLogs) {
		await play();
	}
};

export default akinatorHandler;
