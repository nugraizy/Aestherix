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
	async run({ isAdmin, isBotAdmin, from, query, mention, bodyQuoted, mediaData }, client) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!query && !bodyQuoted) return client[botNum].reply(from, "Please reply people message or reply people's ");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (mention.includes(botNum) || mediaData.participant.includes(botNum)) return client[botNum].reply(from, "You can't add me by myself.");
		if (query) {
			if (mention.length > 0) return client[botNum].reply(from, "Please reply people message or input people's number.");
			await client[botNum].updateGroup(from, query.split(",").parse(), "ADD");
		}
		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], "ADD");
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
