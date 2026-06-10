import fs from 'fs-extra';
import path from 'path';

import { pet } from '../../utils/converter/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		if (!mention.length && !isMediaImage && !bodyQuoted) {
			return await client.reply(from, 'Please mention or send/reply an image to pet', message);
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
			loggers.warning(`${color('Petting', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			const profile = await client
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = `./tmp/${filename}`;

			const result = await pet(profile, sender, defaultOptions, client);

			if (defaultOptions.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble || typeQuoted === 'videoMessage') {
				return await client.reply(
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

			loggers.warning(`${color('Petting', 'pink')} ${color(prettyNumber, 'lilac')}`);

			const file = await client.downloadAndSaveMediaMessage(
				extractMediaData,
				`./tmp/${filename}.${extractMediaData.mimetype.split('/')[1]}`,
				typeQuoted
			);
			const result = await pet(file, sender, defaultOptions, client);

			if (defaultOptions.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			return;
		}

		for (const mentioned of mention) {
			loggers.warning(`${color('Petting', 'pink')} ${color(mentioned, 'lilac')}`);

			const profile = await client
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = `./tmp/${filename}`;

			const result = await pet(profile, sender, defaultOptions, client);

			if (defaultOptions.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.warning(`${color('Petted', 'pink')} ${color(mentioned, 'lilac')}`);
		}
	}
});
