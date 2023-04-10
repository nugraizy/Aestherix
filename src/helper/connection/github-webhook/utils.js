import dotenv from 'dotenv';

import { fetchJSON } from '../../../utils/modules/index.js';

dotenv.config();

const _api = (commitSha) => `https://api.github.com/repos/nugraizy/simplebotPRO3/commits/${commitSha}`;
const _config = { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}` };

export const parseCommit = (commit) => {
	const commitInfo = {
		message: commit.message,
		author: {
			name: commit.committer.name
		},
		timestamp: commit.timestamp,
		url: commit.url,
		sha: commit.sha,
		files: {
			added: commit.added,
			modified: commit.modified,
			removed: commit.removed
		}
	};

	return commitInfo;
};

export const getFilesChanged = async (sha) => {
	const data = await fetchJSON(_api(sha), _config);
	const filesChanged = data.files.length;
	const additions = data.stats.additions;
	const deletions = data.stats.deletions;

	return {
		filesChanged,
		additions,
		deletions
	};
};
