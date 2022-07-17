import similarity from "similarity";
import { DeleteIntervals } from "../../Utils/Misc/intervals.js";

export default {
	async handler(message, client) {
		const play = async () => {
			if (games.tebakGambar.has(message.from)) {
				const minScore = 0.75;
				const data = games.tebakGambar.get(message.from);
				if (message.body.toLowerCase() == data.data.answer.toLowerCase()) {
					DeleteIntervals(intervals["tebakGambar"].get(message.from), intervals["tebakGambar"], message.from);
					games.tebakGambar.delete(games.tebakGambar.get(message.from));
					return await client[botNum].sendMessage(message.from, { text: "Correct!" }, { quoted: message.message });
				}
				if (similarity(message.body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) return client[botNum].sendMessage(message.from, { text: "The answer is close!" }, { quoted: message.message });
			}
		};
		if (message.isGroup && (message[message.from].games == "enable" || message.isAdmin) && !OPTIONS.onlyLogs) play();
		else if (!message.isGroup && !OPTIONS.onlyLogs) await play();
	},
};
