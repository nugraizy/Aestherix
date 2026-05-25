import { BOT_NAME } from '../../core/constants.js';

import dayjs from 'dayjs';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { color, delay, formatNumber, loggers, randomChar } from '../../utils/modules/index.js';
import { Twitter } from '../../utils/twitter/index.js';
import { defineCommand } from '../_define.js';

const twitter = new Twitter({ cookie: process.env.TWITTER_COOKIE });
const timelineSessions = new Cache();

const TWEETS_PER_PAGE = 5;

/**
 * @param {object} tweet
 * @param {number} index
 * @returns {string}
 */
const formatTweetCaption = (tweet, index) => {
	const date = dayjs(tweet.published).format('MMM D, YYYY · HH:mm');
	const stats = `❤️ ${formatNumber(tweet.liked)} · 🔁 ${formatNumber(tweet.retweets)} · 💬 ${formatNumber(tweet.replies)}`;
	const views = tweet.views ? ` · 👀 ${formatNumber(tweet.views)}` : '';
	const flags = [tweet.isRetweet && '🔁 RT', tweet.isReply && '💬 Reply'].filter(Boolean).join(' · ');

	let capt = `Timeline #${index}`.formatHeaders();

	capt += `\n\n@${tweet.username}`;

	if (flags) {
		capt += ` (${flags})`;
	}

	capt += `\n${date}\n\n`;
	capt += tweet.text;
	capt += `\n\n${stats}${views}`;

	if (tweet.medias.length) {
		capt += `\n📎 ${tweet.medias.length} media(s)`;
	}

	return capt.trim().formatForm();
};

/**
 * Sends a single tweet with its media.
 * @param {object} tweet
 * @param {number} index
 * @param {string} from
 * @param {object} message
 * @param {object} client
 */
const sendTweetWithMedia = async (tweet, index, from, message, client) => {
	const caption = formatTweetCaption(tweet, index);

	if (!tweet.medias.length) {
		await client.reply(from, caption, message);
		return;
	}

	const firstMedia = tweet.medias[0];
	const isVideo = firstMedia.type === 'video' || firstMedia.type === 'animated_gif';

	await client.send(
		from,
		isVideo ? { video: { url: firstMedia.url }, caption } : { image: { url: firstMedia.url }, caption },
		{ quoted: message }
	);

	for (let i = 1; i < tweet.medias.length; i++) {
		await delay(150);

		const media = tweet.medias[i];
		const isMediaVideo = media.type === 'video' || media.type === 'animated_gif';

		await client.send(from, isMediaVideo ? { video: { url: media.url } } : { image: { url: media.url } }, {});
	}
};

/**
 * Sends a batch of tweets with their media.
 * @param {object[]} tweets
 * @param {string} from
 * @param {object} message
 * @param {object} client
 */
const sendTweetBatch = async (tweets, from, message, client) => {
	for (let i = 0; i < tweets.length; i++) {
		await sendTweetWithMedia(tweets[i], i + 1, from, message, client);

		if (i < tweets.length - 1) {
			await delay(300);
		}
	}
};

/**
 * Sends the "Next" prompt after a tweet batch.
 */
const sendNextPrompt = async (sessionId, batchSize, from, client, prefix = '.') => {
	const builder = new client.TemplateBuilder.Native();

	await builder
		.destination(from)
		.body(`Sent ${batchSize} tweet(s) from your timeline.\nPress Next to load more.`)
		.footer('Powered by ' + BOT_NAME)
		.buttons(
			builder.button.reply({
				display: 'Next',
				id: cmdId('twttimeline', 'next ' + sessionId, { prefix })
			})
		)
		.send();
};

export default defineCommand({
	name: 'twttimeline',
	minifiedDescription: 'Twitter Timeline',
	description:
		'Fetch your Twitter/X home timeline. Shows 5 tweets per page with pagination. Use --following for the chronological feed.',
	usage: '!twttimeline `[--following]`',
	aliases: ['twthome', 'twtforyou'],
	category: 'Owner',
	cooldown: 8,
	limit: 0,
	status: 'enable',
	async run({ from, query, prettyNumber, message, prefix }, client) {
		if (query?.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = timelineSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, 'Session expired. Please fetch the timeline again.', message);
			}

			if (!cached.buffer.length && cached.cursor) {
				const nextWait = await client.waitMessage(from, 'Fetching more tweets...', message);

				const nextPage = await twitter.getTimeline({ cursor: cached.cursor, isFollowing: cached.isFollowing });

				if (nextPage?.error) {
					timelineSessions.delete(sessionId);
					return await nextWait.update(nextPage.error);
				}

				cached.buffer.push(...nextPage.tweets);
				cached.cursor = nextPage.cursor;

				await nextWait.update(`Fetched ${nextPage.tweets.length} tweet(s).`);
			}

			if (!cached.buffer.length) {
				timelineSessions.delete(sessionId);
				return await client.reply(from, 'No more tweets.', message);
			}

			const nextBatch = cached.buffer.splice(0, TWEETS_PER_PAGE);

			await sendTweetBatch(nextBatch, from, message, client);

			if (cached.buffer.length || cached.cursor) {
				await sendNextPrompt(sessionId, nextBatch.length, from, client, prefix);
			} else {
				timelineSessions.delete(sessionId);
			}

			return;
		}

		const isFollowing = query?.includes('--following');
		const feedLabel = isFollowing ? 'Following' : 'For You';

		const wait = await client.waitMessage(from, `Fetching your ${feedLabel} timeline...`, message);

		loggers.warning(`${color(`Fetching Twitter Timeline (${feedLabel})`, 'pink')} for ${color(prettyNumber, 'lilac')}`);

		const result = await twitter.getTimeline({ isFollowing });

		if (result?.error) {
			return await wait.update(`Error: ${result.error}`);
		}

		if (!result.tweets.length) {
			return await wait.update('No tweets found in your timeline.');
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const cached = { buffer: [...result.tweets], cursor: result.cursor, isFollowing };

		timelineSessions.set(sessionId, cached);

		await wait.update(`Loaded ${cached.buffer.length} tweet(s) from timeline.`);

		const batch = cached.buffer.splice(0, TWEETS_PER_PAGE);

		await sendTweetBatch(batch, from, message, client);

		if (cached.buffer.length || cached.cursor) {
			await sendNextPrompt(sessionId, batch.length, from, client, prefix);
		} else {
			timelineSessions.delete(sessionId);
		}
	}
});
