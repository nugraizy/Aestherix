import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { color, loggers, waifu2x } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'waifu2x',
	minifiedDescription: 'Waifu2x V1',
	description: 'Enhance image using image processing A.I. called waifu2x.',
	usage: '!waifu2x `<reply/send image/sticker>`',
	aliases: ['w2x', 'enhance', 'upscale', 'remmini'],
	category: 'Converter',
	cooldown: 6,
	limit: 4,
	status: 'enable',
	run: async (
		{ from, isMediaImage, isQuotedSticker, prettyNumber, extractMediaData, filename, message, query, mediaData },
		client
	) => {
		if (!isMediaImage && !isQuotedSticker) {
			return client.instance.reply(
				from,
				'Please reply/send image with caption the command. This command also accept sticker (reply one with command).',
				message
			);
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client.instance.reply(from, 'The sticker are animated. Please reply static stickers only.', message);
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

		const media = await client.instance.downloadMediaMessage(mediaData);

		const enhance = await waifu2x(
			media,
			path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`)
		);

		if (parsed.isStickers) {
			const prepareSticker = await client.instance.prepareSticker(enhance, 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			client.instance.send(from, { sticker: prepareSticker }, { quoted: message });
		} else {
			client.instance.send(from, { image: enhance }, { quoted: message });
		}

		loggers.info(`${color('Media is sent', 'pink')} to ${color(prettyNumber, 'lilac')}`);
	}
};
