import PhoneNumber from "awesome-phonenumber";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "demote",
	description: "Demote admin to member.",
	usage: "!demote <reply/tag member>",
	aliases: ["demt", "member", "mem", "dmt"],
	category: "Moderation",
	cooldown: 10,
	limit: 2,
	status: "enable",
	restrict: true,
	async run({ isAdmin, isBotAdmin, isOwner, mention, from, mediaData, query, bodyQuoted, message }, client, store) {
		if (!isAdmin && !isOwner) return client[botNum].reply({ from, quoted: message }, "You are not admin. This commands is only for admins.");
		if (!query && mention.length == 0 && !bodyQuoted) return client[botNum].reply({ from, quoted: message }, "Please reply people message or mention people.");
		if (!isBotAdmin) return client[botNum].reply({ from, quoted: message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (mention?.includes(botNum) || mediaData?.participant?.includes(botNum)) return client[botNum].reply({ from, quoted: message }, "You can't demote me by myself.");
		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, mention.length > 0 ? mention : query.split(",").parse(), "DEMOTE", false, false, message);
		}
		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], "DEMOTE", false, false, message);
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
