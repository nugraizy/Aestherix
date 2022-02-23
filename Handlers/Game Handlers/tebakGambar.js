import similarity from "similarity";
import path from "path";
import { __dirname } from "../../connect.js";
import { readJSON, readDir, unlinkFile } from "../../Helper/Modules/index.js";

export async function handler({ message, from, body }, client) {
	if (readDir(path.join(__dirname, "Databases/Games/Tebak Gambar/")).includes(`${from}.json`)) {
		const minScore = 0.75;
		const data = readJSON(path.join(__dirname, `Databases/Games/Tebak Gambar/${from}.json`));
		if (body.toLowerCase() == data.data.answer.toLowerCase()) {
			unlinkFile(`${__dirname}/Databases/Games/Tebak Gambar/${from}.json`);
			return client[botNum].sendMessage(from, { text: "Correct!" }, { quoted: message });
		}
		if (similarity(body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) return client[botNum].sendMessage(from, { text: "The answer is close!" }, { quoted: message });
	}
}
