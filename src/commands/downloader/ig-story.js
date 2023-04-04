import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL } from '../../utils/modules/index.js';
import { getStory3 } from '../../utils/instagram/index.js';

export default {
	name: 'igstory',
	description: 'Downloads the story of the user',
	usage: '!igstory <username>',
	aliases: ['igstory', 'igs'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, grouppMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a username');
		}

		const { _: usernames } = parser(query);

		if (usernames.length === 1 && isURL(usernames[0]) && !/\/stories\//.test(usernames[0])) {
			return await client[botNum].reply(
				{ grouppMetadata, from, quoted: message },
				'Please specify a valid username or a valid url instagram story'
			);
		}

		for (const username of usernames) {
			if (isURL(username) && !/\/stories\//.test(username)) {
				await client[botNum].reply(
					{ grouppMetadata, from, quoted: message },
					'Please specify a username or a valid url instagram story'
				);
			} else {
				const story = await getStory3(username);

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloading Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
				);

				if ('error' in story) {
					await client[botNum].reply(
						{ grouppMetadata, from, quoted: message },
						`Error while downloading Instagram story\n\n${story.error}\n${username}`
					);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
					);

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
						{ grouppMetadata, quoted: message }
					);
				} else {
					capt += `Tot. Media : ${story.stories.length}`;

					await client[botNum].send(from, { text: capt.trim() }, { quoted: message });

					for (const medias of story.stories) {
						await client[botNum].send(from, medias.isVideo ? { video: { url: medias.url } } : { image: { url: medias.url } }, {
							grouppMetadata
						});
						await delay(300);
					}
				}

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloaded Instagram Story', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`
				);
			}
		}
	}
};
