import dayjs from 'dayjs';
import parser from 'yargs-parser';
import { color, delay, loggers, isURL, formatNumber } from '../../utils/modules/index.js';
import { twitterDownload } from '../../utils/twitter/index.js';

const createPostCaption = (post) => {
	let capt = 'Twitter Post'.formatHeaders();

	capt += `\n\nUsername : ${post.username}\n`;
	capt += `Fullname : ${post.author}\n`;
	capt += `Verified : ${post.isVerified ? 'Verified' : 'Not Verified'}\n`;
	capt += `Blue Verified : ${post.isBlueVerified ? 'Verified' : 'Not Verified'}\n`;

	capt += ` 💭 : ${post.caption.trim()}\n`;

	const postInfo = `*${dayjs(post.published).format('HH.mm A · MMM, YYYY')}${
		post.medias[0].type === 'video' ? ` · ${formatNumber(post.viewCount)} 👀` : ''
	}*\n`;

	capt += postInfo;
	capt += `${formatNumber(post.replies)} 💬 · ${formatNumber(post.liked)} ❤️\n`;

	return capt.trim().formatForm();
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'twitterdl',
	minifiedDescription: 'Download Twitter post',
	description: 'Download Twitter post',
	usage: '!twitterdl <url>',
	aliases: ['twtdl', 'twitdl'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.instance.reply('Please specify a url', { from, quoted: message });
		}

		let { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.instance.reply('Please specify a valid url', { from, quoted: message });
		}

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.instance.reply('Please specify a valid url', { from, quoted: message });

				continue;
			}

			loggers.warning(`${color('Downloading Twitter Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);

			const post = await twitterDownload(url);

			if (post?.error) {
				await client.instance.reply(`Error while downloading Twitter post\n\n${post.error}\n${url}`, {
					from,
					quoted: message
				});
				loggers.error(`${color('Failed to Download Twitter Post', '#FF5555')} for ${color(prettyNumber, '#E4C1F9')}`);

				continue;
			}

			const caption = createPostCaption(post);

			if (post.medias.length > 1) {
				await client.instance.send(from, { text: caption }, { quoted: message });

				for (const media of post.medias) {
					await client.instance.send(
						from,
						media.type === 'video' ? { video: { url: media.url } } : { image: { url: media.url } },
						{}
					);
					await delay(100);
				}
			} else {
				await client.instance.send(
					from,
					post.medias[0].type === 'video'
						? { video: { url: post.medias[0].url }, caption }
						: { image: { url: post.medias[0].url }, caption },
					{ quoted: message }
				);
			}

			loggers.info(`${color('Downloaded Twitter Post', '#FF99C8')} for ${color(prettyNumber, '#E4C1F9')}`);
		}
	}
};
