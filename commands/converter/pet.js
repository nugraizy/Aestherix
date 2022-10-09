/* global botNum */
import moment from 'moment-timezone';
import path from 'path';

import { __dirname } from '../../index.js';
import { color, INFOLOG, readBuffer } from '../../helper/modules/index.js';
import { pet } from '../../utils/converter/index.js';

export default {
	name: 'petpet',
	description: 'Pet someone profile picture or send/reply an image to pet',
	category: 'Converter',
	aliases: ['pet', 'petpetpet'],
	usage: '!petpet <@user/(reply/send image)>',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ bodyQuoted, mention, isMediaImage, from, extractMediaData, mediaData, filename, prettyNumber, sender, query, message, stickerAble, typeQuoted, typeSticker }, client) {
		if (mention.length == 0 && !isMediaImage) {
			return await client[botNum].reply({ from, quoted: message }, 'Please mention or send/reply an image to pet');
		}

		const time = moment().format('HH:mm:ss DD/MM');

		const defaultOptions = {
			output: 'sticker',
			duration: 5,
			resolution: 512,
		};

		if (/--?images?/.test(query)) {
			defaultOptions.output = 'image';
		}

		if (bodyQuoted && !isMediaImage) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			const profile = await client[botNum].profilePictureUrl(mediaData.participant, 'image').catch(() => readBuffer(path.join(__dirname, 'media_files/blank.png')));

			defaultOptions.filename = path.join(__dirname, `temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output == 'sticker') {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, 'base64') });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble) {
				return await client[botNum].reply(
					{ from, quoted: message },
					`Please send/reply a regular media to be petted. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v == 'videoMessage'),
							1,
						)
						.join(', ')
						.capitalize()}`,
				);
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

			const file = await client[botNum].downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted,
			);
			const result = await pet(file, sender, defaultOptions);

			if (defaultOptions.output == 'sticker') {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, 'base64') });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		for (const mentioned of mention) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);

			const profile = await client[botNum].profilePictureUrl(mentioned, 'image').catch(() => readBuffer(path.join(__dirname, 'media_files/blank.png')));

			defaultOptions.filename = path.join(__dirname, `temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output == 'sticker') {
				await client[botNum].sendMessage(from, { sticker: Buffer.from(result, 'base64') });
			} else {
				await client[botNum].sendMessage(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petted', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);
		}
	},
};
