import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { color, delay, loggers } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'igstory',
	minifiedDescription: 'Download Instagram Story',
	description: 'Downloads the story of the user',
	usage: '!igstory `<username(s)>` (you can send multiple username using space in between)',
	aliases: ['igstory', 'igs'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, sender, isOwner, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const DL = useLocale(locale, 'downloader');

		if (!configuration.isInstagramInitiated) {
			return await client.reply(
				from,
				`Instagram session is not initialized. ${isOwner ? `Type ${prefix}instagraminit to initialize it.` : `Please ask the owner to initialize it first using the command ${prefix}instagraminit`}`,
				message
			);
		}

		if (!query) {
			return await client.reply(from, L.errors.usernameRequired, message);
		}

		const wait = await client.waitMessage(from, L.success.loading, message);

		const { _: input } = parser(query);

		const stories = await configuration.instagram.search.story(input);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Instagram Story', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const data in stories) {
			if (stories[data]?.error) {
				await client.reply(from, `Error while downloading Instagram story\n\n${stories[data].error}\n${data}`, message);
				loggers.error(`${color('Failed to Download Instagram Story', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

		let capt = DL.titles.igStory.formatHeaders();

		capt += `\n\nUsername : ${stories[data].username}\n`;
		capt += `Fullname : ${stories[data].fullName || '-'}\n`;
		capt += `${DL.labels.verified} : ${stories[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
		capt += `${DL.labels.private} : ${stories[data].isPrivate ? 'Private' : 'Public'}\n`;
		capt += `${DL.labels.totalStories} : ${stories[data].stories.length}\n`;

			await client.reply(from, capt.trim().formatForm(), message);

			for (const media of stories[data].stories) {
				await client.send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {});
				await delay(300);
			}

			success++;
		}

		await wait.update(t(locale, 'common.core.commands.downloadBatchFinished', [success, error]));

		loggers.info(`${color('Downloaded Instagram Story', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
});
