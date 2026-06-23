import similarity from 'string-similarity';

import configuration from '../../../helper/config/connect.js';
import { getLocale, useLocale } from '../../../helper/i18n/index.js';
import { deleteIntervals } from '../../../utils/misc/intervals.js';

const handleTebakGambar = async ({ from, isAdmin, isGroup, body, message }, client, settings) => {
	const locale = await getLocale(from);
	const L = useLocale(locale, 'common');

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
				await client.send(from, { text: L.core.games.correct }, { quoted: message });
			} else if (similarity.compareTwoStrings(input, answerLowerCase) >= minScore) {
				await client.send(from, { text: L.core.games.closeAnswer }, { quoted: message });
			}
		}
	};

	if ((!isGroup || settings?.games === 'enable' || isAdmin) && !configuration.flags.onlyLogs) {
		await playGame();
	}
};

export default handleTebakGambar;
