import { getListSurah } from "../../Utils/EQuran/quranList.js";

export default {
	name: "getsurah",
	description: "Get List of Surah from The Quran",
	category: "AL-Quran",
	usage: "getsurah",
	aliases: ["surah"],
	async run({ from }, client) {
		try {
			const lists = await getListSurah();
			await client[botNum].reply(from, lists.map((v, i) => `${i + 1}. ${v.nama_latin}\nTot. Ayat : ${v.jumlah_ayat}\nArti : ${v.arti}\nTurun Di : ${v.tempat_turun}\nAudio : ${v.audio}\n`).join("\n"));
		} catch (err) {
			return client.reply(from, "Something went wrong");
		}
	},
};
