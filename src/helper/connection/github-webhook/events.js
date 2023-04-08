const parseFilesCommited = (files) => {
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
Comitted At : ${commitInfo.timestamp}

${parseFilesCommited(commitInfo.files)}`;

	await client[botNum].send('120363027862918129@g.us', {
		text: caption,
		buttons: [
			{
				buttonId: '$> git pull origin main',
				buttonText: { displayText: 'Pull' },
				type: 1
			}
		]
	});
};
