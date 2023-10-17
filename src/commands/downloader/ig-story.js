import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL } from '../../utils/modules/index.js';
import { getStory3 } from '../../utils/instagram/index.js';

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

		const { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0]) && !/\/stories\//.test(usernames[0])) {
			return await client[botNum].reply('Please specify a valid username or a valid url instagram story', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		for (const username of usernames) {
			if (isURL(username) && !/\/stories\//.test(username)) {
				await client[botNum].reply('Please specify a username or a valid url instagram story', {
					from,
					quoted: message,
					groupMetadata
				});
			} else {
				const story = await getStory3(username);

				INFOLOG(`${color('Downloading Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

				if ('error' in story) {
					await client[botNum].reply(`Error while downloading Instagram story\n\n${story.error}\n${username}`, {
						from,
						quoted: message,
						groupMetadata
					});
					ERRLOG(`⚠️ ${color('Failed to Download Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				}

				let capt = 'Instagram Story'.formatHeaders();

				capt += `\n\nUsername : ${story.username}\n`;
				capt += `Fullname : ${story.fullName}\n`;

				if (story.stories.length === 1) {
					await client[botNum].send(
						from,
						story.stories[0].isVideo
							? { video: { url: story.stories[0].url }, caption: capt.trim() }
							: { image: { url: story.stories[0].url }, caption: capt.trim() },
						{ groupMetadata, quoted: message }
					);
				} else {
					capt += `Tot. Media : ${story.stories.length}`;

					await client[botNum].send(from, { text: capt.trim() }, { quoted: message });

					for (const medias of story.stories) {
						await client[botNum].send(from, medias.isVideo ? { video: { url: medias.url } } : { image: { url: medias.url } }, {
							groupMetadata
						});
						await delay(300);
					}
				}

				INFOLOG(`${color('Downloaded Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
			}
		}
	}
};
