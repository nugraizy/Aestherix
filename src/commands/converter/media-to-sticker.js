import configuration from '../../helper/config/connect.js';
import { color, isURL, loggers } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'sticker',
	minifiedDescription: 'Media to Sticker',
	description: 'Convert media to sticker.',
	usage: '!sticker `<reply media/send media>`',
	aliases: [
		'stickers',
		'st',
		'stk',
		's',
		'sgif',
		'sgifs',
		'stickergif',
		'stickergifs',
		'tosticker',
		'tostickers',
		'tosticker',
		'tostickers',
		'tosticker'
	],
	category: 'Converter',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{
			isMediaImage,
			isMediaVid,
			from,
			prettyNumber,
			message,
			mediaData,
			stickerAble,
			typeQuoted,
			typeSticker,
			filename,
			query
		},
		client
	) {
		if (!isMediaImage && !isMediaVid && !query) {
			return await client.reply(from, 'Please send/reply a media or send a url to convert to sticker', message);
		}

		if (query && !isURL(query) && !isMediaImage && !isMediaVid) {
			return await client.reply(
				from,
				'If you trying to convert sticker from url, please provide a valid url',
				message
			);
		}

		if (!stickerAble && !query) {
			return await client.reply(
				from,
				`Please send/reply a regular media to convert to sticker. Can't convert ${typeQuoted} to sticker, only : ${typeSticker
					.join(', ')
					.capitalize()}`,
				message
			);
		}

		if (query && isURL(query)) {
			const sticker = await client.prepareSticker(query, undefined, {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker }, { quoted: message });
		}

		if (isMediaImage) {
			const sticker = await client.prepareSticker(await client.downloadMediaMessage(mediaData), typeQuoted, {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker }, { quoted: message });
		}

		if (isMediaVid) {
			const sticker = await client.prepareSticker(await client.downloadMediaMessage(mediaData), typeQuoted, {
				author: configuration.author,
				packname: configuration.packname
			});

			await client.send(from, { sticker }, { quoted: message });
		}

		loggers.info(`${color('Sticker is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
