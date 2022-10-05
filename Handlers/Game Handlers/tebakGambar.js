/* global botNum */
import similarity from 'similarity';

import configuration from '../../connect.js';
import { DeleteIntervals } from '../../Utils/Misc/intervals.js';

export default {
	async handler({ from, isAdmin, isGroup, body, message }, client, settings) {
		const play = async () => {
			if (configuration.games.tebakGambar.has(from)) {
				const minScore = 0.75;
				const data = configuration.games.tebakGambar.get(from);

				if (body.toLowerCase() == data.data.answer.toLowerCase()) {
					DeleteIntervals(configuration.intervals['tebakGambar'].get(from), configuration.intervals['tebakGambar'], from);
					configuration.games.tebakGambar.delete(configuration.games.tebakGambar.get(from).id);
					return await client[botNum].sendMessage(from, { text: 'Correct!' }, { quoted: message });
				}

				if (similarity(body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) {
					return await client[botNum].sendMessage(from, { text: 'The answer is close!' }, { quoted: message });
				}
			}
		};

		if (isGroup && (settings[from].games == 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
			await play();
		} else if (!isGroup && !configuration.OPTIONS.onlyLogs) {
			await play();
		}
	},
};
