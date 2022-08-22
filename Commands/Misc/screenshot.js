import { isURL } from "../../Helper/index.js";
import { getScreenshot } from "../../Utils/Misc/webScreenshot.js";

export default {
	name: "screenshots",
	description: "Get a screenshot of a website",
	category: "Misc",
	usage: "!screenshot <url> --<?type> (phone, tablet, desktop) default is desktop.",
	aliases: ["screenshot", "ss"],
	cooldown: 3,
	limit: 2,
	status: "enable",
	async run(message, client) {
		if (!message.query) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a website URL");
		}
		const parseOptions = message.query.includes("--") ? message.query.split("--") : message.query;
		let type = "desktop";
		if (Array.isArray(parseOptions)) {
			if (!isURL(parseOptions[0])) {
				return await client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a valid URL");
			}
			message.query = parseOptions[0];
			type = parseOptions[1];
		} else if (!isURL(message.query)) {
			return await client[botNum].reply({ from: message.from, quoted: message.message }, "Please specify a valid URL");
		}
		const { buffer } = await getScreenshot(message.query, type);
		await client[botNum].sendMessage(message.from, { image: new Buffer.from(buffer, "base64") }, { quoted: message.message });
	},
};
