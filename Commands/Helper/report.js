export default {
	name: "report",
	description: "Report bug or error to the owner",
	usage: "!report",
	aliases: ["laport"],
	category: "Helper",
	cooldown: 40,
	limit: 0,
	status: "enable",
	async run({ from, message, query, sender, pushname, prettyNumber, settings }, client) {
		if (!query) return await client[botNum].reply({ from, quoted: message }, "Please provide a message to report");
		if (query.length < 20) return await client[botNum].reply({ from, quoted: message }, "Please describe the problem in detail. Min. 20 characters");
		const capt = `Thanks for reporting!\n\nThis error will be reviewed and fixed as soon as possible.\n\nIf you have any questions, please contact the owner.`;
		await client[botNum].sendMessage(from, {
			text: capt.trim(),
			footer: "Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪",
			templateButtons: [],
			headerType: 1,
		});
		await client[botNum].sendMessage(settings.owner_number, {
			text: query,
			footer: `Sender Name : ${pushname}
ID : ${sender}
ID Formatter : ${prettyNumber}
ID API : wa.me/${sender.split("@")[0]}
The Problem Occured in : ${from}`,
			templateButtons: [{ urlButton: { displayText: "Contact Person", url: `wa.me/${sender.split("@")[0]}` } }],
			headerType: 1,
		});
	},
};
