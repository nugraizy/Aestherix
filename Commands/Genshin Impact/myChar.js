import path from "path";
import { __dirname } from "../../connect.js";
import { readJSON } from "../../Helper/Modules/index.js";

export default {
	name: "mycharacter",
	description: "Look-up your Genshin Impact character",
	usage: "!mycharacter",
	aliases: ["mychar"],
	category: "Genshin Impact",
	cooldown: 6,
	limit: 2,
	status: "enable",
	async run({ sender, query, message, from }, client) {
		const data = readJSON(path.join(__dirname, "Databases/Games/Genshin Impact/data.json"));
		const index = data.findIndex((v) => v.user == sender);
		if (index == -1) {
			return await client[botNum].reply({ from, quoted: message }, "Your character seems nowhere in the Database.");
		}
		query = `${data[index].uid} -char ${query}`;
		cmds.commands.get("genshinstalk").run({ sender, query, message, from }, client);
	},
};
