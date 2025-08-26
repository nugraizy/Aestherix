import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import yargsParser from 'yargs-parser';
import _ from 'lodash';
import { fetch } from 'undici';

import configuration from '../../helper/config/connect.js';
import { randomize } from '../../utils/modules/index.js';
import { ephoto360 } from '../../utils/textmaker/ephoto360.js';

const dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/ephoto360url.json'));
const defaulType = 'image';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'ephoto360',
	minifiedDescription: 'Ephoto360 Text Maker',
	description: 'Image maker using texts',
	usage:
		'!ephoto360 `<query>` `<model/number[REQUIRED]>` `[options]`\nOptions:\n-stk / -img\nAvailable Model Type : !ephoto360 -model',
	aliases: ['ephoto', 'epht'],
	category: 'Converter',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	async run({ from, message, query, args, cmd, filename, isMediaImage, extractMediaData, typeQuoted }, client) {
		if (!query) {
			return await client.instance.reply('Please provide a query', { from, quoted: message });
		}

		let {
			_: parsed,
			isStickers,
			isImage
		} = yargsParser(query, {
			configuration: { 'short-option-groups': false },
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		let models = query.match(/model/g);

		parsed = models !== null ? parsed.slice(1) : parsed;

		if (models?.includes('model')) {
			if (args[1] === 'next') {
				args[2] = Number(args[2]);
			} else if (args[1] === 'prev') {
				args[2] = Number(args[2]);
			}

			const numbers = [];
			const index = args[2] ?? 0;

			const splitData = _.chunk(
				dataJSON.map((v, i) => {
					numbers.push(i + 1);
					return `${i + 1}.    ${v.effectName}`;
				}),
				10
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

			return await client.instance.send(
				from,
				{
					text: texts,
					footer: `Void Bot   page : ${Number(index) + 1}/${splitData.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
					buttons,
					headerType: 1
				},
				{}
			);
		}

		models = !_.isNumber(parsed[0]) ? [randomize(dataJSON).url] : [_.get(dataJSON, parsed[0] - 1)?.url].filter(Boolean);

		if (models?.length === 0) {
			return await client.instance.reply(`Model ${models[0]} not found\n Type : !${this.name} -type`, {
				from,
				quoted: message
			});
		}

		for (const model of models) {
			let buffers = null;

			if (isMediaImage) {
				await client.instance.downloadAndSaveMediaMessage(
					extractMediaData,
					path.join(__dirname, `src/media/temporary_files/${filename}`),
					typeQuoted
				);

				buffers = path.join(__dirname, `src/media/temporary_files/${filename}`);
			}

			const result = await ephoto360(model, parsed.slice(1).join(' '), buffers);

			if (result?.error) {
				await client.instance.reply(`something went wrong:\n\n${result.error}`, { from, quoted: message });

				continue;
			}

			const data = Buffer.from(await (await fetch(result.preview)).arrayBuffer(), 'base64');

			const buffer = isStickers
				? await client.instance.prepareSticker(
						data,
						path.join(__dirname, `src/media/temporary_files/${filename}`),
						undefined,
						{
							author: configuration.author,
							packname: configuration.packname
						}
				  ) /* eslint-disable-line */
				: (async () => {
						const image = sharp(data);
						const { width, height } = await image.metadata();

						return await image.extract({ width: width - 40, height: height - 40, left: 0, top: 0 }).toBuffer();
				  })(); /*eslint-disable-line*/

			if (isImage) {
				await client.instance.send(from, { image: buffer }, { quoted: message });
			} else if (isStickers) {
				await client.instance.send(from, { sticker: buffer }, { quoted: message });
			} else {
				await client.instance.send(from, { [defaulType]: buffer }, { quoted: message });
			}
		}
	}
};
