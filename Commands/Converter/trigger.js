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
		if (mention.length == 0 && !isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, "Please mention or send/reply an image to pet");
		}
		const time = moment().format("HH:mm:ss DD/MM");
		let options = {};
		options = /--?images?/.test(query) ? _.defaults({ output: "image" }, defaultOptions) : _.defaults({ output: "sticker" }, defaultOptions);
		if (bodyQuoted && !isMediaImage) {
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
			const profile = await client[botNum].profilePictureUrl(mediaData.participant, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
			options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
			const result = await trigger(profile, sender, options);
			if (options.output == "sticker") {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
			return;
		}
		if (isMediaImage) {
			if (!stickerAble) {
				return await client[botNum].reply(
					{ from, quoted: message },
					`Please send/reply a regular media to be triggered. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v == "videoMessage"),
							1,
						)
						.join(", ")
						.capitalize()}`,
				);
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} ${color(prettyNumber, "#ff71ce")}`);
			const buffer = await client[botNum].downloadMediaMessage(mediaData);
			const result = await trigger(buffer, sender, options);
			if (options.output == "sticker") {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Converted Media`, "#01cdfe")} for ${color(prettyNumber, "#ff71ce")}`);
		}
		for (const mentioned of mention) {
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggering`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
			const profile = await client[botNum].profilePictureUrl(mentioned, "image").catch(() => readBuffer(path.join(__dirname, "Media Files/blank.png")));
			options = _.defaults({ filename: path.join(__dirname, `Temporary Files/${filename}`) }, defaultOptions);
			const result = await trigger(profile, sender, options);
			if (options.output == "sticker") {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, "base64") });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, "base64"), mimetype: "video/mp4" });
			}
			INFOLOG(`[${color(time, "cyan")}]`, `${color(`Triggered`, "#01cdfe")} ${color(mentioned, "#ff71ce")}`);
		}
	},
};
