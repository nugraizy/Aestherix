import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { removeBg } from '../../utils/converter/image.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'removebg',
	minifiedDescription: 'Remove Background',
	description: 'Remove background from image.',
	usage: '!removebg `<reply/send (image/sticker)>`',
	aliases: ['rmbg', 'rbg', 'nobg'],
	category: 'Converter',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	run: async (
		{ from, isMediaImage, isQuotedSticker, prettyNumber, extractMediaData, filename, message, query, typeQuoted },
		client
	) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isMediaImage && !isQuotedSticker) {
			return client.reply(
				from,
				L.errors.imageRequired,
				message
			);
		}

		if (!extractMediaData) {
			return client.reply(from, L.errors.mediaProcessFailed, message);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.reply(from, L.errors.stickerAnimated, message);
		}

		loggers.warning(`${color('Removing Background image', 'pink')} ${color(prettyNumber, 'lilac')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc'],
				isImage: ['img', 'image', 'foto', 'images']
			}
		});

		const media = await client.downloadAndSaveMediaMessage(
			extractMediaData,
			`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
			typeQuoted
		);

		const resultRemoveBg = await removeBg(media, prettyNumber);

		if (parsed.isStickers) {
			const prepareSticker = await client.prepareSticker(resultRemoveBg, 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker: prepareSticker }, { quoted: message });
		} else {
			await client.send(from, { image: resultRemoveBg }, { quoted: message });
		}
	}
});
