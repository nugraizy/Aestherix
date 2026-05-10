import { fetch } from 'undici';
import { fetchJSON } from '../../modules/index.js';

export const USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export const BEARER_TOKEN =
	'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

export const GRAPHQL_FEATURES = {
	creator_subscriptions_tweet_preview_api_enabled: true,
	communities_web_enable_tweet_community_results_fetch: true,
	c9s_tweet_anatomy_moderator_badge_enabled: true,
	articles_preview_enabled: true,
	responsive_web_edit_tweet_api_enabled: true,
	graphql_is_translatable_rweb_tweet_is_translatable: true,
	view_counts_everywhere_api_enabled: true,
	longform_notetweets_consumption_enabled: true,
	responsive_web_twitter_article_tweet_consumption_enabled: true,
	tweet_awards_web_tipping_enabled: false,
	creator_subscriptions_quote_tweet_preview_enabled: false,
	freedom_of_speech_not_reach_fetch_enabled: true,
	standardized_nudges_misinfo: true,
	tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
	rweb_video_timestamps_enabled: true,
	longform_notetweets_rich_text_read_enabled: true,
	longform_notetweets_inline_media_enabled: true,
	responsive_web_enhance_cards_enabled: false,
	responsive_web_graphql_exclude_directive_enabled: true,
	verified_phone_label_enabled: false,
	responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
	responsive_web_graphql_timeline_navigation_enabled: true,
	responsive_web_media_download_video_enabled: false,
	tweetypie_unmention_optimization_enabled: true,
	responsive_web_text_conversations_enabled: true,
	vibe_api_enabled: true,
	interactive_text_enabled: true,
	blue_business_profile_image_shape_enabled: true,
	premium_content_api_read_enabled: false
};

/**
 * Retrieves a guest token from Twitter's API.
 * @returns {Promise<string|null>}
 */
export const retrieveGuestToken = async () => {
	try {
		const data = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${BEARER_TOKEN}`
			}
		});

		const json = await data.json();

		return json.guest_token;
	} catch {
		return null;
	}
};

/**
 * Builds common GraphQL request headers.
 * @param {{ cookie?: string, guestToken?: string }} [options]
 * @returns {object}
 */
export const buildGraphQLHeaders = (options = {}) => {
	const headers = {
		'User-Agent': USER_AGENT,
		Authorization: `Bearer ${BEARER_TOKEN}`
	};

	if (options.guestToken) {
		headers['x-guest-token'] = options.guestToken;
	}

	if (options.cookie) {
		const csrfToken = options.cookie.match(/ct0=([^;]+)/)?.[1] || '';

		headers.Cookie = options.cookie;
		headers['x-csrf-token'] = csrfToken;
	}

	return headers;
};

/**
 * Performs a GraphQL request to Twitter's API.
 * @param {string} endpoint
 * @param {object} variables
 * @param {{ cookie?: string }} [options]
 * @returns {Promise<object>}
 */
export const graphqlRequest = async (endpoint, variables, options = {}) => {
	const params = new URLSearchParams();

	params.set('variables', JSON.stringify(variables));
	params.set('features', JSON.stringify(GRAPHQL_FEATURES));

	const guestToken = await retrieveGuestToken();
	const headers = buildGraphQLHeaders({ cookie: options.cookie, guestToken });

	return fetchJSON(endpoint + params.toString(), { headers });
};
