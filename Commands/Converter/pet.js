import moment from "moment-timezone";
import path from "path";
import _ from "lodash";
import { pet } from "../../Utils/Converter/index.js";
import { __dirname } from "../../connect.js";
import { INFOLOG, color, readBuffer } from "../../Helper/Modules/index.js";
import { createExif } from "../../Utils/Misc/index.js";

const defaultOptions = {
	output: "sticker",
	duration: 5,
	resolution: 521,
};

export default {
	name: "petpet",
	description: "Pet someone profile picture or send/reply an image to pet",
	category: "Converter",
	aliases: ["pet", "petpetpet"],
	usage: "petpet <@user/(reply/send image)>",
	cooldown: 5,
	limit: 1,
	async run({ bodyQuoted, mention, isMediaImage, from, extractMediaData, mediaData, filename, prettyNumber, sender, query, message }, client) {
		if (mention.length == 0 && !isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please mention or send/reply an image to pet");
		createExif("Made by Nanda", "Void bot");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			let options = {};
			let i = 0;
			if (/--?images?/.test(query)) options = _.defaults({ output: "image" }, defaultOptions);
			else options = _.defaults({ output: "sticker" }, defaultOptions);
			if (bodyQuoted && !isMediaImage) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petting`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				const profile = await client[botNum].profilePictureUrl(mediaData.participant, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
				options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
				const result = await pet(profile, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				return;
			}
			if (isMediaImage) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petting`, "#01cdfe")} ${color(prettyNumber, "#ff71ce")}`);
				const file = await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`));
				const result = await pet(file, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				return;
			}
			for (const mentioned of mention) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petting`, "#01cdfe")} ${color(mention[i], "#ff71ce")}`);
				const profile = await client[botNum].profilePictureUrl(mentioned[i], "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
				options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
				const result = await pet(profile, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petted`, "#01cdfe")} ${color(mention[i], "#ff71ce")}`);
				i++;
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Petting"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str + (err.languages ? err.languages.map((v) => `\n${v.code} - ${v.name}`).join("\n") : ""));
			log(err);
		}
	},
};
