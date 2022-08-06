export default {
	name: "delete",
	description: "Delete people's messages",
	usage: "!delete <reply chat>",
	aliases: ["del"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	status: "enable",
	async run({ isOwner, isAdmin, from, mediaData, message, bodyQuoted }, client) {
		if (!isAdmin && !isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!bodyQuoted) return client[botNum].reply({ from, quoted: message }, "You must reply to a message to delete it");
		await client[botNum].sendMessage(from, {
			delete: {
				id: mediaData.stanzaId,
				participant: mediaData.participant,
				remoteJid: from,
			},
		});
	},
};
