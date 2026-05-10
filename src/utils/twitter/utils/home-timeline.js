import { fetchJSON } from '../../modules/index.js';
import { GRAPHQL_FEATURES, buildGraphQLHeaders, retrieveGuestToken } from './common.js';
import { parseTweetEntry } from './user-tweets.js';

const GRAPHQL_HOME_TIMELINE_API = 'https://x.com/i/api/graphql/HJFjzBgCs16TqxewQOeLNg/HomeTimeline?';
const GRAPHQL_HOME_LATEST_TIMELINE_API = 'https://x.com/i/api/graphql/DiTkXJgAqBFC_S6QKBmxAQ/HomeLatestTimeline?';

/**
 * Extracts tweet entries and cursor from the home timeline GraphQL response.
 * @param {object} data
 * @returns {{ tweets: object[], cursor: string|null }}
 */
export const parseHomeTimelineResponse = (data) => {
	const instructions = data?.data?.home?.home_timeline_urt?.instructions || [];
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
 * Fetches the authenticated user's home timeline.
 * Requires a valid cookie (ct0 + auth_token).
 *
 * @param {{ cookie: string, cursor?: string, count?: number, isFollowing?: boolean }} options
 * @param {boolean} [options.isFollowing=false] - If true, fetches the chronological "Following" tab
 *   (HomeLatestTimeline). Otherwise fetches the algorithmic "For You" tab (HomeTimeline).
 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
 */
export const fetchHomeTimeline = async (options = {}) => {
	const { cookie, cursor = null, count = 20, isFollowing = false } = options;

	if (!cookie) {
		return { error: 'A valid Twitter cookie is required to fetch the home timeline.' };
	}

	const endpoint = isFollowing ? GRAPHQL_HOME_LATEST_TIMELINE_API : GRAPHQL_HOME_TIMELINE_API;

	const variables = {
		count,
		includePromotedContent: false,
		latestControlAvailable: true,
		requestContext: 'launch',
		withCommunity: true
	};

	if (cursor) {
		variables.cursor = cursor;
	}

	const params = new URLSearchParams();

	params.set('variables', JSON.stringify(variables));
	params.set('features', JSON.stringify(GRAPHQL_FEATURES));

	const guestToken = await retrieveGuestToken();
	const headers = buildGraphQLHeaders({ cookie, guestToken });

	const data = await fetchJSON(endpoint + params.toString(), { headers });

	if (data?.errors?.length) {
		return { error: data.errors[0].message || 'Failed to fetch home timeline.' };
	}

	return parseHomeTimelineResponse(data);
};
