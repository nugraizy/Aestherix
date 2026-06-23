import { cmdId } from '../../helper/modules/prefix.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cnninternational, fetchBUFFER } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'cnninternational',
	minifiedDescription: 'CNN-International News',
	description: 'Showing latest news in International from CNN.',
	category: 'News',
	usage: '!cnninternational `<keywords/blank(to fetch latest news)>`',
	aliases: ['cnnint'],
	cooldown: 2,
	limit: 3,
	status: 'enable',
	async run({ query, from, message, args, cmd }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ln = useLocale(locale, 'news');

		if (args[1] === 'next' || args[1] === 'prev') {
			const data = JSON.parse(JSON.parse(JSON.stringify(args.slice(3).join(' '))));
			const index = data.findIndex((v) => v.image === args[2] || v.link === args[2]);

			let caption = Ln.titles.cnnInternational.formatHeaders();

			caption += `\n\n${L.core.caption.title} : ${data[index].title}\n`;
			caption += `${Ln.labels.published} : ${data[index].published}\n`;
			caption += `${Ln.labels.content} : ${data[index].body}\n`;

			return await client.send(
				from,
				{
					...(data[index].image !== undefined ? { image: await fetchBUFFER(data[index].image), caption } : { text: caption }),
					templateButtons: [
						data[index].image !== undefined
							? { urlButton: { displayText: Ln.labels.imageSource, url: args[1] === 'next' ? data[index].image : data[index].image } }
							: {},
						{ urlButton: { displayText: Ln.labels.articleSource, url: args[1] === 'next' ? data[index].link : data[index].link } },
						index + 1 !== data.length
							? {
									quickReplyButton: {
										displayText: Ln.labels.nextArticle,
										id: cmdId(cmd, `next ${data[index + 1].image ?? data[index + 1].link} ${JSON.stringify(data)}`)
									}
								}
							: {},
						index !== 0
							? {
									quickReplyButton: {
										displayText: Ln.labels.previousArticle,
										id: cmdId(cmd, `prev ${data[index - 1].image ?? data[index + 1].link} ${JSON.stringify(data)}`)
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

		const data = await cnninternational(query);

		if (data?.error) {
			return await client.reply(from, data.error, message);
		}

		let caption = Ln.titles.cnnInternational.formatHeaders();

		caption += `\n\n${L.core.caption.title} : ${data[0].title}\n`;
		caption += `${Ln.labels.published} : ${data[0].published}\n`;
		caption += `${Ln.labels.content} : ${data[0].body}\n`;

		caption += `\n${data
			.map(({ title, body, published }) => `${L.core.caption.title} : ${title}\n${Ln.labels.published} : ${published}\n${Ln.labels.content} : ${body}`)
			.join('\n\n')}`.trimEnd();

		await client.send(
			from,
			{
				...(data[0].image !== undefined
					? { image: await fetchBUFFER(data[0].image), caption: caption.formatForm() }
					: { text: caption.formatForm() }),
				templateButtons: [
					data[0].image !== undefined ? { urlButton: { displayText: Ln.labels.imageSource, url: data[0].image } } : {},
					{ urlButton: { displayText: Ln.labels.articleSource, url: data[0].link } },
					data.length !== 1
						? {
								quickReplyButton: {
									displayText: Ln.labels.nextArticle,
									id: cmdId(cmd, `next ${data[1].image ?? data[1].link} ${JSON.stringify(data)}`)
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
