export default {
	name: "setname",
	description: "Set the bot's name",
	usage: "!setname <name>",
	aliases: ["setnick", "nick", "name"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	status: "enable",
	async run({ isOwner, from, query, message }, client) {
		if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a name to set");
		if (typeof client[botNum].updateProfileName !== "function")
			return client[botNum].reply({ from, quoted: message }, "Your current Baileys didn't support changing profile name, please update to latest commit of the Baileys.");
		await client[botNum].updateProfileName(query);
	},
};
