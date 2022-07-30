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
	resolution: 512,
};

export default {
	name: "petpet",
	description: "Pet someone profile picture or send/reply an image to pet",
	category: "Converter",
	aliases: ["pet", "petpetpet"],
	usage: "!petpet <@user/(reply/send image)>",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ bodyQuoted, mention, isMediaImage, from, extractMediaData, mediaData, filename, prettyNumber, sender, query, message, stickerAble, typeQuoted, typeSticker }, client) {
		if (mention.length == 0 && !isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please mention or send/reply an image to pet");
		createExif("Made by Nanda", "Void bot");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			let options = {};
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
				if (!stickerAble)
					return client[botNum].reply(
						{ from, quoted: message },
						`Please send/reply a regular media to be petted. Can't convert ${typeQuoted}, only : ${typeSticker
							.slice(
								typeSticker.findIndex((v) => v == "videoMessage"),
								1,
							)
							.join(", ")
							.capitalize()}`,
					);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petting`, "#01cdfe")} ${color(prettyNumber, "#ff71ce")}`);
				client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split("/")[1]}`)).then(async (file) => {
					try {
						const result = await pet(file, sender, options);
						if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
						else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
						INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
						return;
					} catch (err) {
						let str = "Something went wrong :\n\n";
						str += `Type : ${err.name}\n`;
						str += `Message : ${err.message}`;
						await client[botNum].reply({ from, quoted: message }, str);
						ERRLOG(`[${color(time, "cyan")}]`, `${color(`Failed to Pet a Picture. Reason : ${err.name}`, "red")} for ${color(sender, "#ff71ce")}`);
						log(err);
					}
				});
			}
			for (const mentioned of mention) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petting`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
				const profile = await client[botNum].profilePictureUrl(mentioned, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
				options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
				const result = await pet(profile, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Petted`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Petting"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
