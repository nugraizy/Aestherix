import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';

import { color, loggers } from '../../utils/index.js';
import { TriggerEffect } from '../../helper/canvas/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

const defaultOptions = {
	output: 'sticker'
};

export default defineCommand({
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
			sender, // eslint-disable-line no-unused-vars
			query,
			message,
			stickerAble,
			typeQuoted,
			typeSticker
		},
		client
	) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!mention.length && !isMediaImage) {
			return await client.reply(from, L.errors.imageRequired, message);
		}

		let options = {};

		options = /--?images?/.test(query)
			? _.defaults({ output: 'image' }, defaultOptions)
			: _.defaults({ output: 'sticker' }, defaultOptions);

		if (bodyQuoted && !isMediaImage) {
			loggers.warning(`${color('Triggering', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			const profile = await client
				.profilePictureUrl(mediaData.participant, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: `./tmp/${filename}` }, defaultOptions);

			const effect = new TriggerEffect();
			const result = await effect.render(profile, options);

			if (options.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);

			return;
		}

		if (isMediaImage) {
			if (!stickerAble) {
				return await client.reply(
					from,
					`Please send/reply a regular media to be triggered. Can't convert ${typeQuoted}, only : ${typeSticker
						.slice(
							typeSticker.findIndex((v) => v === 'videoMessage'),
							1
						)
						.join(', ')
						.capitalize()}`,
					message
				);
			}

			loggers.warning(`${color('Triggering', 'pink')} ${color(prettyNumber, 'lilac')}`);

			const buffer = await client.downloadMediaMessage(mediaData);
			const effect = new TriggerEffect();
			const result = await effect.render(buffer, options);

			if (options.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(prettyNumber, 'lilac')}`);
		}

		for (const mentioned of mention) {
			loggers.warning(`${color('Triggering', 'pink')} ${color(mentioned, 'lilac')}`);

			const profile = await client
				.profilePictureUrl(mentioned, 'image')
				.catch(async () => await fs.readFile(path.join(__dirname, 'src/media/blank.png')));

			options = _.defaults({ filename: `./tmp/${filename}` }, defaultOptions);

			const effect = new TriggerEffect();
			const result = await effect.render(profile, options);

			if (options.output === 'sticker') {
				await client.send(from, { sticker: Buffer.from(result, 'base64') }, {});
			} else {
				await client.send(from, { video: Buffer.from(result, 'base64'), mimetype: 'video/mp4' }, {});
			}

			loggers.info(`${color('Triggered', 'pink')} ${color(mentioned, 'lilac')}`);
		}
	}
});
