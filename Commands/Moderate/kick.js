import PhoneNumber from "awesome-phonenumber";
import { removeDuplicatesArray } from "../../Helper/Modules/index.js";

export default {
	name: "kick",
	description: "Kick member from group.",
	usage: "!kick <reply/tag member>",
	aliases: ["remove", "rem", "rm"],
	category: "Moderation",
	cooldown: 2,
	limit: 2,
	async run(message, client, store) {
		if (!message.isAdmin) return client[botNum].reply(message.from, "You are not admin. This commands is only for admins.");
		if (!message.query && message.mention.length == 0 && !message.bodyQuoted) return client[botNum].reply(message.from, "Please reply people message or mention people.");
		if (!message.isBotAdmin) return client[botNum].reply(message.from, "Bot is not admin, Please promote admin before using moderation commands.");
		if (message.mention.includes(botNum) || message.mediaData.participant.includes(botNum)) return client[botNum].reply(message.from, "You can't kick me by myself.");
		if (message.query || message.mention.length > 0) {
			await client[botNum].updateGroup(message.from, message.mention.length > 0 ? message.mention : message.query.split(",").parse(), "REMOVE", false, /--?(force|-F)/.test(message.query));
		}
		if (message.bodyQuoted) {
			await client[botNum].updateGroup(message.from, [message.mediaData.participant], "REMOVE", false, /--?(force|-F)/.test(message.query));
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
