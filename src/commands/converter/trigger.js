import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';

import { color, loggers } from '../../utils/index.js';
import { trigger } from '../../helper/index.js';

const defaultOptions = {
	output: 'sticker'
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'trigger',
	minifiedDescription: 'Trigger Picture',
	description: 'Trigger someone profile picture or send/reply an image to trigger',
	category: 'Converter',
	aliases: ['trig', 't'],
	usage: '!trigger `<@user/(reply/send image)>`',
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
			typeSticker
		},
		client
	) {
		if (!mention.length && !isMediaImage) {
			return await client.instance.reply('Please mention or send/reply an image to pet', {
				from,
				quoted: message
			});
		}

		let options = {};

		options = /--?images?/.test(query)
			? _.defaults({ output: 'image' }, defaultOptions)
			: _.defaults({ output: 'sticker' }, defaultOptions);

		if (bodyQuoted && !isMediaImage) {
			loggers.warning(`${color('Triggering', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			const profile = await client.instance
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: path.join(__dirname, `src/media/temporary_files/${filename}`) }, defaultOptions);

			const result = await trigger(profile, sender, options);

			if (options.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble) {
				return await client.instance.reply(
					`Please send/reply a regular media to be triggered. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`,
					{ from, quoted: message }
				);
			}

			loggers.warning(`${color('Triggering', '#FF99C8')} ${color(prettyNumber, '#E4C1F9')}`);

			const buffer = await client.instance.downloadMediaMessage(mediaData);
			const result = await trigger(buffer, sender, options);

			if (options.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
		}

		for (const mentioned of mention) {
			loggers.warning(`${color('Triggering', '#FF99C8')} ${color(mentioned, '#E4C1F9')}`);

			const profile = await client.instance
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: path.join(__dirname, `src/media/temporary_files/${filename}`) }, defaultOptions);

			const result = await trigger(profile, sender, options);

			if (options.output === 'sticker') {
				await client.instance.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.instance.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Triggered', '#FF99C8')} ${color(mentioned, '#E4C1F9')}`);
		}
	}
};
