import fs from 'fs-extra';

const { version } = await fs.readJSON('./package.json');

export const stringifyChangelogs = (data) => {
	let caption = `⚙️ ${'Aestherix'.formatHeaders(true)} *Changelog* v${version} ⚙️

Total Commits **
From: ${data[data.length - 1].author.formattedDate}
To: ${data[0].author.formattedDate}

${'一'.repeat(10)}`;

	data.forEach((commit) => {
		const { message, author, files, stats } = commit;
		const { name, formattedDate } = author;

		const numFilesChanged = files.length;
		const numAdditions = stats.additions;
		const numDeletions = stats.deletions;

		caption += `
📅 Date : ${formattedDate.formatHeaders(true)}
👥 Author : ${name.formatHeaders(true)}
💬 Message : ${message
			.split('\n')
			.map((v) => `_${v}_`)
			.join('\n')}
🗂 ${numFilesChanged} _*changed*_ files with ${numAdditions} _*additions*_ and ${numDeletions} _*deletions.*_
${'一'.repeat(10)}`;
	});

	return caption;
};
