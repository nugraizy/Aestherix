<<<<<<< HEAD
import { delay } from "@adiwajshing/baileys";

export default {
	name: "groupbc",
	description: "Send Broadcast to all groups.",
	usage: "!groupbc <text>",
	aliases: ["gcbc"],
	category: "Owner",
	cooldown: 0,
	limit: 0,
	async run({ isOwner, from, query, message, sender }, client) {
		try {
			if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
			if (!query) return client[botNum].reply({ from, quoted: message }, "You must enter text");
			const getGroups = await client[botNum].groupFetchAllParticipating();
			const groups = Object.entries(getGroups)
				.slice(0)
				.map((entry) => entry[1]);
			const chats = check4Duplicate(groups.map((v) => v.id));
			let text = `\`\`\` • Group Broadcast \`\`\``;
			text += `\n\n${query.trim()}\n\n`;
			text += `\`\`\`Broadcast by @${sender.split("@")[0]}\`\`\``;
			for (let id of chats) {
				await delay(300);
				await client[botNum].sendMessage(id, { text, mentions: [sender] });
			}
		} catch (err) {
			log(err);
			await client[botNum].reply({ from, quoted: message }, err.stack);
		}
	},
};

const check4Duplicate = (chats) => {
	if (!Array.isArray(chats)) {
		return [];
	}
	const newChatIds = [];
	for (let id of chats) {
		if (!newChatIds.includes(id) && id !== "status@broadcast") {
			newChatIds.push(id);
		}
	}
	return newChatIds;
=======
export default {
    name: "bcgc",
    description: "Send Broadcast to all groups.",
    usage: "!bcgc <text>",
    aliases: ["groupbc"],
    category: "Owner",
    cooldown: 0,
    limit: 0,
    async run({ isOwner, from, query, message, sender }, client) {
        try {
            if (!isOwner) return client[botNum].reply({ from, quoted: message }, "You are not allowed to use this command");
            if (!query) return client[botNum].reply({ from, quoted: message }, "You must enter text");
            const getGroups = await client[botNum].groupFetchAllParticipating()
            const groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
            const chats = check4Duplicate(groups.map(v => v.id));
            let text = `\`\`\` • GROUP BROADCAST \`\`\``
                text += `\n\n${query}\n\n`
                text += `\`\`\`Broadcast by @${sender.split('@')[0]}\`\`\``;
            for (let id of chats) await client[botNum].sendMessage(id, { text, mentions: [sender] });
        } catch (e) {
            await client[botNum].reply({ from, quoted: message }, e.stack);
        }
    },
};

const check4Duplicate = (chats) => {
    if (!Array.isArray(chats)) {
        return [];
    } else {
        let newChatIds = [];
        for (let id of chats) {
			      !newChatIds.includes(id) && id !== "status@broadcast" ? newChatIds.push(id) : "";
		    }
		    return newChatIds;
	    }
>>>>>>> 1d9582d5eadfb4a9ff54aed60a1de44198e2e974
};
