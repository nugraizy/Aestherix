import similarity from 'string-similarity';

import configuration from '../../helper/config/connect.js';
import { deleteIntervals } from '../../utils/misc/intervals.js';

const handler = async ({ from, isAdmin, isGroup, body, message, groupMetadata }, client, settings) => {
	const play = async () => {
		if (configuration.games.tebakGambar.has(from)) {
			const minScore = 0.65;
			const data = configuration.games.tebakGambar.get(from);

			if (body.toLowerCase() === data.data.answer.toLowerCase()) {
				deleteIntervals(configuration.intervals['tebakGambar'].get(from), configuration.intervals['tebakGambar'], from);
				configuration.games.tebakGambar.delete(configuration.games.tebakGambar.get(from).id);
				return await client[botNum].send(from, { text: 'Correct!' }, { groupMetadata, quoted: message });
			}

			if (similarity.compareTwoStrings(body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) {
				return await client[botNum].send(from, { text: 'The answer is close!' }, { groupMetadata, quoted: message });
			}
		}
	};

	if (isGroup && (settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await play();
	} else if (!isGroup && !configuration.OPTIONS.onlyLogs) {
		await play();
	}
};

const tebakGambarHandler = handler;

export default tebakGambarHandler;
