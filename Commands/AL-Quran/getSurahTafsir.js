import { getTafsirSurah } from "../../Utils/EQuran/index.js";

export default {
	name: "getsurahtafsir",
	description: "Get Surah Tafsir",
	category: "AL-Quran",
	usage: "getsurahtafsir <surah number>",
	aliases: ["gettafsir", "tafsir"],
	cooldown: 0,
	limit: 0,
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a surah number");
		if (!regex(query)) return client[botNum].reply({ from, quoted: message }, "Please specify a valid surah number");
		if (parseInt(query) > 114) return client[botNum].reply({ from, quoted: message }, "Surah number must be less than 114");
		try {
			const tafsir = await getTafsirSurah(query);
			await client[botNum].reply({ from, quoted: message }, tafsir.map((v) => `${v.arab} • \n • ${v.tafsir}`).join("\n\n"));
		} catch (err) {
			return client[botNum].reply({ from, quoted: message }, "Surah not found");
		}
	},
};

function regex(input) {
	return /[1-9][0-9]*/.test(input);
}
