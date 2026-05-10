import { fetchJSON } from '../../modules/index.js';
import { GRAPHQL_FEATURES, buildGraphQLHeaders, retrieveGuestToken } from './common.js';

const GRAPHQL_USER_TWEETS_API = 'https://x.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?';

/**
 * Parses media from timeline tweet entries.
 * @param {object} m
 * @returns {object}
 */
const parseTimelineMedia = (m) => {
	const detail = { type: m.type };

	if (m.type === 'video' || m.type === 'animated_gif') {
		const info = m.video_info || {};
		const variants = (info.variants || [])
			.filter((v) => v.content_type === 'video/mp4')
			.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

		detail.url = variants[0]?.url || m.media_url_https;

		if (m.type === 'video' && info.duration_millis) {
			detail.duration = info.duration_millis / 1000;
		}

		detail.thumbnail = m.media_url_https;
	} else {
		detail.url = m.media_url_https;
	}

	detail.ratio = {
		width: m.original_info?.width || 0,
		height: m.original_info?.height || 0
	};

	return detail;
};

/**
 * Parses a single tweet entry from the timeline instructions.
 * @param {object} entry
 * @returns {object|null}
 */
export const parseTweetEntry = (entry) => {
	const tweetResult = entry?.content?.itemContent?.tweet_results?.result;

	if (!tweetResult) {
		return null;
	}

	const tweet = tweetResult.__typename === 'TweetWithVisibilityResults' ? tweetResult.tweet : tweetResult;

	if (!tweet?.legacy) {
		return null;
	}

	const legacy = tweet.legacy;
	const userCore = tweet.core?.user_results?.result?.core || {};
	const userLegacy = tweet.core?.user_results?.result?.legacy || {};
	const extMedia = legacy.extended_entities?.media || legacy.entities?.media || [];

	return {
		id: legacy.id_str,
		text: legacy.full_text || '',
		createdAt: legacy.created_at,
		published: new Date(legacy.created_at).getTime(),
		liked: legacy.favorite_count || 0,
		replies: legacy.reply_count || 0,
		retweets: legacy.retweet_count || 0,
		quotes: legacy.quote_count || 0,
		bookmarks: legacy.bookmark_count || 0,
		views: tweet.views?.count ? Number(tweet.views.count) : 0,
		isRetweet: !!legacy.retweeted_status_result,
		isReply: !!legacy.in_reply_to_status_id_str,
		language: legacy.lang,
		hashtags: legacy.entities?.hashtags?.map((h) => h.text) || [],
		urls: legacy.entities?.urls?.map((u) => u.expanded_url) || [],
		username: userCore.screen_name || userLegacy.screen_name || '',
		author: userCore.name || userLegacy.name || '',
		medias: extMedia.map((m) => parseTimelineMedia(m))
	};
};

/**
 * Extracts tweet entries and cursor from the GraphQL timeline response.
 * @param {object} data
 * @returns {{ tweets: object[], cursor: string|null }}
 */
export const parseTimelineResponse = (data) => {
	const instructions = data?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
	const addEntries = instructions.find((i) => i.type === 'TimelineAddEntries');

	if (!addEntries?.entries) {
		return { tweets: [], cursor: null };
	}

	const tweets = [];
	let cursor = null;

	for (const entry of addEntries.entries) {
		if (entry.entryId?.startsWith('tweet-')) {
			const parsed = parseTweetEntry(entry);

			if (parsed) {
				tweets.push(parsed);
			}
		} else if (entry.entryId?.startsWith('cursor-bottom-')) {
			cursor = entry.content?.value || null;
		}
	}

	return { tweets, cursor };
};

/**
 * Fetches tweets from a user's timeline.
 * @param {string} userId - The numeric user ID (rest_id).
 * @param {{ cookie?: string, cursor?: string, count?: number }} [options]
 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
 */
export const fetchUserTweets = async (userId, options = {}) => {
	const { cookie, cursor = null, count = 20 } = options;

	const variables = {
		userId,
		count,
		includePromotedContent: false,
		withQuickPromoteEligibilityTweetFields: true,
		withVoice: true,
		withV2Timeline: true
	};
	const fieldToggles = {
		withArticlePlainText: false
	};

	if (cursor) {
		variables.cursor = cursor;
	}

	const params = new URLSearchParams();

	params.set('variables', JSON.stringify(variables));
	params.set('features', JSON.stringify(GRAPHQL_FEATURES));
	params.set('fieldToggles', JSON.stringify(fieldToggles));

	const guestToken = await retrieveGuestToken();
	const headers = buildGraphQLHeaders({ cookie, guestToken });

	const data = await fetchJSON(GRAPHQL_USER_TWEETS_API + params.toString(), { headers });

	if (data?.errors?.length) {
		return { error: data.errors[0].message || 'Failed to fetch tweets.' };
	}

	return parseTimelineResponse(data);
};
