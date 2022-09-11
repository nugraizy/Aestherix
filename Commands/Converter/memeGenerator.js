/* global botNum, Buffer */
import moment from 'moment-timezone';
import path from 'path';
import parser from 'yargs-parser';
import { writeFileSync } from 'fs';

import { __dirname } from '../../connect.js';
import { memeGenerator } from '../../Helper/Canvas/index.js';
import { color, INFOLOG } from '../../Helper/Modules/index.js';
import { convertStickerToMedia } from '../../Utils/Converter/index.js';

const WATERMARK = 'made by void bot';
const DEFAULT_TYPE = 'image';

export default {
	name: 'memegen',
	description: 'Meme Generator, Y\'know the drill',
	usage: '!memegen <reply media/send media> <[Top Texts] & [Bottom Texts]> [options]\nOptions:\n-stk / -img',
	aliases: ['mgen', 'memgen', 'memegen'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ query, isMediaImage, isSticker, isQuotedSticker, from, prettyNumber, message, filename, extractMediaData, sender, stickerAble, typeQuoted, typeSticker }, client) {
		const time = moment().format('HH:mm:ss DD/MM');

		if (!isMediaImage && !(isQuotedSticker || isSticker)) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply a media to convert to sticker');
		}

		if (!stickerAble) {
			return await client[botNum].reply(
				{ from, quoted: message },
				`Please send/reply a regular media to be meme'd. Can't convert ${typeQuoted}, only : ${typeSticker
					.slice(
						typeSticker.findIndex((v) => v == 'videoMessage'),
						1,
					)
					.join(', ')
					.capitalize()}`,
			);
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please provide a query, use & to split top/bottom text');
		}

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false,
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images'],
			},
		});

		const regexs = new RegExp(`--?(${Object.keys(parsed).join('|')})`, 'g');

		query = query.replace(regexs, '');

		const results = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `Temporary Files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted,
		);

		let image = results;

		if (isQuotedSticker) {
			const { result } = await convertStickerToMedia(results, sender, extractMediaData);

			writeFileSync(path.join(__dirname, `Temporary Files/${filename}.png`), new Buffer.from(result, 'base64'));

			image = path.join(__dirname, `Temporary Files/${filename}.png`);
		}

		const buffer = await memeGenerator(sender, image, query.split('&')[0], query.split('&')[1], parsed.isStickers ? 'sticker' : parsed.isImage ? 'image' : DEFAULT_TYPE, WATERMARK);

		if (buffer.error) {
			return await client[botNum].reply({ from, quoted: message }, buffer.error);
		}

		if (parsed.isStickers) {
			await client[botNum].sendMessage(from, { sticker: buffer }, { quoted: message });
		} else {
			await client[botNum].sendMessage(from, { image: buffer, caption: 'Meme Generator Made by Void Bot using Canvas. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪' }, { quoted: message });
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color(`${parsed.isStickers ? 'Sticker' : 'Image'} is sent`, '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`);
	},
};
