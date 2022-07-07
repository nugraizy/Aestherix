export default {
	name: "ytplay",
	description: "Play a youtube video.",
	usage: "!ytplay <query>",
	aliases: ["ytp", "yt", "play"],
	category: "Downloader",
	cooldown: 5,
	limit: 4,
	async run(message, client) {
		if (!message.query) return client[botNum].reply({ quoted: message.message, from: message.from }, "Please enter a query");
		if (/--?(aud(io)?|mp3|lagu|song(s)?)/.test(message.query)) {
			cmds.commands.get("ytaudio").run(message, client);
		} else if (/--?(vid(eo)?s?|mp4|clips?)/.test(message.query)) {
			cmds.commands.get("ytvideo").run(message, client);
		} else cmds.commands.get("ytaudio").run(message, client);
	},
};
