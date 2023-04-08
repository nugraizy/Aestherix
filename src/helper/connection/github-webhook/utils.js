export const parseCommit = (commit) => {
	const commitInfo = {
		message: commit.message,
		author: {
			name: commit.committer.name
		},
		timestamp: commit.timestamp,
		url: commit.url,
		files: {
			added: commit.added,
			modified: commit.modified,
			removed: commit.removed
		}
	};

	return commitInfo;
};
