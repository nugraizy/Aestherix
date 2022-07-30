import PhoneNumber from "awesome-phonenumber";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "add",
	description: "Add people to group",
	usage: "!add <reply/tag member>",
	aliases: ["addmem", "invite"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	restrict: true,
	status: "enable",
	async run({ isAdmin, isBotAdmin, isOwner, from, query, mention, bodyQuoted, mediaData, message }, client) {
		if (!isAdmin && !isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!query && !bodyQuoted) return client[botNum].reply({ from, quoted: message }, "Please reply people message or reply people's ");
		if (!isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (mention?.includes(botNum) || mediaData?.participant?.includes(botNum)) return client[botNum].reply({ from, quoted: message }, "You can't add me by myself.");
		if (query) {
			if (mention.length > 0) return client[botNum].reply({ from, quoted: message }, "Please reply people message or input people's number.");
			await client[botNum].updateGroup(from, query.split(",").parse(), "ADD", false, false, message);
		}
		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], "ADD", false, false, message);
		}
	},
};

Array.prototype.parse = function () {
	return (
		removeDuplicatesArray(this)
			.filter((v) => PhoneNumber(`+${v.replace(/[A-Za-z-@\s+s\.whatsapp\.net]/g, "")}`).isValid())
			?.map((v) => `${v}@s.whatsapp.net`.trim()) || []
	);
};
