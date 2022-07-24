export default {
	name: "setbio",
	description: "Set the bot's bio",
	usage: "!setbio <bio>",
	aliases: ["setinfo"],
	category: "Owner",
	cooldown: 0,
	limit: 0,status: "enable",
	async run({ isOwner, from, query, message }, client) {
		if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a bio to set");
		await client[botNum].setStatus(query);
	},
};
