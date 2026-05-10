import { graphqlRequest } from './common.js';

const GRAPHQL_USER_API = 'https://x.com/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?';

/**
 * Parses the GraphQL user result into a normalized object.
 * @param {object} data
 * @param {string} fallbackUsername
 * @returns {object | { error: string }}
 */
export const parseUserResponse = (data, fallbackUsername = '') => {
	const result = data?.data?.user?.result;

	if (!result || result.__typename === 'UserUnavailable') {
		return { error: result?.reason || 'User not found.' };
	}

	const legacy = result.legacy;
	const isBlueVerified = result.is_blue_verified;

	return {
		biograph: legacy.description || '',
		username: legacy.screen_name || fallbackUsername,
		name: legacy.name || '',
		userId: result.rest_id,
		joined: legacy.created_at || '',
		verified: legacy.verified || false,
		isBlueVerified,
		imageProfile: (legacy.profile_image_url_https || '').replace('_normal', '_400x400'),
		personalUrl: legacy.entities?.url?.urls?.[0]?.expanded_url || legacy.url || '',
		followers: legacy.followers_count || 0,
		following: legacy.friends_count || 0,
		tweets: legacy.statuses_count || 0,
		likes: legacy.favourites_count || 0,
		banner: legacy.profile_banner_url || ''
	};
};

/**
 * Lookup a Twitter user by username using the GraphQL API.
 * @param {string} input - Twitter username (without @).
 * @param {{ cookie?: string }} [options]
 * @returns {Promise<object | { error: string }>}
 */
export const fetchUser = async (input, options = {}) => {
	const username = input.replace(/^@/, '');

	const variables = {
		screen_name: username,
		withSafetyModeUserFields: true
	};

	const data = await graphqlRequest(GRAPHQL_USER_API, variables, { cookie: options.cookie });

	return parseUserResponse(data, username);
};
