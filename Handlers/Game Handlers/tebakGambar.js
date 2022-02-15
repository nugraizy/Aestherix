import similarity from "similarity";
import path from "path";
import { __dirname } from "../../index.js";

export async function handler(message, client) {
	const { readJSON, readDir, unlinkFile } = await import(path.join(__dirname, "Helper/Modules/functions.js"));
	if (readDir(path.join(__dirname, "Databases/Games/Tebak Gambar/")).includes(`${message.from}.json`)) {
		const minScore = 0.75;
		const data = readJSON(path.join(__dirname, `Databases/Games/Tebak Gambar/${message.from}.json`));
		if (message.body.toLowerCase() == data.data.answer.toLowerCase()) {
			unlinkFile(`${__dirname}/Databases/Games/Tebak Gambar/${message.from}.json`);
			return client[botNum].sendMessage(message.from, { text: "Correct!" }, { quoted: message.message });
		}
		if (similarity(message.body.toLowerCase(), data.data.answer.toLowerCase()) >= minScore) return client[botNum].sendMessage(message.from, { text: "The answer is close!" }, { quoted: message.message });
	}
}
