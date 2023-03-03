/* global botNum */
import dayjs from 'dayjs';
import parser from 'yargs-parser';
import { color, delay, ERRLOG, INFOLOG, isURL, numberWithCommas } from '../../helper/modules/index.js';
import { twitterDownload } from '../../utils/twitter/index.js';

export default {
	name: 'twitterdl',
	description: 'Download Twitter post',
	usage: '!twitterdl <url>',
	aliases: ['twtdl', 'twitdl'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a url');
		}

		let { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');

				continue;
			}

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading Twitter Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);

			const post = await twitterDownload(url);

			if ('error' in post) {
				await client[botNum].reply({ from, quoted: message }, `Error while downloading Twitter post\n\n${post.error}\n${url}`);
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Download Twitter Post', 'red')} for ${color(prettyNumber, '#ff71ce')}`,
				);

				continue;
			}

			let capt = 'Twitter Post'.formatHeaders();

			capt += `Username : ${post.username}\n`;
			capt += `Fullname : ${post.author}\n`;
			capt += `Verified : ${post.verified ? 'Verified' : 'Not Verified'}\n`;
			capt += `Published : ${post.published}\n`;
			capt += `Tot. Comment : ${numberWithCommas(post.replies)}\n`;
			capt += `Tot. Like : ${numberWithCommas(post.liked)}\n`;
			capt += `Tot. Retweet : ${numberWithCommas(post.retweet)}\n`;

			if (post.medias.length === 1) {
				capt += `Caption : ${post.caption.trim()}\n`;

				await client[botNum].sendMessage(
					from,
					post.medias[0].type === 'video'
						? { video: { url: post.medias[0].url }, caption: capt.trim() }
						: {
								image: { url: post.medias[0].url },
								caption: capt.trim(),
						  } /* eslint-disable-line */,
					{ quoted: message },
				);
			} else {
				capt += `Tot. Media : ${post.medias.length}\n`;
				capt += `Caption : ${post.caption.trim()}\n`;

				await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });

				for (const media of post.medias) {
					await client[botNum].sendMessage(
						from,
						media.type === 'video' ? { video: { url: media.url } } : { image: { url: media.url } },
					);
					await delay(100);
				}
			}

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloaded Twitter Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`,
			);
		}
	},
};
