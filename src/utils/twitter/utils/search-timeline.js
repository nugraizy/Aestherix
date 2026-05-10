import { fetchJSON } from '../../modules/index.js';
import { getClientTransactionId } from './client-transaction.js';
import { buildGraphQLHeaders, GRAPHQL_FEATURES } from './common.js';
import { parseTweetEntry } from './user-tweets.js';

const GRAPHQL_SEARCH_TIMELINE_API = 'https://x.com/i/api/graphql/4fpceYZ6-YQCx_JSl_Cn_A/SearchTimeline?';

/**
 * Extracts tweet entries and cursor from the search timeline GraphQL response.
 * @param {object} data
 * @returns {{ tweets: object[], cursor: string|null }}
 */
export const parseSearchTimelineResponse = (data) => {
	const instructions = data?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
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
 * Searches tweets via the Twitter/X GraphQL SearchTimeline endpoint.
 *
 * @param {string} query - The search query string.
 * @param {{ cookie?: string, cursor?: string, count?: number }} [options]
 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
 */
export const fetchSearchTimeline = async (query, filter, options = {}) => {
	const { cookie, cursor = null, count = 20 } = options;

	if (!cookie) {
		return { error: 'A cookie is required to search tweets from timeline.' };
	}

	if (!query) {
		return { error: 'A search query is required.' };
	}

	const variables = {
		rawQuery: query,
		count,
		querySource: 'typed_query',
		product: filter,
		withGrokTranslatedBio: true
	};

	if (cursor) {
		variables.cursor = cursor;
	}

	const params = new URLSearchParams();

	params.set('variables', JSON.stringify(variables));
	params.set('features', JSON.stringify(GRAPHQL_FEATURES));

	const headers = buildGraphQLHeaders({ cookie });

	const GRAPHQL_PATH = '/i/api/graphql/4fpceYZ6-YQCx_JSl_Cn_A/SearchTimeline';
	const transactionId = await getClientTransactionId('GET', GRAPHQL_PATH);

	delete headers['User-Agent'];

	const requestHeaders = {
		...headers,
		Accept: '*/*',
		Referer: `https://x.com/search?q=${query}&src=typed_query`,
		'Sec-Fetch-Dest': 'empty',
		'Sec-Fetch-Mode': 'cors',
		'Sec-Fetch-Site': 'same-origin',
		'Content-Type': 'application/json',
		'X-Twitter-Active-user': 'yes',
		'X-Twitter-Auth-Type': 'OAuth2Session',
		'X-Twitter-Client-Language': 'en',
		'X-Client-Transaction-Id': transactionId
	};

	const data = await fetchJSON(GRAPHQL_SEARCH_TIMELINE_API + params.toString(), {
		headers: requestHeaders
	});

	if (data?.errors?.length) {
		return { error: data.errors[0].message || 'Failed to search tweets.' };
	}

	return parseSearchTimelineResponse(data);
};
