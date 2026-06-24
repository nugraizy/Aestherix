import fs from 'fs';
import _ from 'lodash';
import sharp from 'sharp';
import { fetch } from 'undici';
import yargsParser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { randomize } from '../../utils/modules/index.js';
import { ephoto360 } from '../../utils/textmaker/ephoto360.js';
import { defineCommand } from '../_define.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';

let dataJSON = {};

try {
	dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/ephoto360url.json'));
} catch {
	/* file may not exist — will be populated at runtime */
}
const defaulType = 'image';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lc = useLocale(locale, 'converter');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
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

			const texts = `${Lc.labels.availableModel}
${data.join('\n')}

${t(locale, 'converter.labels.useModel', [cmd, randomize(numbers)])}`;

			let buttons = [];

			if (!isParam) {
				buttons.push({
					buttonId: cmdId(cmd, 'next ' + (index + 1) + ' -model'),
					buttonText: { displayText: L.core.buttons.next },
					type: 1
				});
			} else if (isParam && splitData[index + 1] !== undefined) {
				buttons.push({
					buttonId: cmdId(cmd, 'next ' + (index + 1) + ' -model'),
					buttonText: { displayText: L.core.buttons.next },
					type: 1
				});
			}

			if (isParam && index !== 0) {
				buttons.push({
					buttonId: cmdId(cmd, 'prev ' + (index - 1) + ' -model'),
					buttonText: { displayText: L.core.buttons.previous },
					type: 1
				});
			}

			buttons = buttons.reverse();

			return await client.send(
				from,
				{
					text: texts,
					footer: `Page : ${Number(index) + 1}/${splitData.length}\n${Lc.labels.poweredByHiddenFinder}`,
					buttons,
					headerType: 1
				},
				{}
			);
		}

		models = !_.isNumber(parsed[0]) ? [randomize(dataJSON).url] : [_.get(dataJSON, parsed[0] - 1)?.url].filter(Boolean);

		if (models?.length === 0) {
			return await client.reply(from, t(locale, 'converter.labels.notFound', [models[0], `Type : !${this.name} -type`]), message);
		}

		for (const model of models) {
			let buffers = null;

			if (isMediaImage) {
				await client.downloadAndSaveMediaMessage(
					extractMediaData,
					`./tmp/${filename}`,
					typeQuoted
				);

				buffers = `./tmp/${filename}`;
			}

			const result = await ephoto360(model, parsed.slice(1).join(' '), buffers);

			if (result?.error) {
				await client.reply(from, t(locale, 'converter.labels.somethingWentWrong', [result.error]), message);

				continue;
			}

			const data = Buffer.from(await (await fetch(result.preview, { signal: AbortSignal.timeout(30_000) })).arrayBuffer(), 'base64');

			const buffer = isStickers
				? await client.prepareSticker(data, 'imageMessage', {
						author: configuration.author,
						packname: configuration.packname
					})
				: (async () => {
						const image = sharp(data);
						const { width, height } = await image.metadata();

						return await image.extract({ width: width - 40, height: height - 40, left: 0, top: 0 }).toBuffer();
					})();

			if (isImage) {
				await client.send(from, { image: buffer }, { quoted: message });
			} else if (isStickers) {
				await client.send(from, { sticker: buffer }, { quoted: message });
			} else {
				await client.send(from, { [defaulType]: buffer }, { quoted: message });
			}
		}
	}
});
