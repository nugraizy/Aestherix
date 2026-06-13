import parser from 'yargs-parser';

import { Github } from '../../utils/github/index.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { isURL, numberWithCommas } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'gitstalk',
	minifiedDescription: 'Look-up Github User',
	description: 'Look-up Github user.',
	usage: '!gitstalk `<username>`',
	aliases: ['ghstalk', 'ghuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, message, args, type }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.html_url === args[2]);
			const {
				login,
				avatar_url: avatarUrl,
				type: typeGit,
				name,
				bio,
				public_repos: pubRepos,
				followers,
				following,
				created_at: createdAt,
				updated_at: updatedAt
			} = data[index];

			return await client.send(
				from,
				{
					image: { url: avatarUrl },
					caption: `${'Github User Lookup'.formatHeaders()}

Fullname : ${name}
Username : ${login}
Type : ${typeGit}
Tot. Public Repo : ${numberWithCommas(pubRepos)}
Tot. Followers : ${numberWithCommas(followers)}
Tot. Following : ${numberWithCommas(following)}
Created : ${createdAt}
Updated : ${updatedAt}
Biography : ${bio}
                    
Powered by Hidden Finder`.formatForm()
					// templateButtons: [
					// 	{
					// 		urlButton: {
					// 			displayText: 'Image Source',
					// 			url: args[1] === 'next' ? data[index].avatar_url : data[index].avatar_url
					// 		}
					// 	},
					// 	{
					// 		urlButton: { displayText: 'User Source', url: args[1] === 'next' ? data[index].html_url : data[index].html_url }
					// 	},
					// 	index + 1 !== data.length
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Next User',
					// 					id: `.gitstalk next ${data[index + 1].html_url} ${JSON.stringify(data)}`
					// 				}
					// 		  } /* eslint-disable-line */
					// 		: {},
					// 	index !== 0
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Previous User',
					// 					id: `.gitstalk prev ${data[index - 1].html_url} ${JSON.stringify(data)}`
					// 				}
					// 		  } /* eslint-disable-line */
					// 		: {}
					// ],
				},
				{}
			);
		}

		let { _: usernames } = parser(query);

		if (usernames.length == 1 && isURL(usernames[0])) {
			return await client.reply(from, L.errors.gitUsernameRequired, message);
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client.reply(from, L.errors.gitUsernameRequired, message);
				continue;
			}

			const git = new Github();
			let users = await git.searchUser(user);

			if (users.total_count === 0) {
				await client.reply(from, L.errors.notFound, message);
				continue;
			}

			users = await git.detailUser(users.items);
			const caption = users
				.map(
					({
						login,
						type: typeGit,
						name,
						bio,
						public_repos: pubRepos,
						followers,
						following,
						created_at: createdAt,
						updated_at: updatedAt
					}) => {
						return `Fullname : ${name}
Username : ${login}
Type : ${typeGit}
Tot. Public Repo : ${numberWithCommas(pubRepos)}
Tot. Followers : ${numberWithCommas(followers)}
Tot. Following : ${numberWithCommas(following)}
Created : ${createdAt}
Updated : ${updatedAt}
Biography : ${bio}`;
					}
				)
				.join('\n\n');
			// const {
			// 	login,
			// 	html_url: htmlUrl,
			// 	avatar_url: avatarUrl,
			// 	type: typeGit,
			// 	name,
			// 	bio,
			// 	public_repos: pubRepos,
			// 	followers,
			// 	following,
			// 	created_at: createdAt,
			// 	updated_at: updatedAt
			// } = users[0];

			await client.send(
				from,
				{
					image: { url: users[0].avatar_url },
					caption: 'Github User Lookup'.formatHeaders() + `\n\n${caption.trim()}`
					// templateButtons: [
					// 	{ urlButton: { displayText: 'Image Source', url: avatarUrl } },
					// 	{ urlButton: { displayText: 'User Source', url: htmlUrl } },
					// 	users.length !== 1
					// 		? {
					// 				quickReplyButton: {
					// 					displayText: 'Next User',
					// 					id: `.gitstalk next ${users[1].html_url} ${JSON.stringify(users).replace(/\|/g, '')}`
					// 				}
					// 		  } /* eslint-disable-line */
					// 		: {}
					// ]
					// 					footer: `Fullname : ${name}
					// Username : ${login}
					// Type : ${typeGit}
					// Tot. Public Repo : ${numberWithCommas(pubRepos)}
					// Tot. Followers : ${numberWithCommas(followers)}
					// Tot. Following : ${numberWithCommas(following)}
					// Created : ${createdAt}
					// Updated : ${updatedAt}
					// Biography : ${bio}

					// Void Bot     1/${users.length}\nPowered by Hidden Finder`
				},
				{}
			);
		}
	}
});
