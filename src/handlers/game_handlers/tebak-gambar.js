import similarity from 'string-similarity';

import configuration from '../../helper/config/connect.js';
import { deleteIntervals } from '../../utils/misc/intervals.js';

const handleTebakGambar = async ({ from, isAdmin, isGroup, body, message, groupMetadata }, client, settings) => {
	const playGame = async () => {
		const gameData = configuration.games.tebakGambar.get(from);

		if (gameData) {
			const minScore = 0.65;
			const { answer, id } = gameData.data;
			const input = body.toLowerCase();
			const answerLowerCase = answer.toLowerCase();

			if (input === answerLowerCase) {
				deleteIntervals(configuration.intervals.tebakGambar.get(from), configuration.intervals.tebakGambar, from);
				configuration.games.tebakGambar.delete(id);
				await client[botNum].send(from, { text: 'Correct!' }, { groupMetadata, quoted: message });
			} else if (similarity.compareTwoStrings(input, answerLowerCase) >= minScore) {
				await client[botNum].send(from, { text: 'The answer is close!' }, { groupMetadata, quoted: message });
			}
		}
	};

	if ((!isGroup || settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await playGame();
	}
};

export default handleTebakGambar;
