import PhoneNumber from "awesome-phonenumber";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "promote",
	description: "Promote member to admin.",
	usage: "!promote <reply/tag member>",
	aliases: ["prmt", "admin", "adm"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	restrict: true,
	async run({ isAdmin, isBotAdmin, query, from, bodyQuoted, mediaData, mention }, client, store) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!query && mention.length == 0 && !bodyQuoted) return client[botNum].reply(from, "Please reply people message or mention people.");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (mention.includes(botNum) || mediaData.participant.includes(botNum)) return client[botNum].reply(from, "You can't promote me by myself.");
		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, mention.length > 0 ? mention : query.split(",").parse(), "PROMOTE");
		}
		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], "PROMOTE");
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
