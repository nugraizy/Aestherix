import { startAkinator } from "../../Utils/Games/index.js";

export default {
	name: "akinator",
	description: "Play Akinator",
	usage: "!akinator",
	category: "Games",
	aliases: ["aki", "playaki", "playakinator"],
	cooldown: 2,
	limit: 2,
	async run({ from, sender }, client) {
		const aki = await startAkinator(from);
		const { question, answers, progress } = aki;
		await client[botNum].reply(from, `${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n\nProgress : ${progress.toFixed(2)}%`);
	},
};
