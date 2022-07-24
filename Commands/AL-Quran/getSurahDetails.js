import { getSurahDetail } from "../../Utils/EQuran/index.js";

export default {
	name: "surahdetails",
	description: "Get surah details",
	category: "AL-Quran",
	usage: "surahdetail <surah number>",
	aliases: ["surahdetail"],
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please specify a surah number");
		if (!regex(query)) return client[botNum].reply({ from, quoted: message }, "Please specify a valid surah number");
		if (parseInt(query) > 114) return client[botNum].reply({ from, quoted: message }, "Surah number must be less than 114");
		try {
			const detail = await getSurahDetail(query);
			await client[botNum].reply({ from, quoted: message }, `Surah ${detail.nomor} (${detail.namaArab}) (${detail.namaLatin})\n\nTotal Ayat : ${detail.totAyat}\nTempat Turun : ${detail.turun}\nArti : ${detail.arti}\nDeskripsi : ${detail.deskripsi}`);
		} catch (err) {
			return client[botNum].reply({ from, quoted: message }, "Surah not found");
		}
	},
};

function regex(input) {
	return /[1-9][0-9]*/.test(input);
}
