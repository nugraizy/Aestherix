/* global botNum */
import Axios from 'axios';
import fs from 'fs';
import * as jsSplit from 'js-split';
import path from 'path';
import sharp from 'sharp';
import yargsParser from 'yargs-parser';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { randomize } from '../../helper/index.js';
import { ephoto360 } from '../../utils/index.js';

const dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/ephoto360url.json'));
const defaulType = 'image';

const split = (arrs, len) => {
	const arr = arrs;
	const out = [];

	let length = len;
	let i = 0;
	let size;

	len = arr.length;

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

export default {
	name: 'ephoto360',
	description: 'Image maker using texts',
	usage: '!ephoto360 <query> <model/number[REQUIRED]> [options]\nOptions:\n-stk / -img\nAvailable Model Type : !ephoto360 -model',
	aliases: ['ephoto', 'epht'],
	category: 'Converter',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	async run({ from, message, query, args, cmd, filename, isMediaImage, extractMediaData, typeQuoted }, client) {
		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a query');
		}

		let {
			_: parsed,
			isStickers,
			isImage,
		} = yargsParser(query, {
			configuration: { 'short-option-groups': false },
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images'],
			},
		});

		let models = query.match(/model/g);

		parsed = models !== null ? parsed.slice(1) : parsed;

		if (models?.includes('model')) {
			if (args[1] == 'next') {
				args[2] = Number(args[2]);
			} else if (args[1] == 'prev') {
				args[2] = Number(args[2]);
			}

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
${data.join('\n')}

Use ${cmd} ${randomize(numbers)} Texts Here.`;

			let buttons = [];

			if (!isParam) {
				buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: 'Next' }, type: 1 });
			} else if (isParam && splitData[index + 1] !== undefined) {
				buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: 'Next' }, type: 1 });
			}

			if (isParam && index !== 0) {
				buttons.push({ buttonId: `${cmd} prev ${index - 1} -model`, buttonText: { displayText: 'Previous' }, type: 1 });
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

		if (models?.length == 0) {
			return await client[botNum].reply({ from, quoted: message }, `Model ${models[0]} not found\n Type : !${this.name} -type`);
		}

		for (const model of models) {
			let buffers = null;

			if (isMediaImage) {
				await client[botNum].downloadAndSaveMediaMessage(extractMediaData, path.join(__dirname, `temporary_files/${filename}`), typeQuoted);

				buffers = path.join(__dirname, `temporary_files/${filename}`);
			}

			const result = await ephoto360(model, parsed.join(' '), buffers);

			if ('error' in result) {
				await client[botNum].reply({ from, quoted: message }, `something went wrong:\n\n${result.error}`);

				continue;
			}

			const { data } = await Axios.get(result.preview, {
				responseType: 'arraybuffer',
			});

			const buffer = isStickers
				? await client[botNum].prepareSticker(data, path.join(__dirname, `temporary_files/${filename}`), undefined, { author: configuration.author, packname: configuration.packname })
				: (async () => {
						const image = sharp(data);
						const { width, height } = await image.metadata();

						return await image.extract({ width: width - 40, height: height - 40, left: 0, top: 0 }).toBuffer();
				  })(); /*eslint-disable-line*/

			if (isImage) {
				await client[botNum].sendMessage(from, { image: buffer }, { quoted: message });
			} else if (isStickers) {
				await client[botNum].sendMessage(from, { sticker: buffer }, { quoted: message });
			} else {
				await client[botNum].sendMessage(from, { [defaulType]: buffer }, { quoted: message });
			}
		}
	},
};
