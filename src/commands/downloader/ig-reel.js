import parser from 'yargs-parser';
import dayjs from 'dayjs';

import { color, delay, ERRLOG, INFOLOG } from '../../utils/modules/index.js';
import { instagram } from '../../utils/instagram/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'igreel',
	minifiedDescription: 'Download Instagram Reel',
	description: 'Downloads the reel of the user',
	usage: '!igreel <url>',
	aliases: ['igreel', 'igr'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, groupMetadata }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message, groupMetadata });
		}

		const { _: urls } = parser(query);

		const reels = await instagram.download.post(urls);

		INFOLOG(`${color('Downloading Instagram reel', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);

		for (const data in reels) {
			if ('error' in reels[data]) {
				await client.instance.reply(`Error while downloading Instagram reel\n\n${reels[data].error}\n${data}`, {
					from,
					quoted: message,
					groupMetadata
				});
				ERRLOG(`⚠️ ${color('Failed to Download Instagram reel', '#FF5555')} for ${color(prettyNumber, '#ff71ce')}`);
				continue;
			}

			let capt = 'Instagram reel'.formatHeaders();

			capt += `\n\nUsername : ${reels[data].username}\n`;
			capt += `Fullname : ${reels[data].fullName}\n`;
			capt += `Privacy : ${reels[data].isPrivate ? 'Private' : 'Public'}\n`;
			capt += `Verified : ${reels[data].isVerified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Published : ${dayjs(reels[data].takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
			capt += `Tot. Comment : ${reels[data].commentCount}\n`;
			capt += `Tot. Like : ${reels[data].likeCount}\n`;

			if (reels[data].post.length === 1) {
				capt += `Caption : ${reels[data].captions.trim()}\n`;

				await client.instance.send(
					from,
					reels[data].post[0].isVideo
						? { video: { url: reels[data].post[0].url }, caption: capt.trim() }
						: {
								image: { url: reels[data].post[0].url },
								caption: capt.trim()
						  } /* eslint-disable-line */,
					{ groupMetadata, quoted: message }
				);
			}

			await delay(100);
		}

		INFOLOG(`${color('Downloaded Instagram reel', 'cyan')} for ${color(prettyNumber, '#ff71ce')}`);
	}
};
