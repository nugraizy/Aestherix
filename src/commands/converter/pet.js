import path from 'path';
import fs from 'fs-extra';

import { color, loggers } from '../../utils/modules/index.js';
import { pet } from '../../utils/converter/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'petpet',
	minifiedDescription: 'Pettify Picture',
	description: 'Pet someone profile picture or send/reply an image to pet.',
	category: 'Converter',
	aliases: ['pet', 'petpetpet'],
	usage: '!petpet `<@user/(reply/send image)>`',
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
			typeSticker
		},
		client
	) {
		if (!mention.length && !isMediaImage) {
			return await client.instance.reply(from, 'Please mention or send/reply an image to pet', message);
		}

		const defaultOptions = {
			output: 'sticker',
			duration: 5,
			resolution: 512
		};

		if (/--?images?/.test(query)) {
			defaultOptions.output = 'image';
		}

		if (bodyQuoted && !isMediaImage) {
			loggers.warning(`${color('Petting', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			const profile = await client.instance
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble || typeQuoted === 'videoMessage') {
				return await client.instance.reply(
					from,
					`Please send/reply a regular media to be petted. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`,
					message
				);
			}

			loggers.warning(`${color('Petting', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

			const file = await client.instance.downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted
			);
			const result = await pet(file, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		for (const mentioned of mention) {
			loggers.warning(`${color('Petting', '#FF99C8')} ${color(mentioned, '#E4C1F9')}`);

			const profile = await client.instance
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.warning(`${color('Petted', '#FF99C8')} ${color(mentioned, '#E4C1F9')}`);
		}
	}
};
