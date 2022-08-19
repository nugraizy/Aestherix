import Axios from "axios";
import fs from "fs";
import imageSize from "image-size";
import * as jsSplit from "js-split";
import path from "path";
import sharp from "sharp";
import yargsParser from "yargs-parser";
import { __dirname } from "../../connect.js";
import { randomize } from "../../Helper/index.js";
import { textpro } from "../../Utils/index.js";
const dataJSON = JSON.parse(fs.readFileSync("./Databases/Textmaker/textprourl.json"));
const defaulType = "image";

export default {
	name: "textpro",
	description: "Image maker using texts",
	usage: `!textpro <query> <model/number[REQUIRED]> [options]\nOptions:\n-stk / -img\nAvailable Model Type : !textpro -model`,
	aliases: ["imgmake", "maker", "tpro"],
	category: "Converter",
	cooldown: 4,
	limit: 3,
	status: "enable",
	async run({ from, message, query, args, cmd, filename, prettyNumber }, client) {
		if (!query) return client[botNum].reply({ from, quoted: message }, "Please provide a query");
		try {
			let {
				_: parsed,
				isStickers,
				isImage,
			} = yargsParser(query, {
				configuration: { "short-option-groups": false },
				alias: {
					isStickers: ["stk", "stick", "sticker", "sticks", "stc"],
					isImage: ["img", "image", "foto", "images"],
				},
			});
			let models = query.match(/model/g);
			parsed = models !== null ? parsed.slice(1) : parsed;
			if (models?.includes("model")) {
				if (args[1] == "next") args[2] = Number(args[2]);
				else if (args[1] == "prev") args[2] = Number(args[2]);
				const numbers = [];
				const index = args[2] ?? 0;
				const splitData = split(
					dataJSON.map((v, i) => {
						numbers.push(i + 1);
						return `${i + 1}.    ${v.effectName}`;
					}),
					10,
				);
				const data = splitData[index];
				const isParam = /\d/.test(args[2]);
				const texts = `Available Model
[ index ]     [ title ]
${data.join("\n")}

Use ${cmd} ${randomize(numbers)} Texts Here.`;
				let buttons = [];
				if (!isParam) {
					buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: "Next" }, type: 1 });
				} else if (isParam && splitData[index + 1] !== undefined) {
					buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: "Next" }, type: 1 });
				}
				if (isParam && index !== 0) {
					buttons.push({ buttonId: `${cmd} prev ${index - 1} -model`, buttonText: { displayText: "Previous" }, type: 1 });
				}
				buttons = buttons.reverse();
				return await client[botNum].sendMessage(from, {
					text: texts,
					footer: `Void Bot   page : ${Number(index) + 1}/${splitData.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
					buttons,
					headerType: 1,
				});
			}

			models =
				models == null
					? [randomize(dataJSON).url]
					: jsSplit
							.select(
								dataJSON,
								models?.map((v) => Number(v) - 1),
							)
							?.map((v) => v.url);
			if (models?.length == 0) return client[botNum].reply({ from, quoted: message }, `Model ${models[0]} not found\n Type : !${this.name} -type`);
			for (const model of models) {
				const result = await textpro(model, parsed.join(" "));
				if ("error" in result) {
					client[botNum].reply({ from, quoted: message }, `something went wrong:\n\n${result.error}`);
					continue;
				}
				const { data } = await Axios.get(result.dl, {
					responseType: "arraybuffer",
				});
				const { width, height } = imageSize(data);
				const buffer = isStickers
					? await client[botNum].prepareSticker(data, path.join(__dirname, `Temporary Files/${filename}`), undefined, { author, packname })
					: await sharp(data)
							.extract({ width: width - 40, height: height - 40, left: 0, top: 0 })
							.toBuffer();
				if (isImage) await client[botNum].sendMessage(from, { image: buffer }, { quoted: message });
				else if (isStickers) {
					await client[botNum].sendMessage(from, { sticker: buffer }, { quoted: message });
				} else await client[botNum].sendMessage(from, { [defaulType]: buffer }, { quoted: message });
			}
		} catch (err) {
			let str = "Something went wrong. Please send this error stack to the owner. :\n\n";
			str += `Type : ${err.name}\n`;
			str += `Message : ${err.message}`;
			await client[botNum].reply({ from, quoted: message }, str);
			log(err);
		}
	},
};

const split = (arrs, len) => {
	const arr = arrs;
	let length = len;
	len = arr.length;
	const out = [];
	let i = 0;
	let size;
	if (len % length === 0) {
		size = Math.floor(len / length);
		while (i < len) {
			out.push(arr.slice(i, (i += size)));
		}
	} else {
		while (i < len) {
			size = Math.ceil((len - i) / length--);
			out.push(arr.slice(i, (i += size)));
		}
	}
	return out;
};
