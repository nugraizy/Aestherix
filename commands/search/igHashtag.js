/* global botNum */
import { searchHashtag } from '../../utils/instagram/instaHashtag.js';

export default {
	name: 'ighashtag',
	description: 'Search for hashtag on Instagram',
	usage: '!ighashtag <keyword>',
	aliases: ['ighash'],
	category: 'Search',
	cooldown: 8,
	limit: 4,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return client[botNum].reply({ from, quoted: message }, 'You must provide a query.');
		}

		const result = await searchHashtag(query);

		if (result.error) {
			return await client[botNum].reply({ from, quoted: message }, result.error);
		}

		let caption = '';

		caption += `Tot. Post : ${result.totalPostFormatted}\n`;
		await client[botNum].sendMessage(
			from,
			{
				caption: 'Instagram Hashtag Search'.formatHeaders(),
				image: { url: result.thumbnail },
				templateButtons: [{ urlButton: { displayText: 'Image Source', url: result.thumbnail } }],
				footer: caption,
			},
			{ quoted: message },
		);

		await client[botNum].sendMessage(from, {
			title: 'Instagram Hashtag',
			footer: 'Made by Void Bot. Powered by Hidden Finder',
			text: '\t',
			buttonText: 'Open List',
			sections: result.posts.map((v, i) => ({
				rows: [{ title: `${i + 1}. ${v.caption.substring(0, 20)}`, rowId: `.igpost https://instagram.com/p/${v.code}` }],
				title: `@${v.username} | ${v.fullName}`,
			})),
		});
	},
};
