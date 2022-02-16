export default {
	name: "menu",
	description: "Shows the menu.",
	usage: "!menu",
	aliases: ["menu"],
	category: "Helper",
	async run({ from }, client) {
		let capt = "Void Bot Menu\n\n";
		let i = 0;
		for (const command of CMD.commands) {
			capt += `${i + 1}. ${command[1].name}\ndesc : ${command[1].description}\naliases : ${command[1].aliases.join(", ")}\n\n`;
			i++;
		}
		await client[botNum].reply(from, capt.trim());
	},
};
