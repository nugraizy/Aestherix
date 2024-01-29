import { fetchJSON } from '../modules/index.js';
import { stringifyChangelogs } from './utils.js';

const owner = 'nugraizy';
const repo = 'aestherix';
const token = process.env.GITHUB_AUTH_TOKEN;

const _api = `https://api.github.com/repos/${owner}/${repo}/commits`;
const headers = { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` };

export const getChangelogs = (max) =>
	new Promise(async (resolve, reject) => {
		try {
			const response = await fetchJSON(_api, { headers });

			const commits = response.slice(0, max);

			const changelogs = commits.map((commit) => {
				const { sha, commit: commitInfo } = commit;
				const { message, author } = commitInfo;
				const { name, email, date } = author;

				const formattedDate = new Date(date).toLocaleString('en-US', {
					weekday: 'short',
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
					const response = await fetchJSON(url, { headers });

					const { stats, files } = response;

					return { ...changelog, stats, files };
				})
			);

			resolve(stringifyChangelogs(detailedCommits));
		} catch (error) {
			console.log(error);
			reject(error);
		}
	});
