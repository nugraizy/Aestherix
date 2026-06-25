import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { BOT_NAME } from '../../core/constants.js';

import dayjs from 'dayjs';

import { Cache } from '../../helper/modules/cache.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { color, delay, formatNumber, loggers, randomChar } from '../../utils/modules/index.js';
import { Twitter } from '../../utils/twitter/index.js';
import { defineCommand } from '../_define.js';

const twitter = new Twitter({ cookie: process.env.TWITTER_COOKIE });
const searchSessions = new Cache();

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

	let capt = `Result #${index}`.formatHeaders();

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
const sendNextPrompt = async (sessionId, batchSize, searchQuery, from, client, ctx) => {
	const Ls = useLocale(ctx.locale, 'search');
	const builder = new client.TemplateBuilder.Native();

	await builder
		.destination(from)
		.body(t(ctx.locale, 'search.labels.sentResults', [batchSize, searchQuery]))
		.footer(t(ctx.locale, 'common.core.footer.poweredBy', [BOT_NAME]))
		.buttons(
			builder.button.reply({
				display: Ls.buttons.nextImage,
				id: cmdId('twtsearch', `next ${sessionId}`, ctx)
			})
		)
		.send();
};

export default defineCommand({
	name: 'twtsearch',
	minifiedDescription: 'Search Twitter Tweets',
	description: 'Search tweets on Twitter/X by keyword. Shows 5 tweets per page with pagination.',
	usage: '!twtsearch `<query>`',
	aliases: ['twtsr', 'twittersr'],
	category: 'Search',
	cooldown: 8,
	limit: 5,
	status: 'enable',
	async run({ from, query, prettyNumber, message }, client, store, ctx) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');
		const searchCtx = { ...ctx, locale };

		if (!query) {
			return await client.reply(from, L.errors.queryRequired, message);
		}

		if (query.startsWith('next ')) {
			const sessionId = query.slice(5);
			const cached = searchSessions.get(sessionId);

			if (!cached) {
				return await client.reply(from, L.errors.sessionExpired, message);
			}

			if (!cached.buffer.length && cached.cursor) {
				const nextWait = await client.waitMessage(from, L.success.fetchingMore, message);

				const nextPage = await twitter.searchTweets(cached.searchQuery, { cursor: cached.cursor });

				if (nextPage?.error) {
					searchSessions.delete(sessionId);
					return await nextWait.update(nextPage.error);
				}

				cached.buffer.push(...nextPage.tweets);
				cached.cursor = nextPage.cursor;

				await nextWait.update(t(locale, 'search.labels.fetchedResults', [nextPage.tweets.length]));
			}

			if (!cached.buffer.length) {
				searchSessions.delete(sessionId);
				return await client.reply(from, L.info.noMoreTweets, message);
			}

			const nextBatch = cached.buffer.splice(0, TWEETS_PER_PAGE);

			await sendTweetBatch(nextBatch, from, message, client);

			if (cached.buffer.length || cached.cursor) {
				await sendNextPrompt(sessionId, nextBatch.length, cached.searchQuery, from, client, searchCtx);
			} else {
				searchSessions.delete(sessionId);
			}

			return;
		}

		const wait = await client.waitMessage(from, L.success.searchingTweets, message);

		loggers.warning(`${color('Searching Twitter Tweets', 'pink')} for ${color(prettyNumber, 'lilac')}`);

		const result = await twitter.searchTweets(query, twitter.SearchFilter.Top);

		if (result?.error) {
			return await wait.update(t(locale, 'search.labels.errorPrefix', [result.error]));
		}

		if (!result.tweets.length) {
			return await wait.update(Ls.labels.noResults);
		}

		const sessionId = randomChar('abcdefghijklmnopqrstuvwxyz0123456789', 8);
		const cached = { buffer: [...result.tweets], cursor: result.cursor, searchQuery: query };

		searchSessions.set(sessionId, cached);

		await wait.update(t(locale, 'search.labels.foundResults', [cached.buffer.length]));

		const batch = cached.buffer.splice(0, TWEETS_PER_PAGE);

		await sendTweetBatch(batch, from, message, client);

		if (cached.buffer.length || cached.cursor) {
			await sendNextPrompt(sessionId, batch.length, query, from, client, searchCtx);
		} else {
			searchSessions.delete(sessionId);
		}
	}
});
