import { fetchJSON } from '../../modules/index.js';
import { GRAPHQL_FEATURES, USER_AGENT, buildGraphQLHeaders, retrieveGuestToken } from './common.js';

const SYNDICATION_API = (id) =>
	`https://cdn.syndication.twimg.com/tweet-result?features=tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_fosnr_soft_interventions_enabled:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_show_birdwatch_pivots_enabled:on;tfw_duplicate_scribes_to_settings:on;tfw_use_profile_image_shape_enabled:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on&id=${id}&lang=en&token=463csqei5v&er314w=5d3k84nflgwx&sotjrh=hq2m8l1pd0al&w93msi=e0rv68u9uca&i4l8z0=9sif78bj1wos&11ga8a=1c5q80rjdxtfo&i3ssqg=hf38hgb8fyc9&o3x2ug=971aofk8p5bm&ovkh3k=2c8tmlyqfiv2`;
const GRAPHQL_TWEET_API = 'https://x.com/i/api/graphql/DJS3BdhUhcaEpZ7B7irJDg/TweetResultByRestId?';

const tweetVariables = (tweetId) => ({
	tweetId,
	withCommunity: false,
	includePromotedContent: false,
	withVoice: false
});

const fieldToggles = {
	withArticleRichContentState: true,
	withArticlePlainText: false,
	withGrokAnalyze: false,
	withDisallowedReplyControls: false
};

/**
 * Extracts the tweet ID from a Twitter/X URL.
 * @param {string} input
 * @returns {{ id: string, url: string } | false}
 */
export const extractTweetId = (input) => {
	const match = input.match(/(twitter|x)\.com\/.*\/status(?:es)?\/(\d{19,20})/);

	if (!match) {
		return false;
	}

	return { id: match[2], url: input };
};

/**
 * Parses the syndication API response into a normalized result.
 * @param {object} data
 * @returns {object}
 */
export const parseSyndicationResponse = (data) => {
	const {
		user,
		text: caption,
		created_at: createdAt,
		favorite_count: likeCount,
		entities: { hashtags },
		conversation_count: replyCount,
		mediaDetails,
		video
	} = data;

	return {
		username: user.screen_name,
		author: user.name,
		caption,
		published: new Date(createdAt).getTime(),
		liked: likeCount,
		replies: replyCount,
		isVerified: user.verified,
		isBlueVerified: user.is_blue_verified,
		profilePicture: user.profile_image_url_https,
		hashtags,
		viewCount: video?.viewCount,
		thumbnail: video?.poster,
		medias: (mediaDetails || []).map((v) => parseMedia(v))
	};
};

/**
 * Parses the GraphQL API response into a normalized result.
 * @param {object} data
 * @returns {object | { error: string }}
 */
export const parseGraphQLResponse = (data) => {
	const result = data?.data?.tweetResult?.result;

	if (!result) {
		return { error: 'Tweet not found or unavailable.' };
	}

	const tweet = result.__typename === 'TweetWithVisibilityResults' ? result.tweet : result;

	if (!tweet?.core?.user_results?.result) {
		return { error: 'Tweet data is incomplete.' };
	}

	const user = tweet.core.user_results.result.legacy;
	const legacy = tweet.legacy;
	const extMedia = legacy?.extended_entities?.media || legacy?.entities?.media || [];

	return {
		username: user.screen_name,
		author: user.name,
		caption: legacy.full_text || '',
		published: new Date(legacy.created_at).getTime(),
		liked: legacy.favorite_count || 0,
		replies: legacy.reply_count || 0,
		retweets: legacy.retweet_count || 0,
		isVerified: user.verified || false,
		isBlueVerified: user.is_blue_verified || false,
		profilePicture: user.profile_image_url_https,
		hashtags: legacy.entities?.hashtags || [],
		viewCount: tweet.views?.count ? Number(tweet.views.count) : undefined,
		thumbnail: extMedia.find((m) => m.type === 'video')?.media_url_https,
		medias: extMedia.map((m) => parseGraphQLMedia(m))
	};
};

/**
 * Parses a single media entry from the syndication API.
 * @param {object} v
 * @returns {object}
 */
export const parseMedia = (v) => {
	const detail = { type: v.type };

	if (v.type === 'video' || v.type === 'animated_gif') {
		const variants = v.video_info.variants
			.filter((w) => w?.content_type === 'video/mp4')
			.sort((a, b) => (b?.bit_rate || 0) - (a?.bit_rate || 0));

		detail.url = variants[0].url;

		if (v.type === 'video') {
			detail.duration = v.video_info.duration_millis / 1000;
		}

		detail.bitrates = variants[0].bitrate;
	} else {
		detail.url = v.media_url_https;
	}

	detail.ratio = {
		width: v.original_info.width,
		height: v.original_info.height
	};

	return detail;
};

/**
 * Parses a single media entry from the GraphQL API.
 * @param {object} m
 * @returns {object}
 */
export const parseGraphQLMedia = (m) => {
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

		detail.bitrates = variants[0]?.bitrate;
	} else {
		detail.url = m.media_url_https;
	}

	detail.ratio = {
		width: m.original_info?.width || m.sizes?.large?.w || 0,
		height: m.original_info?.height || m.sizes?.large?.h || 0
	};

	return detail;
};

/**
 * Fetches tweet data via the syndication API (no auth, no NSFW).
 * @param {string} id
 * @returns {Promise<object>}
 */
export const fetchViaSyndication = async (id) => {
	const data = await fetchJSON(SYNDICATION_API(id), {
		headers: { 'User-Agent': USER_AGENT }
	});

	if ('tombstone' in data) {
		return { error: 'Possible deleted, private tweet, or adult content. Try again with a cookie for NSFW support.' };
	}

	return parseSyndicationResponse(data);
};

/**
 * Fetches tweet data via the GraphQL API (requires cookie, supports NSFW).
 * @param {string} id
 * @param {string} cookie
 * @returns {Promise<object>}
 */
export const fetchViaGraphQL = async (id, cookie) => {
	const params = new URLSearchParams();

	params.set('variables', JSON.stringify(tweetVariables(id)));
	params.set('features', JSON.stringify(GRAPHQL_FEATURES));
	params.set('fieldToggles', JSON.stringify(fieldToggles));

	const guestToken = await retrieveGuestToken();
	const headers = buildGraphQLHeaders({ cookie, guestToken });

	const data = await fetchJSON(GRAPHQL_TWEET_API + params.toString(), { headers });

	return parseGraphQLResponse(data);
};
