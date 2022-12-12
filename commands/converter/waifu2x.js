/* global botNum */
import dayjs from 'dayjs';
import path from 'path';
import parser from 'yargs-parser';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { color, INFOLOG } from '../../helper/modules/index.js';
import { waifu2x } from '../../utils/index.js';

export default {
	name: 'waifu2x',
	description: 'Enhance image using image processing A.I. called waifu2x.',
	usage: '!waifu2x <reply/send (image/sticker)>',
	aliases: ['w2x', 'enhance', 'upscale', 'remmini'],
	category: 'Converter',
	cooldown: 6,
	limit: 4,
	status: 'enable',
	run: async ({ from, isMediaImage, isQuotedSticker, prettyNumber, extractMediaData, filename, message, query, typeQuoted }, client) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!isMediaImage && !isQuotedSticker) {
			return client[botNum].reply({ from, quoted: message }, 'Please reply/send image with caption the command. This command also accept sticker (reply one with command).');
		}

		if (isQuotedSticker && extractMediaData.isAnimated) {
			return client[botNum].reply({ from, quoted: message }, 'The sticker are animated. Please reply static stickers only.');
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Enhancing image', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

		const parsed = parser(query.toLowerCase(), {
			configuration: {
				'short-option-groups': false,
			},
			alias: {
				isStickers: ['stk', 'stick', 'sticker', 'sticks', 'stc', 's'],
				isImage: ['img', 'image', 'foto', 'images', 'i'],
			},
		});

		const media = await client[botNum].downloadAndSaveMediaMessage(
			extractMediaData,
			path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
			typeQuoted,
		);

		const enhance = await waifu2x(media, prettyNumber);

		if (parsed.isStickers) {
			const prepareSticker = await client[botNum].prepareSticker(enhance, path.join(__dirname, `temporary_files/${filename}`), undefined, {
				author: configuration.author,
				packname: configuration.packname,
			});

			client[botNum].sendMessage(from, { sticker: prepareSticker }, { quoted: message });
		} else {
			client[botNum].sendMessage(from, { image: enhance }, { quoted: message });
		}
	},
};
