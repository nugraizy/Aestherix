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
	status: "enable",
	restrict: true,
	async run(message, client, store) {
		if (!message.isAdmin && !message.isOwner) return client[botNum].reply({ from: message.from, quoted: message.message }, "You are not admin. This commands is only for admins.");
		if (!message.isBotAdmin) return client[botNum].reply({ from: message.from, quoted: message.message }, "Bot is not admin, Please promote admin before using moderation commands.");
		if (!message.query && message.mention.length == 0 && !message.bodyQuoted) return client[botNum].reply({ from: message.from, quoted: message.message }, "Please reply people message or mention people.");
		if (message?.mention.includes(botNum) || message.mediaData?.participant.includes(botNum)) return client[botNum].reply({ from: message.from, quoted: message.message }, "You can't kick me by myself.");
		if (message.query || message.mention.length > 0) {
			await client[botNum].updateGroup(message.from, message.mention.length > 0 ? message.mention : message.query.split(",").parse(), "REMOVE", false, /--?(force|F)/.test(message.query), message.message);
		}
		if (message.bodyQuoted) {
			await client[botNum].updateGroup(message.from, [message.mediaData.participant], "REMOVE", false, /--?(force|F)/.test(message.query), message.message);
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
