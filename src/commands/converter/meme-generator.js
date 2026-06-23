import { BOT_NAME } from '../../core/constants.js';

import parser from 'yargs-parser';

import { MemeGenerator } from '../../helper/canvas/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';

const DEFAULT_TYPE = 'image';

export default defineCommand({
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
			sender, // eslint-disable-line no-unused-vars
			stickerAble,
			typeQuoted,
			typeSticker
		},
		client
	) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lc = useLocale(locale, 'converter');

		if (!isMediaImage && !(isQuotedSticker || isSticker)) {
			return await client.reply(from, L.errors.stickerMediaRequired, message);
		}

		if (!stickerAble) {
			return await client.reply(
				from,
				t(locale, 'converter.labels.pleaseSendMedia', [
					"meme'd",
					typeQuoted,
					typeSticker
					.slice(
						typeSticker.findIndex((v) => v === 'videoMessage'),
						1
					)
					.join(', ')
					.capitalize()
				]),
				message
			);
		}

		if (!query) {
			return await client.reply(from, L.errors.memeTextRequired, message);
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
			return client.reply(from, L.errors.noAnimatedSticker, message);
		}

		const image = await client.downloadMediaMessage(mediaData);

		const meme = new MemeGenerator();
		const buffer = await meme.render(
			client,
			image,
			query.split('&')[0],
			query.split('&')[1],
			parsed.isStickers ? 'sticker' : parsed.isImage ? 'image' : DEFAULT_TYPE,
			1000
		);

		if (buffer.error) {
			return await client.reply(from, buffer.error, message);
		}

		if (parsed.isStickers) {
			await client.send(from, { sticker: buffer }, { quoted: message });
		} else {
			await client.send(
				from,
				{ image: buffer, caption: t(locale, 'converter.labels.memeGeneratorCaption', [BOT_NAME]) },
				{ quoted: message }
			);
		}

		loggers.info(`${color(`${parsed.isStickers ? 'Sticker' : 'Image'} is sent`, 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
});
