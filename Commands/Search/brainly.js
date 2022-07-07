import { brainlySearch } from "../../Utils/Brainly/index.js";

export default {
	name: "brainly",
	description: "Search answers from brainly",
	usage: "!brainly <query> --<?lang> (id, us, es, ru, ro, pt, tr, ph, pl, hi) --<?count> (1-30)",
	category: "Search",
	aliases: ["brainli", "brainly-search", "tugas"],
	limit: 4,
	cooldown: 5,
	async run({ query, from, message }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a query");
		const parseOptions = query.includes("--") ? query.split("--") : query;
		const options = { lang: undefined, count: undefined };
		if (Array.isArray(parseOptions)) {
			query = parseOptions[0];
			options.lang = parseOptions
				.find((item) => {
					if (/^([a-zA-Z]{0,2})$/g.test(item.trim())) return item;
				})
				?.trim();
			options.count = Number(
				parseOptions
					.find((item) => {
						if (/[0-9]/.test(item.trim())) return item;
					})
					?.trim(),
			);
		}
		try {
			const brainly = await brainlySearch(query, options);
			if ("error" in brainly) return client[botNum].reply({ from, quoted: message }, brainly.error);
			let capt = "Void Bot Brainly\n\n";
			for (const { pertanyaan, jawaban } of brainly) {
				capt += `Pertanyaan : ${pertanyaan.replace(/[\n\t\r]/g, "")}\n`;
				capt += `Jawaban : ${jawaban
					.map((item, index) => `\n${index + 1}. ${item.replace(/[\n\t\r]/g, "")}\n`)
					.join("")
					.trim()}\n\n\n`;
			}
			await client[botNum].reply({ from, quoted: message }, capt.trim());
		} catch (err) {
			log(e);
			client[botNum].reply({ from, quoted: message }, "Error while searching your question");
		}
	},
};
