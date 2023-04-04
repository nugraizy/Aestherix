import _ from 'lodash';
import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs-extra';

import { color, INFOLOG } from '../../utils/index.js';
import { trigger } from '../../helper/index.js';

const defaultOptions = {
	output: 'sticker'
};

export default {
	name: 'trigger',
	description: 'Trigger someone profile picture or send/reply an image to trigger',
	category: 'Converter',
	aliases: ['trig', 't'],
	usage: '!trigger <@user/(reply/send image)>',
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run(
		{
			bodyQuoted,
			mention,
			isMediaImage,
			from,
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

		let options = {};

		options = /--?images?/.test(query)
			? _.defaults({ output: 'image' }, defaultOptions)
			: _.defaults({ output: 'sticker' }, defaultOptions);

		if (bodyQuoted && !isMediaImage) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Triggering', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			const profile = await client[botNum]
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: path.join(__dirname, `src/media/temporary_files/${filename}`) }, defaultOptions);

			const result = await trigger(profile, sender, options);

			if (options.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble) {
				return await client[botNum].reply(
					{ from, quoted: message },
					`Please send/reply a regular media to be triggered. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`
				);
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Triggering', '#01cdfe')} ${color(prettyNumber, '#ff71ce')}`);

			const buffer = await client[botNum].downloadMediaMessage(mediaData);
			const result = await trigger(buffer, sender, options);

			if (options.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
		}

		for (const mentioned of mention) {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Triggering', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);

			const profile = await client[botNum]
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: path.join(__dirname, `src/media/temporary_files/${filename}`) }, defaultOptions);

			const result = await trigger(profile, sender, options);

			if (options.output === 'sticker') {
				await client[botNum].send(from, { sticker: Buffer.from(result, 'base64') }, { groupMetadata });
			} else {
				await client[botNum].send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, { groupMetadata });
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Triggered', '#01cdfe')} ${color(mentioned, '#ff71ce')}`);
		}
	}
};
