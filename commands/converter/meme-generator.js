/* global botNum */
import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { __dirname } from '../../index.js';
import { memeGenerator } from '../../helper/canvas/index.js';
import { color, INFOLOG } from '../../helper/modules/index.js';

const DEFAULT_TYPE = 'image';

export default {
	name: 'memegen',
	description: 'Meme Generator, You know the drill',
	usage: '!memegen <reply media/send media> <[Top Texts] & [Bottom Texts]> [options]\nOptions:\n-stk / -img',
	aliases: ['mgen', 'memgen', 'memegen'],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{
			query,
			isMediaImage,
			isSticker,
			isQuotedSticker,
			from,
			prettyNumber,
			message,
			mediaData,
			extractMediaData,
			sender,
			stickerAble,
			typeQuoted,
			typeSticker,
		},
		client,
	) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage && !(isQuotedSticker || isSticker)) {
			return await client[botNum].reply({ from, quoted: message }, 'Please send/reply a media to convert to sticker');
		}

		if (!stickerAble) {
			return await client[botNum].reply(
				{ from, quoted: message },
				`Please send/reply a regular media to be meme'd. Can't convert ${typeQuoted}, only : ${typeSticker
					.slice(
						typeSticker.findIndex((v) => v === 'videoMessage'),
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

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client[botNum].reply({ from, quoted: message }, 'Cannot use animated sticker.');
		}

		const image = await client[botNum].downloadMediaMessage(mediaData);

		const buffer = await memeGenerator(
			client[botNum],
			sender,
			image,
			query.split('&')[0],
			query.split('&')[1],
			parsed.isStickers ? 'sticker' : parsed.isImage ? 'image' : DEFAULT_TYPE,
			1000,
		);

		if (buffer.error) {
			return await client[botNum].reply({ from, quoted: message }, buffer.error);
		}

		if (parsed.isStickers) {
			await client[botNum].sendMessage(from, { sticker: buffer }, { quoted: message });
		} else {
			await client[botNum].sendMessage(
				from,
				{ image: buffer, caption: 'Meme Generator Made by Void Bot using Canvas. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪' },
				{ quoted: message },
			);
		}

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color(`${parsed.isStickers ? 'Sticker' : 'Image'} is sent`, '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`,
		);
	},
};
