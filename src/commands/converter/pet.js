import path from 'path';
import fs from 'fs-extra';

import { color, INFOLOG } from '../../utils/modules/index.js';
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
			return await client.instance.reply('Please mention or send/reply an image to pet', {
				from,
				quoted: message,
				groupMetadata
			});
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
			INFOLOG(`${color('Petting', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			const profile = await client.instance
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`${color('Converted Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble || typeQuoted === 'videoMessage') {
				return await client.instance.reply(
					`Please send/reply a regular media to be petted. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`,
					{ from, quoted: message, groupMetadata }
				);
			}

			INFOLOG(`${color('Petting', 'cyan')} ${color(prettyNumber, '#ff71ce')}`);

			const file = await client.instance.downloadAndSaveMediaMessage(
				extractMediaData,
				path.join(__dirname, `src/media/temporary_files/${filename}.${extractMediaData.mimetype.split('/')[1]}`),
				typeQuoted
			);
			const result = await pet(file, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`${color('Converted Media', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		for (const mentioned of mention) {
			INFOLOG(`${color('Petting', 'cyan')} ${color(mentioned, '#ff71ce')}`);

			const profile = await client.instance
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			defaultOptions.filename = path.join(__dirname, `src/media/temporary_files/${filename}`);

			const result = await pet(profile, sender, defaultOptions);

			if (defaultOptions.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`${color('Petted', 'cyan')} ${color(mentioned, '#ff71ce')}`);
		}
	}
};
