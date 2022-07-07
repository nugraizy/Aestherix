import { readJSON, romanize } from "../../Helper/Modules/index.js";

export default {
	name: "menu",
	description: "Shows the menu.",
	usage: "!menu",
	aliases: ["menu"],
	category: "Helper",
	cooldown: 10,
	limit: 5,
	async run({ from, prefix, message }, client) {
		log(message);
		let capt = `Void Bot Menu v.${romanize(readJSON("./package.json").version)}\n\nUse ${prefix}${getRandomCommand()} -H\n~> to see the detail of the command.\n\n`;
		const Container = [];
		for (const [key, value] of cmds.commands)
			if (Object.keys(Container).includes(value.category)) Container[value.category].push(key);
			else Container[value.category] = [key];
		for (const key of Object.keys(Container).sort((a, b) => a.localeCompare(b)))
			capt += `${key.toLocaleUpperCase()}\n\n${Container[key]
				.sort((a, b) => a.localeCompare(b))
				.map((v, i) => `${i + 1}. ${v.capitalize()}`)
				.join("\n")}\n\n\n`;
		await client[botNum].reply({ from, quoted: message }, capt.trim());
	},
};

const getRandomCommand = () => Array.from(cmds.commands.keys())[Math.floor(Math.random() * cmds.commands.size)];
