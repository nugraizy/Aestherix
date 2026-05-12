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
	usage: '!waifu2xv2 `<reply/send image/sticker>`',
	aliases: ['w2xv2', 'enhancev2', 'upscalev2', 'remminiv2'],
	category: 'Converter',
	cooldown: 6,
	limit: 4,
	status: 'enable',
	run: async (
		{ from, isMediaImage, isQuotedSticker, prettyNumber, extractMediaData, filename, message, query, mediaData },
		client
	) => {
		if (!isMediaImage && !isQuotedSticker) {
			return client.reply(
				from,
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).',
				message
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.reply(from, 'The sticker are animated. Please reply static stickers only.', message);
		}

		loggers.warning(`${color('Enhancing image', 'pink')} ${color(prettyNumber, 'lilac')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc', 's'],
				isImage: ['img', 'image', 'foto', 'images', 'i']
			}
		});

		const media = await client.downloadMediaMessage(mediaData);

		const enhance = await waifu2xV2(
			media,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`)
		);

		if (parsed.isStickers) {
			const prepareSticker = await client.prepareSticker(enhance, 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			client.send(from, { sticker: prepareSticker }, { quoted: message });
		} else {
			client.send(from, { image: Buffer.from(enhance, 'base64') }, { quoted: message });
		}

		loggers.info(`${color('Media is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
