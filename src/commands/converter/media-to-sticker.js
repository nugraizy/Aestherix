import dayjs from 'dayjs';
import path from 'path';

import configuration from '../../helper/config/connect.js';
import { color, INFOLOG, isURL } from '../../utils/modules/index.js';

export default {
	name: 'sticker',
	description: 'Convert media to sticker',
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
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage && !isMediaVid && !query) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please send/reply a media or send a url to convert to sticker'
			);
		}

		if (query && !isURL(query) && !isMediaImage && !isMediaVid) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'If you trying to convert sticker from url, please provide a valid url'
			);
		}

		if (!stickerAble && !query) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				`Please send/reply a regular media to convert to sticker. Can't convert ${typeQuoted} to sticker, only : ${typeSticker
					.join(', ')
					.capitalize()}`
			);
		}

		if (query && isURL(query)) {
			const sticker = await client[botNum].prepareSticker(
				query,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client[botNum].send(from, { sticker }, { groupMetadata, quoted: message });
		}

		if (isMediaImage) {
			const sticker = await client[botNum].prepareSticker(
				await client[botNum].downloadMediaMessage(mediaData),
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				typeQuoted,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client[botNum].send(from, { sticker }, { groupMetadata, quoted: message });
		}

		if (isMediaVid) {
			const sticker = await client[botNum].prepareSticker(
				await client[botNum].downloadMediaMessage(mediaData),
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				typeQuoted,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			await client[botNum].send(from, { sticker }, { groupMetadata, quoted: message });
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Sticker is sent', '#01cdfe')} to ${color(prettyNumber, '#ff71ce')}`);
	}
};
