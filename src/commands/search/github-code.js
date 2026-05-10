import { cmdId } from '../../helper/modules/prefix.js';
import { Github } from '../../utils/github/index.js';

const _baseUrl = (input) => `https://github.com/${input}`;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'githubcode',
	minifiedDescription: 'Search Github Code',
	description: 'Search code from Github.',
	usage: '!githubcode `<query>`',
	category: 'Search',
	aliases: ['ghcode'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type }, client) {
		if (!query) {
			return await client.instance.reply(from, 'You must provide a query.', message);
		}

		if ((args[1] === 'next' || args[1] === 'prev') && type === 'templateButtonReplyMessage') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.source === args[2]);

			return await client.instance.send(
				from,
				{
					text: `${'Github Code'.formatHeaders()}
Username : ${data[index].owner.ownerUsername}
Repository : ${data[index].repository.name}
Filename : ${data[index].fileName}
Filepath : ${data[index].filePath}
Code Matches : 
${data[index].textMatches.map((v) => `_${v.texts}_\n\`\`\`${v.fragment}\`\`\``).join('\n')}`,
					templateButtons: [
						{
							urlButton: {
								displayText: 'User Avatar Source',
								url: args[1] === 'next' ? data[index].owner.ownerPicture : data[index].owner.ownerPicture
							}
						},
						{
							urlButton: {
								displayText: 'Repository Source',
								url: args[1] === 'next' ? data[index].repository.url : data[index].repository.url
							}
						},
						{ urlButton: { displayText: 'Code Source', url: args[1] === 'next' ? data[index].source : data[index].source } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: 'Next Code',
										id: cmdId('githubcode', `next ${data[index + 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: 'Previous Code',
										id: cmdId('githubcode', `prev ${data[index - 1].source} ${JSON.stringify(data)}`)
									}
								}
							: {}
					],
					footer: `${index + 1}/${data.length}\nPowered by Hidden Finder`
				},
				{ quoted: message }
			);
		}

		const git = new Github();
		let result = await git.searchCode(query.trim());

		if (result.total_count === 0) {
			return await client.instance.reply(from, 'Code not found.', message);
		}

		result = result.items.map((v) => ({
			source: v.html_url,
			repository: { name: v.repository.name, url: _baseUrl(v.repository.full_name) },
			owner: { ownerUsername: v.repository.owner.login, ownerPicture: v.repository.owner.avatar_url },
			fileName: v.name,
			filePath: v.path,
			textMatches: v.text_matches.map((w) => ({ fragment: w.fragment, texts: w.matches.map((x) => x.text).join(', ') }))
		}));

		await client.instance.send(
			from,
			{
				text: `${'Github Code'.formatHeaders()}
Username : ${result[0].owner.ownerUsername}
Repository : ${result[0].repository.name}
Filename : ${result[0].fileName}
Filepath : ${result[0].filePath}
Code Matches : 
${result[0].textMatches.map((v) => `_${v.texts}_\n\`\`\`${v.fragment}\`\`\``).join('\n')}`,
				templateButtons: [
					{ urlButton: { displayText: 'User Avatar Source', url: result[0].owner.ownerPicture } },
					{ urlButton: { displayText: 'Repository Source', url: result[0].repository.url } },
					{ urlButton: { displayText: 'Code Source', url: result[0].source } },
					result.length !== 1
						? {
								quickReplyButton: {
									displayText: 'Next Code',
									id: cmdId('githubcode', `next ${result[1].source} ${JSON.stringify(result).replace(/\|/g, '')}`)
								}
							}
						: {}
				],
				footer: `1/${result.length}\nPowered by Hidden Finder`
			},
			{ quoted: message }
		);
	}
};
