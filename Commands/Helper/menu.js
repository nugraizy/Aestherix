export default {
	name: "menu",
	description: "Shows the menu.",
	usage: "!menu",
	aliases: ["menu"],
	category: "Helper",
	cooldown: 10,
	limit: 5,
	async run({ from, prefix }, client) {
		let capt = `Void Bot Menu\n\nUse ${prefix}${getRandomCommand()} -H\n~> to see the detail of the command.\n\n`;
		let i = 1;
		for (const command of CMD.commands) {
			capt += `${i++}. ${command[1].name.capitalize()}\n`;
		}
		await client[botNum].reply(from, capt.trim());
	},
};

const getRandomCommand = () => Array.from(CMD.commands.keys())[Math.floor(Math.random() * CMD.commands.size)];
