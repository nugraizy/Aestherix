import similarity from 'string-similarity';

import configuration from '../../../helper/config/connect.js';
import { deleteIntervals } from '../../../utils/misc/intervals.js';

const handleTebakGambar = async ({ from, isAdmin, isGroup, body, message }, client, settings) => {
	const playGame = async () => {
		const gameData = configuration.games.tebakGambar.get(from);

		if (gameData) {
			const minScore = 0.65;
			const { answer, id } = gameData.data;
			const input = body.toLowerCase();
			const answerLowerCase = answer.toLowerCase();

			if (input === answerLowerCase) {
				deleteIntervals(configuration.timers.tebakGambar.get(from), configuration.timers.tebakGambar, from);
				configuration.games.tebakGambar.delete(id);
				await client.send(from, { text: 'Correct!' }, { quoted: message });
			} else if (similarity.compareTwoStrings(input, answerLowerCase) >= minScore) {
				await client.send(from, { text: 'The answer is close!' }, { quoted: message });
			}
		}
	};

	if ((!isGroup || settings[from]?.games === 'enable' || isAdmin) && !configuration.flags.onlyLogs) {
		await playGame();
	}
};

export default handleTebakGambar;
