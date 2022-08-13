import _ from "lodash";
import moment from "moment-timezone";
import path from "path";
import { __dirname } from "../../connect.js";
import { trigger } from "../../Helper/Canvas/index.js";
import { color, ERRLOG, INFOLOG, readBuffer } from "../../Helper/Modules/index.js";

const defaultOptions = {
	output: "sticker",
};

export default {
	name: "trigger",
	description: "Trigger someone profile picture or send/reply an image to trigger",
	category: "Converter",
	aliases: ["trig", "t"],
	usage: "!trigger <@user/(reply/send image)>",
	cooldown: 5,
	limit: 1,
	status: "enable",
	async run({ bodyQuoted, mention, isMediaImage, from, extractMediaData, mediaData, filename, prettyNumber, sender, query, message, stickerAble, typeQuoted, typeSticker }, client) {
		if (mention.length == 0 && !isMediaImage) return client[botNum].reply({ from, quoted: message }, "Please mention or send/reply an image to pet");
		try {
			const time = moment().format("HH:mm:ss DD/MM");
			let options = {};
			if (/--?images?/.test(query)) options = _.defaults({ output: "image" }, defaultOptions);
			else options = _.defaults({ output: "sticker" }, defaultOptions);
			if (bodyQuoted && !isMediaImage) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				const profile = await client[botNum].profilePictureUrl(mediaData.participant, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
				options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
				const result = await trigger(profile, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
				return;
			}
			if (isMediaImage) {
				if (!stickerAble)
					return client[botNum].reply(
						{ from, quoted: message },
						`Please send/reply a regular media to be triggered. Can't convert ${typeQuoted}, only : ${typeSticker
							.slice(
								typeSticker.findIndex((v) => v == "videoMessage"),
								1,
							)
							.join(", ")
							.capitalize()}`,
					);
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} ${color(prettyNumber, "#ff71ce")}`);
				const buffer = client[botNum].downloadMediaMessage(mediaData);
				const result = await trigger(buffer, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
			}
			for (const mentioned of mention) {
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
				const profile = await client[botNum].profilePictureUrl(mentioned, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
				options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
				const result = await trigger(profile, sender, options);
				if (options.output == "sticker") client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
				else client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
				INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggered`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name ?? "Triggering"}\n`;
			str += `Message : ${err.message ?? err.error}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};
