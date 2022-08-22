import { getListSurah } from "../../Utils/EQuran/index.js";

export default {
	name: "getsurah",
	description: "Get List of Surah from The Quran",
	category: "AL-Quran",
	usage: "!getsurah",
	aliases: ["surah"],
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ from, message }, client) {
		try {
			const lists = await getListSurah();
			await client[botNum].reply(
				{ from, quoted: message },
				lists.map((v, i) => `${i + 1}. ${v.nama_latin}\nTot. Ayat : ${v.jumlah_ayat}\nArti : ${v.arti}\nTurun Di : ${v.tempat_turun}\nAudio : ${v.audio}\n`).join("\n"),
			);
		} catch (err) {
			return await lient[botNum].reply({ from, quoted: message }, "Something went wrong");
		}
	},
};
