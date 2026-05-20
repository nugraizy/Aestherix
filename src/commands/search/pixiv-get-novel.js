import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { getNovelContent } from '../../utils/pixiv/index.js';
import { defineCommand } from '../_define.js';

const regex = (input) => {
	const reg = /^https?:\/\/(www\.|i\.)?(pximg\.net)|(pixiv\.net)/i;
	const isPixiv = reg.test(input);

	if (isPixiv) {
		const match = input.match(/\d{8,10}/g);

		if (!match) {
			return { status: false, message: 'Novel code not found on your URL. Try another URL.' };
		}

		return { status: true, message: match[0] };
	}

	return { status: false, message: 'This URL is not a valid Pixiv URL. Try another URL.' };
};

export default defineCommand({
	name: 'pixivnovelget',
	minifiedDescription: 'Get Novel',
	description: 'Get novel content from Pixiv.',
	usage: '!pixivnovelget `<url>`',
	aliases: ['pixnovelget'],
	category: 'Search',
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a query.', message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const regexs = regex(querie.trim());

			if (!regexs.status) {
				return await client.reply(from, regexs.message, message);
			}

			const data = await getNovelContent(regexs.message);

			if (data?.errors) {
				await client.reply(from, `Failed while looking for Pixiv novel content\n\n${data.error}\n${querie}`, message);
				continue;
			}

			const { title, likeCount, userName, viewCount, userId, content } = data;
			const caption = `Title : ${title.capitalize()}
Author : ${userName}
ID Artwork : ${regexs.message}
ID Author : ${userId}
Tot. Like : ${numberWithCommas(likeCount)}
Tot. View : ${numberWithCommas(viewCount)}

${content}`;

			await client.send(
				from,
				{
					text: caption.formatForm(),
					templateButtons: [
						{ urlButton: { displayText: 'Novel Source', url: `https://www.pixiv.net/novel/show.php?id=${regexs.message}` } }
					],
					footer: ' • Pixiv Novel Content'
				},
				{ quoted: message }
			);
		}
	}
});
