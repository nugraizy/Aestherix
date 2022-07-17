import parser from "yargs-parser";

export default {
	name: "ytplay",
	description: "Instantly Download a YouTube video/audio.",
	usage: "!ytplay <query> [options]\nOptions:\n-mp3, Download as Audio\n-mp4, Download as Video",
	aliases: ["ytp", "yt", "play"],
	category: "Downloader",
	cooldown: 5,
	limit: 4,
	async run(message, client) {
		if (!message.query) return client[botNum].reply({ quoted: message.message, from: message.from }, "Please enter a query");
		let { audio, video } = parser(message.query.toLowerCase(), { configuration: { "short-option-groups": false }, alias: { audio: ["aud", "mp3", "musik", "music"], video: ["vid", "mp4", "video", "videos"] } });
		if (audio) cmds.commands.get("ytaudio").run(message, client);
		if (video) cmds.commands.get("ytvideo").run(message, client);
		if (!audio && !video) cmds.commands.get("ytaudio").run(message, client);
	},
};
