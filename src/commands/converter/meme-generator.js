import parser from 'yargs-parser';

import { memeGenerator } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';

const DEFAULT_TYPE = 'image';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'memegen',
	minifiedDescription: 'Generate Meme',
	description: 'Meme Generator, You know the drill.',
	usage: '!memegen `<reply media/send media>` <[Top Texts] & [Bottom Texts]> [options]\nOptions:\n-stk / -img',
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
			typeSticker
		},
		client
	) {
		if (!isMediaImage && !(isQuotedSticker || isSticker)) {
			return await client.instance.reply('Please send/reply a media to convert to sticker', {
				from,
				quoted: message
			});
		}

		if (!stickerAble) {
			return await client.instance.reply(
				`Please send/reply a regular media to be meme'd. Can't convert ${typeQuoted}, only : ${typeSticker
					.slice(
						typeSticker.findIndex((v) => v === 'videoMessage'),
						1
					)
					.join(', ')
					.capitalize()}`,
				{ from, quoted: message }
			);
		}

		if (!query) {
			return await client.instance.reply('Please provide a query, use & to split top/bottom text', {
				from,
				quoted: message
			});
		}

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		const regexs = new RegExp(`--?(${Object.keys(parsed).join('|')})`, 'g');

		query = query.replace(regexs, '');

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.instance.reply('Cannot use animated sticker.', { from, quoted: message });
		}

		const image = await client.instance.downloadMediaMessage(mediaData);

		const buffer = await memeGenerator(
			client.instance,
			sender,
			image,
			query.split('&')[0],
			query.split('&')[1],
			parsed.isStickers ? 'sticker' : parsed.isImage ? 'image' : DEFAULT_TYPE,
			1000
		);

		if (buffer.error) {
			return await client.instance.reply(buffer.error, { from, quoted: message });
		}

		if (parsed.isStickers) {
			await client.instance.send(from, { sticker: buffer }, { quoted: message });
		} else {
			await client.instance.send(
				from,
				{ image: buffer, caption: 'Meme Generator Made by Void Bot using Canvas. Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪' },
				{ quoted: message }
			);
		}

		loggers.info(
			`${color(`${parsed.isStickers ? 'Sticker' : 'Image'} is sent`, '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`
		);
	}
};
