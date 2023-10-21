import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igstory',
	description: 'Downloads the story of the user',
	usage: '!igstory <username>',
	aliases: ['igstory', 'igs'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('Please specify a username', { from, quoted: message, groupMetadata });
		}

		const { _: input } = parser(query);

		const stories = await instagram.search.story(input);

		INFOLOG(`${color('Downloading Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		for (const data in stories) {
			if ('error' in stories[data]) {
				await client[botNum].reply(`Error while downloading Instagram story\n\n${stories[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			let capt = 'Instagram Story'.formatHeaders();

			capt += `\n\nUsername : ${stories[data].user.username}\n`;
			capt += `Fullname : ${stories[data].user.fullName}\n`;
			capt += `Follower : ${stories[data].user.followers}\n`;
			capt += `Following : ${stories[data].user.following}\n`;
			capt += stories[data].user.biography === '' ? '' : `Biography : ${stories[data].user.biography}\n`;
			capt += `Tot. Story : ${stories[data].stories.length}\n\n`;

			await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });

			capt = '';

			for (const media of stories[data].stories) {
				await client[botNum].send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {
					groupMetadata,
					quoted: message
				});
				await delay(300);
			}
		}
	}
};
