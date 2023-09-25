import dayjs from 'dayjs';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isURL, numberWithCommas, parseCode } from '../../utils/modules/index.js';
import { getPost } from '../../utils/instagram/index.js';

const regex = (input) => /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^/?#&]+)).*/.test(input);

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'igpost',
	description: 'Downloads the post of the user',
	usage: '!igpost <url>',
	aliases: ['igpost', 'igp'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message, grouppMetadata }, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a url');
		}

		const { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');
		}

		if (urls.length === 1 && !regex(urls[0])) {
			return await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Instagram url');
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply({ grouppMetadata, from, quoted: message }, 'Please specify a valid Instagram url');

				continue;
			}

			const parse = parseCode(url.trim());

			INFOLOG(
				`[${color(time, 'cyan')}]`,
				`${color('Downloading Instagram Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
			);

			if (parse) {
				const post = await getPost(parse);

				if ('error' in post) {
					await client[botNum].reply(
						{ grouppMetadata, from, quoted: message },
						`Error while downloading Instagram post\n\n${post.error}\n${url}`
					);
					ERRLOG(
						`[${color(time, 'cyan')}]`,
						`⚠️ ${color('Failed to Download Instagram Post', 'red')} for ${color(prettyNumber, '#ff71ce')}`
					);

					continue;
				}

				let capt = 'Instagram Post'.formatHeaders();

				capt += `\n\nUsername : ${post.username}\n`;
				capt += `Fullname : ${post.fullName}\n`;
				capt += `Privacy : ${post.isPrivate ? 'Private' : 'Public'}\n`;
				capt += `Verified : ${post.isVerified ? 'Verified' : 'Not Verified'}\n`;
				capt += `Published : ${dayjs(post.takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
				capt += `Tot. Comment : ${numberWithCommas(post.commentCount)}\n`;
				capt += `Tot. Like : ${numberWithCommas(post.likeCount)}\n`;

				if (post.post.length === 1) {
					capt += `Caption : ${post.captions.trim()}\n`;

					await client[botNum].send(
						from,
						post.post[0].isVideo
							? { video: { url: post.post[0].url }, caption: capt.trim() }
							: {
									image: { url: post.post[0].url },
									caption: capt.trim()
							  } /* eslint-disable-line */,
						{ grouppMetadata, quoted: message }
					);
				} else {
					capt += `Tot. Media : ${post.post.length}\n`;
					capt += `Caption : ${post.captions.trim()}\n`;

					await client[botNum].send(from, { text: capt.trim() }, { quoted: message });

					for (const media of post.post) {
						await client[botNum].send(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {
							grouppMetadata
						});
						await delay(300);
					}
				}

				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color('Downloaded Instagram Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`
				);
			} else {
				ERRLOG(
					`[${color(time, 'cyan')}]`,
					`⚠️ ${color('Failed to Parse Instagram Post URL', 'red')} for ${color(prettyNumber, '#ff71ce')}`
				);
			}
		}
	}
};
