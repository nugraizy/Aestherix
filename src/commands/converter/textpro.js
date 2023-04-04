import axios from 'axios';
import fs from 'fs';
import imageSize from 'image-size';
import path from 'path';
import sharp from 'sharp';
import yargsParser from 'yargs-parser';
import _ from 'lodash';

import configuration from '../../helper/config/connect.js';
import { randomize } from '../../utils/modules/index.js';
import { textpro } from '../../utils/textmaker/textpro.js';

const dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/textprourl.json'));
const defaulType = 'image';

export default {
	name: 'textpro',
	description: 'Image maker using texts',
	usage: '!textpro <query> <model/number[REQUIRED]> [options]\nOptions:\n-stk / -img\nAvailable Model Type : !textpro -model',
	aliases: ['imgmake', 'maker', 'tpro'],
	category: 'Converter',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	async run({ from, message, query, args, cmd, filename, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please provide a query');
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

			let buttons = [];
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

			if (!isParam) {
				buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: 'Next' }, type: 1 });
			} else if (isParam && splitData[index + 1] !== undefined) {
				buttons.push({ buttonId: `${cmd} next ${index + 1} -model`, buttonText: { displayText: 'Next' }, type: 1 });
			}

			if (isParam && index !== 0) {
				buttons.push({ buttonId: `${cmd} prev ${index - 1} -model`, buttonText: { displayText: 'Previous' }, type: 1 });
			}

			buttons = buttons.reverse();

			return await client[botNum].send(
				from,
				{
					text: texts,
					footer: `Void Bot   page : ${Number(index) + 1}/${splitData.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
					buttons,
					headerType: 1
				},
				{ groupMetadata }
			);
		}

		models = !_.isNumber(parsed[0]) ? [randomize(dataJSON).url] : [_.get(dataJSON, parsed[0] - 1)?.url].filter(Boolean);

		if (models?.length === 0) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`Model ${models[0]} not found\n Type : !${this.name} -type`
			);
		}

		for (const model of models) {
			const result = await textpro(model, parsed.slice(1).join(' '));

			if ('error' in result) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, `something went wrong:\n\n${result.error}`);

				continue;
			}

			const { data } = await axios.get(result.dl, {
				responseType: 'arraybuffer'
			});

			const { width, height } = imageSize(data);

			const buffer = isStickers
				? await client[botNum].prepareSticker(data, path.join(__dirname, `src/media/temporary_files/${filename}`), undefined, {
						author: configuration.author,
						packname: configuration.packname
				  }) /* eslint-disable-line */
				: await sharp(data)
						.extract({ width: width - 40, height: height - 40, left: 0, top: 0 })
						.toBuffer();

			if (isImage) {
				await client[botNum].send(from, { image: buffer }, { groupMetadata, quoted: message });
			} else if (isStickers) {
				await client[botNum].send(from, { sticker: buffer }, { groupMetadata, quoted: message });
			} else {
				await client[botNum].send(from, { [defaulType]: buffer }, { groupMetadata, quoted: message });
			}
		}
	}
};
