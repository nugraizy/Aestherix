/* global botNum */
import moment from 'moment-timezone';
import parser from 'yargs-parser';

import { color, delay, ERRLOG, INFOLOG, isOne, isURL, numberWithCommas, parseCode } from '../../Helper/Modules/index.js';
import { getPost } from '../../Utils/Instagram/index.js';

const regex = (input) => {
	return /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv|s)\/([^/?#&]+)).*/.test(input);
};

export default {
	name: 'igpost',
	description: 'Downloads the post of the user',
	usage: '!igpost <url>',
	aliases: ['igpost', 'igp'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		const time = moment().format('HH:mm:ss DD/MM');

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a url');
		}

		const { _: urls } = parser(query);

		if (isOne(urls.length) && !isURL(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');
		}

		if (isOne(urls.length) && !regex(urls[0])) {
			return await client[botNum].reply({ from, quoted: message }, 'Please specify a valid Instagram url');
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid url');

				continue;
			} else if (!regex(url.trim())) {
				await client[botNum].reply({ from, quoted: message }, 'Please specify a valid Instagram url');

				continue;
			}

			const parse = parseCode(url.trim());

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloading Instagram Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);

			if (parse) {
				const post = await getPost(parse);

				if ('error' in post) {
					await client[botNum].reply({ from, quoted: message }, `Error while downloading Instagram post\n\n${post.error}\n${url}`);
					ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Download Instagram Post', 'red')} for ${color(prettyNumber, '#ff71ce')}`);

					continue;
				}

				let capt = '``` • Instagram Post```\n\n';

				capt += `Username : ${post.username}\n`;
				capt += `Fullname : ${post.fullName}\n`;
				capt += `Privacy : ${post.isPrivate ? 'Private' : 'Public'}\n`;
				capt += `Verified : ${post.isVerified ? 'Verified' : 'Not Verified'}\n`;
				capt += `Published : ${moment(post.takenAt * 1000).format('HH:mm:ss DD/MM/YYYY')}\n`;
				capt += `Tot. Comment : ${numberWithCommas(post.commentCount)}\n`;
				capt += `Tot. Like : ${numberWithCommas(post.likeCount)}\n`;

				if (isOne(post.post.length)) {
					capt += `Caption : ${post.captions.trim()}\n`;

					await client[botNum].sendMessage(
						from,
						post.post[0].isVideo
							? { video: { url: post.post[0].url }, caption: capt.trim() }
							: {
									image: { url: post.post[0].url },
									caption: capt.trim(),
							  } /* eslint-disable-line */,
						{ quoted: message },
					);
				} else {
					capt += `Tot. Media : ${post.post.length}\n`;
					capt += `Caption : ${post.captions.trim()}\n`;

					await client[botNum].sendMessage(from, { text: capt.trim() }, { quoted: message });

					for (const media of post.post) {
						await client[botNum].sendMessage(from, media.isVideo ? { video: { url: media.url } } : { image: { url: media.url } });
						await delay(300);
					}
				}

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Downloaded Instagram Post', '#01cdfe')} for ${color(prettyNumber, '#ff71ce')}`);
			} else {
				ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Parse Instagram Post URL', 'red')} for ${color(prettyNumber, '#ff71ce')}`);
			}
		}
	},
};
