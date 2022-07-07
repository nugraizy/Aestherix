import similarity from "similarity";
import { DeleteIntervals } from "../../Utils/Misc/intervals.js";

export const handler = ({ message, from, body }, client) => {
	if (games.tebakGambar.has(from)) {
		const minScore = 0.75;
		const data = games.tebakGambar.get(from);
		if (body.toLowerCase() == data.data.answer.toLowerCase()) {
			DeleteIntervals(intervals["tebakGambar"].get(from), intervals["tebakGambar"], from);
			games.tebakGambar.delete(games.tebakGambar.get(from));
			return client[botNum].sendMessage(from, { text: "Correct!" }, { quoted: message });
		}
		if (similarity(body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) return client[botNum].sendMessage(from, { text: "The answer is close!" }, { quoted: message });
	}
};
