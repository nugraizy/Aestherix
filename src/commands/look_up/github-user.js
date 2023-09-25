import parser from 'yargs-parser';

import { numberWithCommas, isURL } from '../../utils/modules/index.js';
import { Github } from '../../utils/github/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'gitstalk',
	description: 'Lookup Github user',
	usage: '!gitstalk <username>',
	aliases: ['ghstalk', 'ghuser'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	async run({ from, query, message, args, type, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a url');
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

			return await client[botNum].send(
				from,
				{
					image: { url: avatarUrl },
					caption: 'Github User Lookup'.formatHeaders(),
					templateButtons: [
						{
							urlButton: {
								displayText: 'Image Source',
								url: args[1] === 'next' ? data[index].avatar_url : data[index].avatar_url
							}
						},
						{
							urlButton: { displayText: 'User Source', url: args[1] === 'next' ? data[index].html_url : data[index].html_url }
						},
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next User',
										id: `.gitstalk next ${data[index + 1].html_url} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous User',
										id: `.gitstalk prev ${data[index - 1].html_url} ${JSON.stringify(data)}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Fullname : ${name}
Username : ${login}
Type : ${typeGit}
Tot. Public Repo : ${numberWithCommas(pubRepos)}
Tot. Followers : ${numberWithCommas(followers)}
Tot. Following : ${numberWithCommas(following)}
Created : ${createdAt}
Updated : ${updatedAt}
Biography : ${bio}
                    
Void Bot     ${index + 1}/${data.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata }
			);
		}

		let { _: usernames } = parser(query);

		if (usernames.length == 1 && isURL(usernames[0])) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid Github usernames');
		}

		for (const user of usernames) {
			if (isURL(user.trim())) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, 'Please specify a valid Github username');
				continue;
			}

			const git = new Github();
			let users = await git.searchUser(user);

			if (users.total_count === 0) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, 'User not found.');
				continue;
			}

			users = await git.detailUser(users.items);
			const {
				login,
				html_url: htmlUrl,
				avatar_url: avatarUrl,
				type: typeGit,
				name,
				bio,
				public_repos: pubRepos,
				followers,
				following,
				created_at: createdAt,
				updated_at: updatedAt
			} = users[0];

			await client[botNum].send(
				from,
				{
					image: { url: avatarUrl },
					caption: 'Github User Lookup'.formatHeaders(),
					templateButtons: [
						{ urlButton: { displayText: 'Image Source', url: avatarUrl } },
						{ urlButton: { displayText: 'User Source', url: htmlUrl } },
						users.length !== 1
							? {
									quickReplyButton: {
										displayText: 'Next User',
										id: `.gitstalk next ${users[1].html_url} ${JSON.stringify(users).replace(/\|/g, '')}`
									}
							  } /* eslint-disable-line */
							: {}
					],
					footer: `Fullname : ${name}
Username : ${login}
Type : ${typeGit}
Tot. Public Repo : ${numberWithCommas(pubRepos)}
Tot. Followers : ${numberWithCommas(followers)}
Tot. Following : ${numberWithCommas(following)}
Created : ${createdAt}
Updated : ${updatedAt}
Biography : ${bio}
                    
Void Bot     1/${users.length}\nPowered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`
				},
				{ groupMetadata }
			);
		}
	}
};
