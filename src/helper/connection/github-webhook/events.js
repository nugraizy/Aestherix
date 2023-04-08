const parseFilesCommitted = (files) => {
	let caption = '';

	if (files.added.length > 0) {
		caption += `+ ${files.added.join(', ')}\n`;
	}

	if (files.removed.length > 0) {
		caption += `- ${files.removed.join(', ')}\n`;
	}

	if (files.modified.length > 0) {
		caption += `± ${files.modified.join(', ')}\n`;
	}

	return caption;
};

export const handleGithubWebhook = async (commitInfo) => {
	const caption = `${'GitHub Notif'.formatHeaders()}

${commitInfo.message}

Author-by : @${commitInfo.author.name}
Committed At : ${commitInfo.timestamp}

${parseFilesCommitted(commitInfo.files)}`;

	await client[botNum].sendMessage('120363027862918129@g.us', {
		text: caption
	});
};
