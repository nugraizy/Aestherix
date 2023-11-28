const parseFilesCommitted = (files) => {
	let caption = '';

	if (files.added.length > 0) {
		caption += files.added.map((v) => `+ ${v}\n`).join('');
	}

	if (files.removed.length > 0) {
		caption += files.removed.map((v) => `- ${v}\n`).join('');
	}

	if (files.modified.length > 0) {
		caption += files.modified.map((v) => `± ${v}\n`).join('');
	}

	return caption.trim();
};

export const handleGithubWebhook = async (commitInfo) => {
	const caption = `${'GitHub Notif'.formatHeaders()}

${commitInfo.message}

Author-by : @${commitInfo.author.name}
Committed At : ${commitInfo.timestamp}

${parseFilesCommitted(commitInfo.files)}

*Showing ${commitInfo.filesChanged} changed files with ${commitInfo.additions} additions and ${
		commitInfo.deletions
	} deletions.*`;

	await client.instance.sendMessage('120363027862918129@g.us', {
		text: caption
	});
};
