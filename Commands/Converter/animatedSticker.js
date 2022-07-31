import moment from "moment-timezone";
import rgbcolor from "rgb-color";
import yargsParser from "yargs-parser";
import { attp } from "../../Helper/Canvas/index.js";
import { INFOLOG, color } from "../../Helper/Modules/index.js";

export default {
	name: "animatedsticker",
	description: "Generate animated gif sticker",
	category: "Converter",
	usage: "!gittp <text> [--color]",
	aliases: ["gittp"],
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ from, query, message, sender, prettyNumber, bodyQuoted }, client) {
		try {
			if (!query && !bodyQuoted) query = "Mana text nya?";
			const time = moment().format("HH:mm:ss DD/MM");
			let parseOptions = yargsParser(query, { configuration: { "short-option-groups": false } });
			parseOptions = {
				text: parseOptions._.join(" "),
				color:
					Object.keys(parseOptions)
						.filter((v) => v !== "_")?.[0]
						?.split(",") || [],
			};
			query = parseOptions.text;
			if (parseOptions.color) {
				for (const color of parseOptions.color) {
					if (color.trim() == "rainbow") {
						parseOptions.color = ["3fffff", "3fff3f", "ff3fff", "ff3f3f", "3f3fff"];
						break;
					} else {
						const check = rgbcolor(color.trim());
						const index = parseOptions.color.findIndex((v) => v == color);
						if (check.isValid()) {
							parseOptions.color[index] = check.hex();
						} else {
							parseOptions.color.splice(index, 1);
						}
					}
				}
			}
			if (bodyQuoted) {
				const { buffer } = await attp(sender, bodyQuoted, parseOptions.color);
				await client[botNum].sendMessage(from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message });
				return INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
			}
			if (query) {
				const { buffer } = await attp(sender, query, parseOptions.color);
				await client[botNum].sendMessage(from, { sticker: new Buffer.from(buffer, "base64") }, { quoted: message });
				return INFOLOG(`[${color(time, "cyan")}]`, `${color(`Sticker is sent`, "#01cdfe")} to ${color(prettyNumber, "#ff71ce")}`);
			}
			return client[botNum].reply({ from, quoted: message }, "Please enter text to convert to sticker");
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
