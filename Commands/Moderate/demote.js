import PhoneNumber from "awesome-phonenumber";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "demote",
	description: "Demote admin to member.",
	usage: "!demote <reply/tag member>",
	aliases: ["demt", "member", "mem"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	restrict: true,
	async run({ isAdmin, isBotAdmin, mention, from, mediaData, query, bodyQuoted }, client, store) {
		if (!isAdmin) return client[botNum].reply(from, "You are not admin. This commands is only for admins.");
		if (!query && mention.length == 0 && !bodyQuoted) return client[botNum].reply(from, "Please reply people message or mention people.");
		if (!isBotAdmin) return client[botNum].reply(from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (mention.includes(botNum) || mediaData.participant.includes(botNum)) return client[botNum].reply(from, "You can't demote me by myself.");
		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, mention.length > 0 ? mention : query.split(",").parse(), "DEMOTE", false, /--?(force|F)/.test(query));
		}
		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], "DEMOTE", false, /--?(force|F)/.test(query));
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
