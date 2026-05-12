import dayjs from 'dayjs';
import parser from 'yargs-parser';
import { color, delay, formatNumber, isURL, loggers } from '../../utils/modules/index.js';
import { Twitter } from '../../utils/twitter/index.js';

const twitter = new Twitter({ cookie: process.env.TWITTER_COOKIE });

const createPostCaption = (post) => {
	let capt = 'Twitter Post'.formatHeaders();

	capt += `\n\nUsername : ${post.username}\n`;
	capt += `Fullname : ${post.author}\n`;
	capt += `Verified : ${post.isVerified ? 'Verified' : 'Not Verified'}\n`;
	capt += `Blue Verified : ${post.isBlueVerified ? 'Verified' : 'Not Verified'}\n`;

	capt += ` 💭 : ${post.caption.trim()}\n`;

	const postInfo = `*${dayjs(post.published).format('HH.mm A · MMM, YYYY')}${
		['video', 'animated_gif'].includes(post.medias[0].type) ? ` · ${formatNumber(post.viewCount)} 👀` : ''
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
	usage: '!twitterdl `<url(s)>` (you can send multiple link using space in between)',
	aliases: ['twtdl', 'twitdl'],
	category: 'Downloader',
	cooldown: 10,
	limit: 9,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client) {
		if (!query) {
			return await client.reply(from, 'Please specify a url', message);
		}

		let { _: urls } = parser(query);

		if (urls.length === 1 && !isURL(urls[0])) {
			return await client.reply(from, 'Please specify a valid url', message);
		}

		const wait = await client.waitMessage(from, 'Please wait...', message);

		let success = 0;
		let error = 0;

		loggers.warning(`${color('Downloading Twitter Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		for (const url of urls) {
			if (!isURL(url.trim())) {
				await client.reply(from, 'Please specify a valid url\nInvalid : ' + url, message);
				loggers.error(`${color('Failed to Download Twitter Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const post = await twitter.download(url);

			if (post?.error) {
				await client.reply(from, `Error while downloading Twitter post\n\n${post.error}\n${url}`, message);
				loggers.error(`${color('Failed to Download Twitter Post', 'red')} for ${color(prettyNumber, 'lilac')}`);
				error++;
				continue;
			}

			const caption = createPostCaption(post);

			if (post.medias.length > 1) {
				await client.send(from, { text: caption }, { quoted: message });

				for (const media of post.medias) {
					await client.send(
						from,
						media.type === 'video' || media.type === 'animated_gif'
							? { video: { url: media.url } }
							: { image: { url: media.url } },
						{}
					);
					await delay(100);
				}
			} else {
				await client.send(
					from,
					post.medias[0].type === 'video' || post.medias[0].type === 'animated_gif'
						? { video: { url: post.medias[0].url }, caption }
						: { image: { url: post.medias[0].url }, caption },
					{ quoted: message }
				);
			}

			success++;
		}

		await wait.update(`Command Finished. With total ${success} success, and ${error} fail.`);

		loggers.info(`${color('Downloaded Twitter Post', 'pink')} for ${color(prettyNumber, 'lilac')}`);
	}
};
