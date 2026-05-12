import fs from 'fs';
import imageSize from 'image-size';
import _ from 'lodash';
import sharp from 'sharp';
import { fetch } from 'undici';
import yargsParser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomize } from '../../utils/modules/index.js';
import { textpro } from '../../utils/textmaker/textpro.js';

const dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/textprourl.json'));
const defaulType = 'image';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'textpro',
	minifiedDescription: 'Textpro Text Maker',
	description: 'Image maker using texts',
	usage:
		'!textpro `<query>` `<model/number[REQUIRED]>` `[options]`\nOptions:\n-stk / -img\nAvailable Model Type : !textpro -model',
	aliases: ['imgmake', 'maker', 'tpro'],
	category: 'Converter',
	cooldown: 4,
	limit: 3,
	status: 'enable',
	async run({ from, message, query, args, cmd, filename }, client) {
		if (!query) {
			return await client.reply(from, 'Please provide a query', message);
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
				buttons.push({
					buttonId: cmdId(cmd, 'next ' + (index + 1) + ' -model'),
					buttonText: { displayText: 'Next' },
					type: 1
				});
			} else if (isParam && splitData[index + 1] !== undefined) {
				buttons.push({
					buttonId: cmdId(cmd, 'next ' + (index + 1) + ' -model'),
					buttonText: { displayText: 'Next' },
					type: 1
				});
			}

			if (isParam && index !== 0) {
				buttons.push({
					buttonId: cmdId(cmd, 'prev ' + (index - 1) + ' -model'),
					buttonText: { displayText: 'Previous' },
					type: 1
				});
			}

			buttons = buttons.reverse();

			return await client.send(
				from,
				{
					text: texts,
					footer: `Page : ${Number(index) + 1}/${splitData.length}\nPowered by Hidden Finder`,
					buttons,
					headerType: 1
				},
				{}
			);
		}

		models = !_.isNumber(parsed[0]) ? [randomize(dataJSON).url] : [_.get(dataJSON, parsed[0] - 1)?.url].filter(Boolean);

		if (models?.length === 0) {
			return await client.reply(from, `Model ${models[0]} not found\n Type : !${this.name} -type`, message);
		}

		for (const model of models) {
			const result = await textpro(model, parsed.slice(1).join(' '));

			if (result?.error) {
				await client.reply(from, `something went wrong:\n\n${result.error}`, message);
				continue;
			}

			const data = Buffer.from(await (await fetch(result.dl)).arrayBuffer(), 'base64');

			const { width, height } = imageSize(data);

			const buffer = isStickers
				? await client.prepareSticker(data, undefined, {
						author: configuration.author,
						packname: configuration.packname
					})
				: await sharp(data)
						.extract({ width: width - 40, height: height - 40, left: 0, top: 0 })
						.toBuffer();

			if (isImage) {
				await client.send(from, { image: buffer }, { quoted: message });
			} else if (isStickers) {
				await client.send(from, { sticker: buffer }, { quoted: message });
			} else {
				await client.send(from, { [defaulType]: buffer }, { quoted: message });
			}
		}
	}
};
