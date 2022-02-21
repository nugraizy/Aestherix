import { getAyat, getSurahDetail } from "../../Utils/EQuran/index.js";

export default {
	name: "surahayat",
	description: "Get surah ayat",
	category: "AL-Quran",
	usage: "surahayat <surah number>",
	aliases: ["ayat"],
	async run({ query, from }, client) {
		if (!query) return client[botNum].reply(from, "Please specify a surah number");
		if (!regex(query)) return client[botNum].reply(from, "Please specify a valid surah number");
		if (parseInt(query) > 114) return client[botNum].reply(from, "Surah number must be less than 114");
		try {
			const ayat = await getAyat(query);
			const detail = await getSurahDetail(query);
			await client[botNum].reply(from, `Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${detail.turun}\nArti : ${detail.arti}\n\n${ayat.map((v) => ` • ${v.arab}\n؜ • ${v.latin}\n؜ • ${v.indonesia}`).join("\n\n")}`);
		} catch (err) {
			return client[botNum].reply(from, "Surah not found");
		}
	},
};

function regex(input) {
	return /[1-9][0-9]*/.test(input);
}
