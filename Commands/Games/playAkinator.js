import { startAkinator } from "../../Utils/Games/index.js";

export default {
	name: "akinator",
	description: "Play Akinator",
	usage: "!akinator",
	category: "Games",
	aliases: ["aki", "playaki", "playakinator"],
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ from, message }, client) {
		const aki = await startAkinator(from);
		if ("error" in aki) return await client[botNum].reply({ from, quoted: message }, aki.error);
		const { question, answers, progress, progressBar, arrow } = aki;
		await client[botNum].reply(
			{ from, quoted: message },
			`${question}\n\n${answers.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n6. Exit\n7. Back/Undo\n\nProgress : ${progress.toFixed(2)}% ${arrow}\n${progressBar}`,
		);
	},
};
