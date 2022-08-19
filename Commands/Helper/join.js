export default {
	name: "join",
	description: "Ask bot to join your group",
	usage: "!join <url>",
	aliases: ["j"],
	category: "Helper",
	limit: 7,
	cooldown: 5,
	status: "enable",
	async run({ from, query, message, sender, isOwner }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "You must provide a url.");
		try {
			const reg = regex(query);
			if (!reg) return await client[botNum].reply({ from, quoted: message }, "Invalid url.");
			const metadataInvite = await client[botNum].groupGetInviteInfo(reg);
			const metadataGroup = await client[botNum].groupMetadata(metadataInvite?.id);
			const participants = metadataInvite.participants?.map((v) => v?.id);
			const isAdmin = metadataInvite.participants?.map((v) => v?.admin)?.includes(sender);
			if (metadataGroup.id !== "") {
				await client[botNum].reply({ from, quoted: message }, "I'm already in this group.");
			} else if (participants?.length < 120 && !isOwner) {
				await client[botNum].reply({ from, quoted: message }, "This group is not big enough to join. Minimum 120 participants.");
			} else if (!isAdmin && !isOwner) {
				await client[botNum].reply({ from, quoted: message }, "You must be an admin to invite bot to group.");
			} else if (metadataInvite) {
				await client[botNum].groupAcceptInvite(reg);
				await client[botNum].reply({ from, quoted: message }, "I'm joining this group.");
				await client[botNum].sendMessage(metadataInvite.id, { text: `@${sender.split("@")[0]} has invited me to the group. Tysm.`, mentions: [sender] });
				await client[botNum].buttonText(metadataInvite.id, "Click to open menu", "Powered by Hidden Finder", [{ buttonId: ".menu", buttonText: { displayText: "Menu" }, type: 1 }]);
			} else {
				await client[botNum].reply({ from, quoted: message }, "Invalid url.");
			}
		} catch (err) {
			log(err);
		}
	},
};

const regex = (input) => {
	const regex = /^(?:https?:\/\/)?(?:chat\.)?(?:whatsapp\.com)\/([\d\w]{21,23})/;
	if (!regex.test(input)) {
		return false;
	}
	const match = regex.exec(input);
	if (match) {
		return match[1];
	}
	return false;
};
