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
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.query && message.mention.length == 0) return client[botNum].reply(message.from, "Please reply people message or mention people.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (message.query || message.mention.length > 0) {
			return await client[botNum].updateGroup(message.from, message.mention.length > 0 ? message.mention : message.query.split(",").parse(), "DEMOTE");
		}
		if (message.bodyQuoted) {
			return await client[botNum].updateGroup(message.from, [message.mediaData.participant], "DEMOTE");
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
