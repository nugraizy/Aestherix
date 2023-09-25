import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs-extra';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { pet } from '../../utils/converter/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'petpet',
	description: 'Pet someone profile picture or send/reply an image to pet',
	category: 'Converter',
	aliases: ['pet', 'petpetpet'],
	usage: '!petpet <@user/(reply/send image)>',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{
			bodyQuoted,
			mention,
			isMediaImage,
			from,
			extractMediaData,
			mediaData,
			filename,
			prettyNumber,
			sender,
			query,
			message,
			stickerAble,
			typeQuoted,
			typeSticker,
			groupMetadata
		},
		client
	) {
		if (mention.length === 0 && !isMediaImage) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please mention or send/reply an image to pet'
			);
		}

		const time = dayjs().format('HH:mm:ss DD/MM');

		const defaultOptions = {
			output: 'sticker',
			duration: 5,
			resolution: 512
		};

		if (/--?images?/.test(query)) {
			defaultOptions.output = 'image';
		}

		if (bodyQuoted && !isMediaImage) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			const profile = await client[botNum]
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble || typeQuoted === 'videoMessage') {
				return await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					`Please send/reply a regular media to be petted. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`
				);
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

			const file = await client[botNum].downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted
			);
			const result = await pet(file, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		for (const mentioned of mention) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petting', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);

			const profile = await client[botNum]
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Petted', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);
		}
	}
};
