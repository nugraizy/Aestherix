import path from 'path';

import configuration from '../../helper/config/connect.js';
import { color, loggers, isURL } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'sticker',
	minifiedDescription: 'Media to Sticker',
	description: 'Convert media to sticker.',
	usage: '!sticker <reply media/send media>',
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
			query,
			groupMetadata
		},
		client
	) {
		if (!isMediaImage && !isMediaVid && !query) {
			return await client.instance.reply('Please send/reply a media or send a url to convert to sticker', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (query && !isURL(query) && !isMediaImage && !isMediaVid) {
			return await client.instance.reply('If you trying to convert sticker from url, please provide a valid url', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!stickerAble && !query) {
			return await client.instance.reply(
				`Please send/reply a regular media to convert to sticker. Can't convert ${typeQuoted} to sticker, only : ${typeSticker
					.join(', ')
					.capitalize()}`,
				{ from, quoted: message, groupMetadata }
			);
		}

		if (query && isURL(query)) {
			const sticker = await client.instance.prepareSticker(
				query,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client.instance.send(from, { sticker }, { groupMetadata, quoted: message });
		}

		if (isMediaImage) {
			const sticker = await client.instance.prepareSticker(
				await client.instance.downloadMediaMessage(mediaData),
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				typeQuoted,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client.instance.send(from, { sticker }, { groupMetadata, quoted: message });
		}

		if (isMediaVid) {
			const sticker = await client.instance.prepareSticker(
				await client.instance.downloadMediaMessage(mediaData),
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				typeQuoted,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client.instance.send(from, { sticker }, { groupMetadata, quoted: message });
		}

		loggers.info(`${color('Sticker is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
	}
};
