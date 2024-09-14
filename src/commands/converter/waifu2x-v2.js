import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, loggers, waifu2xV2 } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waifu2xv2',
	minifiedDescription: 'Waifu2x V2',
	description: 'Enhance image using image processing A.I. called waifu2x.',
	usage: '!waifu2xv2 <reply/send (image/sticker)>',
	aliases: ['w2xv2', 'enhancev2', 'upscalev2', 'remminiv2'],
	category: 'Converter',
	cooldown: 6,
	limit: 4,
	status: 'enable',
	run: async (
		{
			from,
			isMediaImage,
			isQuotedSticker,
			prettyNumber,
			extractMediaData,
			filename,
			message,
			query,
			mediaData,
			groupMetadata
		},
		client
	) => {
		if (!isMediaImage && !isQuotedSticker) {
			return client.instance.reply(
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).'
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.instance.reply('The sticker are animated. Please reply static stickers only.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		loggers.WRN(`${color('Enhancing image', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc', 's'],
				isImage: ['img', 'image', 'foto', 'images', 'i']
			}
		});

		const media = await client.instance.downloadMediaMessage(mediaData);

		const enhance = await waifu2xV2(
			media,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`)
		);

		if (parsed.isStickers) {
			const prepareSticker = await client.instance.prepareSticker(
				enhance,
				path.join(__dirname, `src/media/temporary_files/${filename}`),
				undefined,
				{
					author: configuration.author,
					packname: configuration.packname
				}
			);

			client.instance.send(from, { sticker: prepareSticker }, { groupMetadata, quoted: message });
		} else {
			client.instance.send(from, { image: Buffer.from(enhance, 'base64') }, { groupMetadata, quoted: message });
		}

		loggers.INF(`${color('Media is sent', '#FF99C8')} to ${color(prettyNumber, '#E4C1F9')}`);
	}
};
