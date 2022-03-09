export default {
	name: "setbio",
	description: "Set the bot's bio",
	usage: "!setbio <bio>",
	aliases: ["setinfo"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	async run({ isOwner, from, query }, client) {
		if (!isOwner) return client.reply(from, "You are not allowed to use this command");
		if (!query) return client.reply(from, "You must provide a bio to set");
		await client[botNum].setStatus(query);
	},
};
