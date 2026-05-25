import { BOT_NAME } from '../../core/constants.js';

import fs from 'fs-extra';

const { version } = await fs.readJSON('./package.json');
const { GITHUB_AUTH_TOKEN } = process.env;

const graphqlQuery = `
		{
			repository(owner: "nugraizy", name: "aestherix") {
				ref(qualifiedName: "main") {
					target {
						... on Commit {
							history {
								totalCount
							}
						}
					}
				}
			}
		}
	`;

const getTotalCommit = async () => {
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		body: JSON.stringify({ query: graphqlQuery }),
		headers: {
			Authorization: `Bearer ${GITHUB_AUTH_TOKEN}`
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
	}

	const data = await response.json();
	const count = data?.data?.repository?.ref?.target?.history?.totalCount ?? null;

	if (count === null) {
		throw new Error('Unable to fetch commit count (invalid repo or branch)');
	}

	return count;
};

export const stringifyChangelogs = async (data) => {
	const totalCommit = await getTotalCommit();
	let caption = `⚙️ ${BOT_NAME.formatHeaders(true)} *Changelog* v${version} ⚙️

Total Commits *${totalCommit}*
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
