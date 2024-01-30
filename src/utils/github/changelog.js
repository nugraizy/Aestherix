import { fetch } from 'undici';

import { Cache } from '../../helper/modules/cache.js';

const owner = 'nugraizy';
const repo = 'aestherix';
const token = process.env.GITHUB_AUTH_TOKEN;

const _api = `https://api.github.com/repos/${owner}/${repo}/commits`;
const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` };

const cache = new Cache();
let lastRateLimitReset = 0;

export const getChangelogs = async (max, page = 1) => {
	try {
		const perPage = 30;

		const key = `${owner}/${repo}/${page}`;

		if (cache.has(key)) {
			return cache.get(key);
		}

		const data = await fetch(`${_api}?per_page=${perPage}&page=${page}`, { headers });

		const remainingRequests = data.headers.get('X-RateLimit-Remaining');
		const rateLimitReset = data.headers.get('X-RateLimit-Reset');

		if (remainingRequests === '0' && rateLimitReset) {
			const currentTime = Math.floor(Date.now() / 1000);
			const resetTimestamp = parseInt(rateLimitReset, 10);
			const delayInSeconds = Math.max(0, resetTimestamp - currentTime);

			if (lastRateLimitReset < resetTimestamp) {
				lastRateLimitReset = resetTimestamp;

				await new Promise((resolve) => setTimeout(resolve, delayInSeconds * 1000));
			}
		}

		const linkHeader = data.headers.get('Link');
		const hasNextPage = linkHeader && linkHeader.includes('rel="next"');

		const response = await data.json();

		const actualCommitsCount = response.length;

		const commits = response.slice(0, max);

		const changelogs = commits.map((commit) => {
			const { sha, commit: commitInfo } = commit;
			const { message, author } = commitInfo;
			const { name, email, date } = author;

			const formattedDate = new Date(date).toLocaleString('id-ID', {
				weekday: 'long',
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				timeZone: 'Asia/Jakarta'
			});

			return { sha, message, author: { name, email, date, formattedDate } };
		});

		const detailedCommits = await Promise.all(
			changelogs.map(async (changelog) => {
				const { sha } = changelog;
				const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
				const response = await fetch(url, { headers });

				const { stats, files } = await response.json();

				return { ...changelog, stats, files };
			})
		);

		cache.set(key, detailedCommits);

		if (!hasNextPage || detailedCommits.length >= max || actualCommitsCount < perPage) {
			return detailedCommits;
		} else {
			const nextPage = page + 1;
			const nextCommits = await getChangelogs(max - detailedCommits.length, nextPage);

			return [...detailedCommits, ...nextCommits];
		}
	} catch (error) {
		console.log(error);
	}
};
