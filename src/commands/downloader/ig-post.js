import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, numberWithCommas } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igpost',
	minifiedDescription: 'Download Instagram Post',
	description: 'Downloads the post of the user',
	usage: '!igpost <url>',
	aliases: ['igpost', 'igp'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		const { _: urls } = parser(query);

		const posts = await instagram.download.post(urls);

		INFOLOG(`${color('Downloading Instagram Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		for (const data in posts) {
			if ('error' in posts[data]) {
				await client.instance.reply(`Error while downloading Instagram post\n\n${posts[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Instagram Post', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			let capt = 'Instagram Post'.formatHeaders();

			capt += `\n\nUsername : ${posts[data].username}\n`;
			capt += `Fullname : ${posts[data].fullName}\n`;
			capt += `Privacy : ${posts[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Verified : ${posts[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Published : ${dayjs(posts[data].takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
			capt += `Tot. Comment : ${numberWithCommas(posts[data].commentCount)}\n`;
			capt += `Tot. Like : ${numberWithCommas(posts[data].likeCount)}\n`;

			if (posts[data].post.length === 1) {
				capt += `Caption : ${posts[data].captions.trim()}\n`;

				await client.instance.send(
					from,
					posts[data].post[0].isVideo
						? { video: { url: posts[data].post[0].url }, caption: capt.trim().formatForm() }
						: {
								image: { url: posts[data].post[0].url },
								caption: capt.trim()
						  } /* eslint-disable-line */,
					{ groupMetadata, quoted: message }
				);
			} else {
				capt += `Tot. Media : ${posts[data].post.length}\n`;
				capt += `Caption : ${posts[data].captions.trim()}\n`;

				await client.instance.send(from, { text: capt.trim().formatForm() }, { quoted: message });

				for (const media of posts[data].post) {
					await client.instance.send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {
						groupMetadata
					});
					await delay(300);
				}
			}
		}

		INFOLOG(`${color('Downloaded Instagram Post', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
