import moment from "moment-timezone";
import rgbcolor from "rgb-color";
import { ttp } from "../../Helper/Canvas/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "staticsticker",
	description: "Generate static sticker",
	category: "Converter",
	usage: "ttp <text> [--color] [--fonts]",
	aliases: ["ttp"],
	cooldown: 5,
	limit: 1,
	async run({ from, query, message, sender, prettyNumber, bodyQuoted }, client) {
		if (!query) query = "Mana text nya?";
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			const parseOptions = query.includes("--") ? query.split("--") : query;
			let colors = [];
			if (Array.isArray(parseOptions)) {
				query = parseOptions[0];
				colors.push(...parseOptions.slice(1));
				for (const color of colors) {
					if (color.trim() == "rainbow") {
						colors = ["3fffff", "3fff3f", "ff3fff", "ff3f3f", "3f3fff"];
						break;
					} else {
						const check = rgbcolor(color.trim());
						const index = colors.findIndex((v) => v == color);
						if (check.isValid()) {
							colors[index] = check.hex();
						} else {
							colors.splice(index, 1);
						}
					}
				}
			}
			if (bodyQuoted) {
				const { buffer } = await ttp(sender, bodyQuoted, colors);
				await client[botNum].sendMessage(from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message });
				return INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
			}
			if (query) {
				const { buffer } = await ttp(sender, query, colors);
				await client[botNum].sendMessage(from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message });
				return INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
			}
			return message.reply("Please enter text to convert to sticker");
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
