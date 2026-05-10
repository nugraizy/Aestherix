import { fetchHomeTimeline } from './utils/home-timeline.js';
import { extractTweetId, fetchViaGraphQL, fetchViaSyndication } from './utils/media-downloader.js';
import { fetchSearchTimeline } from './utils/search-timeline.js';
import { fetchUser } from './utils/user-lookup.js';
import { fetchUserTweets } from './utils/user-tweets.js';

/**
 * Twitter/X client that wraps all Twitter utility functions.
 *
 * @example
 * const twitter = new Twitter({ cookie: 'ct0=...; auth_token=...' });
 *
 * // Download a tweet's media
 * const post = await twitter.download('https://x.com/user/status/123');
 *
 * // Lookup a user
 * const user = await twitter.getUser('elonmusk');
 *
 * // Fetch tweets with pagination
 * const page1 = await twitter.getUserTweets('elonmusk', { count: 10 });
 * const page2 = await twitter.getUserTweets('elonmusk', { cursor: page1.cursor });
 */
export class Twitter {
	/**
	 * @param {{ cookie?: string }} [options]
	 */
	constructor(options = {}) {
		this._cookie = options.cookie || null;
		this.SearchFilter = {
			Top: 'Top',
			Latest: 'Latest',
			Photos: 'Photos',
			Videos: 'Videos',
			Users: 'Users'
		};
	}

	/**
	 * Sets or updates the session cookie.
	 * @param {string} cookie
	 */
	setCookie(cookie) {
		this._cookie = cookie;
	}

	/**
	 * Download tweet media by URL.
	 * When a cookie is set, NSFW/sensitive content is supported via GraphQL.
	 * Otherwise, the public syndication API is used.
	 *
	 * @param {string} url - A Twitter/X post URL.
	 * @returns {Promise<object | { error: string }>}
	 */
	async download(url) {
		const parsed = extractTweetId(url);

		if (!parsed) {
			return { error: 'This is not a valid Twitter URL.' };
		}

		if (this._cookie) {
			return await fetchViaGraphQL(parsed.id, this._cookie);
		}

		return await fetchViaSyndication(parsed.id);
	}

	/**
	 * Lookup a user by username.
	 *
	 * @param {string} username - Twitter username (with or without @).
	 * @returns {Promise<object | { error: string }>}
	 */
	async getUser(username) {
		return fetchUser(username, { cookie: this._cookie });
	}

	/**
	 * Fetch tweets from a user's timeline with cursor-based pagination.
	 *
	 * Accepts either a username (string starting with @ or plain text) or a
	 * numeric user ID. If a username is provided, it resolves the user ID
	 * automatically via `getUser()`.
	 *
	 * @param {string} usernameOrId - Username or numeric user ID.
	 * @param {{ cursor?: string, count?: number }} [options]
	 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
	 */
	async getUserTweets(usernameOrId, options = {}) {
		let userId = usernameOrId;

		const isNumericId = /^\d+$/.test(usernameOrId);

		if (!isNumericId) {
			const user = await this.getUser(usernameOrId);

			if (user?.error) {
				return { error: user.error };
			}

			userId = user.userId;

			if (!userId) {
				return { error: 'Could not resolve user ID.' };
			}
		}

		return fetchUserTweets(userId, {
			cookie: this._cookie,
			cursor: options.cursor,
			count: options.count
		});
	}

	/**
	 * Fetch the authenticated user's home timeline.
	 * Requires a cookie to be set.
	 *
	 * @param {{ cursor?: string, count?: number, isFollowing?: boolean }} [options]
	 * @param {boolean} [options.isFollowing=false] - If true, fetches the chronological
	 *   "Following" tab. Otherwise fetches the algorithmic "For You" tab.
	 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
	 */
	async getTimeline(options = {}) {
		if (!this._cookie) {
			return { error: 'A cookie is required to fetch the home timeline.' };
		}

		return fetchHomeTimeline({
			cookie: this._cookie,
			cursor: options.cursor,
			count: options.count,
			isFollowing: options.isFollowing
		});
	}

	/**
	 * Search tweets by query.
	 *
	 * @param {string} query - The search query string.
	 * @param {string} filter - The filter to use for the search (Top, Latest, Photos, Videos, Users).
	 * @param {{ cursor?: string, count?: number }} [options]
	 * @returns {Promise<{ tweets: object[], cursor: string|null } | { error: string }>}
	 */
	async searchTweets(query, filter, options = {}) {
		return fetchSearchTimeline(query, filter, {
			cookie: this._cookie,
			cursor: options.cursor,
			count: options.count
		});
	}
}
