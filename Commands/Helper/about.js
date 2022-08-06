import { readJSON } from "../../Helper/index.js";

export default {
	name: "about",
	description: "Shows the menu",
	usage: "!menu",
	aliases: ["help"],
	category: "Helper",
	cooldown: 10,
	limit: 5,
	status: "enable",
	async run({ from, message }, client) {
		const capt = `Bot Name : Void
Total Commands : ${cmds.commands.size}
Bot Version : ${readJSON("./package.json").version.toUpperCase()}
Bot Creator : Nanda
Github Uname : nugraizy
Github Repo : Currently not available (private)

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;
		await client[botNum].sendMessage(from, {
			text: capt.trim(),
			footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
			templateButtons: [],
			headerType: 1,
		});
		await client[botNum].sendMessage(from, {
			text: `Thanks To :
Aldi a.k.a Alphanum404 a.k.a ctOS v2.0
Benni a.k.a Bennz
Hanif a.k.a Mrhrtz
Nafiz
Toby a.k.a Tobz`,
			footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
			templateButtons: [{ urlButton: { displayText: "\t", url: "\t" } }],
			headerType: 1,
		});
	},
};
