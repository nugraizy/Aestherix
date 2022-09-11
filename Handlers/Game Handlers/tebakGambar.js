/* global botNum, games, OPTIONS, intervals */
import similarity from 'similarity';

import { DeleteIntervals } from '../../Utils/Misc/intervals.js';

export default {
	async handler({ from, isAdmin, isGroup, body, message }, client, settings) {
		const play = async () => {
			if (games.tebakGambar.has(from)) {
				const minScore = 0.75;
				const data = games.tebakGambar.get(from);

				if (body.toLowerCase() == data.data.answer.toLowerCase()) {
					DeleteIntervals(intervals['tebakGambar'].get(from), intervals['tebakGambar'], from);
					games.tebakGambar.delete(games.tebakGambar.get(from).id);
					return await client[botNum].sendMessage(from, { text: 'Correct!' }, { quoted: message });
				}

				if (similarity(body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) {
					return await client[botNum].sendMessage(from, { text: 'The answer is close!' }, { quoted: message });
				}
			}
		};

		if (isGroup && (settings[from].games == 'enable' || isAdmin) && !OPTIONS.onlyLogs) {
			await play();
		} else if (!isGroup && !OPTIONS.onlyLogs) {
			await play();
		}
	},
};
