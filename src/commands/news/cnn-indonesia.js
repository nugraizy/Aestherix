import { cmdId } from '../../helper/modules/prefix.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cnnindonesia } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'cnnindonesia',
	minifiedDescription: 'CNN-Indonesia News',
	description: 'Showing latest news in Indonesia from CNN.',
	category: 'News',
	usage: '!cnnindonesia `<keyword/blank(to fetch latest news)>`',
	aliases: ['cnnid', 'cnid'],
	cooldown: 2,
	limit: 1,
	status: 'enable',
	async run({ query, from, message, args, cmd, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ln = useLocale(locale, 'news');
		const cmdName = cmd.replace(/^[^a-zA-Z]+/, '');

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.image === args[2]);

			let caption = Ln.titles.cnnIndonesia.formatHeaders();

			caption += `\n\n${L.core.caption.title} : ${data[index].title}\n`;
			caption += `${Ln.labels.place} : ${data[index].places}\n`;
			caption += `${Ln.labels.published} : ${data[index].published}\n`;
			caption += `${Ln.labels.content} : ${data[index].body}\n`;

			return await client.send(
				from,
				{
					image: { url: data[index].image },
					caption,
					templateButtons: [
						{ urlButton: { displayText: Ln.labels.imageSource, url: args[1] === 'next' ? data[index].image : data[index].image } },
						{ urlButton: { displayText: Ln.labels.articleSource, url: args[1] === 'next' ? data[index].link : data[index].link } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ln.labels.nextArticle,
										id: cmdId(cmdName, `next ${data[index + 1].image} ${JSON.stringify(data)}`, { prefix })
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ln.labels.previousArticle,
										id: cmdId(cmdName, `prev ${data[index - 1].image} ${JSON.stringify(data)}`, { prefix })
									}
								}
							: {}
					],
					footer: t(locale, 'news.footer.pageCounter', [index + 1, data.length])
				},
				{ quoted: message }
			);
		}

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		const data = await cnnindonesia(query);

		if (data?.error) {
			return await client.reply(from, data.error, message);
		}

		let caption = Ln.titles.cnnIndonesia.formatHeaders();

		caption += `\n\n${L.core.caption.title} : ${data[0].title}\n`;
		caption += `${Ln.labels.place} : ${data[0].places}\n`;
		caption += `${Ln.labels.published} : ${data[0].published}\n`;
		caption += `${Ln.labels.content} : ${data[0].body}\n`;

		caption += `\n${data
			.map(
				({ title, places, body, published }) =>
					`${L.core.caption.title} : ${title}\n${Ln.labels.place} : ${places}\n${Ln.labels.published} : ${published}\n${Ln.labels.content} : ${body}`
			)
			.join('\n\n')}`.trimEnd();

		await client.send(
			from,
			{
				image: { url: data[0].image },
				caption: caption.formatForm(),
				templateButtons: [
					{ urlButton: { displayText: Ln.labels.imageSource, url: data[0].image } },
					{ urlButton: { displayText: Ln.labels.articleSource, url: data[0].link } },
					data.length !== 1
						? {
								quickReplyButton: {
									displayText: Ln.labels.nextArticle,
									id: cmdId(cmdName, `next ${data[1].image} ${JSON.stringify(data)}`, { prefix })
								}
							}
						: {}
				],
				footer: t(locale, 'news.footer.pageCounter', [1, data.length])
			},
			{ quoted: message }
		);
	}
});
