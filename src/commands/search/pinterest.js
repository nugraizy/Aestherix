import yn from 'yn';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { increment, isURL, removeDuplicatesArray } from '../../utils/modules/index.js';
import { pinterest } from '../../utils/pinterest/index.js';
import { defineCommand } from '../_define.js';

const _regex = new RegExp(
	'https?://(?:[^/]+.)?(pinterest|pin).(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)'
);

export default defineCommand({
	name: 'pinterest',
	minifiedDescription: 'Search Pinterest',
	description: 'Search images from Pinterest.',
	usage: '!pinterest `<quer(y/ies)/url(s)>`',
	category: 'Search',
	aliases: ['pin'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, sender, waitForInput }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(
				from,
				'You must provide a `quer(y/ies)` or `url(s)`.\nYou can use `commas` as a separator.',
				message
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1) {
			if (isURL(query.trim())) {
				const result = await pinterest.download(query);

				const builder = new client.TemplateBuilder.Native();

				await builder
					.destination(from)
					.body(Ls.titles.pinterest)
					.footer(
						`${Ls.labels.username}${result.authorUsername}\n${Ls.labels.authorFullname}${result.authorFullname}\n${Ls.labels.followers}${result.follower}\n\nPowered by Hidden Finder`
					)
					.header('Header', result.url)
					.buttons(
						builder.button.url({
							display: Ls.buttons.originalSource,
							url: result.pinSource
						}),
						builder.button.url({
							display: Ls.buttons.originalMedia,
							url: result.url
						})
					)
					.send();

				return;
			}

			let result = await pinterest.search(query.trim());

			if (result?.error) {
				await client.reply(from, result.message, message);
			}

			const { results } = result;

			const incrementedIndex = increment(0, results.length - 1);

			const send = async () => {
				const index = incrementedIndex();

				if (index === null) {
					return;
				}

				await client.send(
					from,
					{
						...(results[index].type === 'image'
							? { image: { url: results[index].url } }
							: { video: { url: results[index].url }, gifPlayback: results[index].type === 'gif' }),
					caption:
						Ls.titles.pinterest.formatHeaders() +
						`\n\n${Ls.labels.username}${results[index].authorUsername}
${Ls.labels.authorFullname}${results[index].authorFullname}
${Ls.labels.followers}${results[index].follower}
${Ls.labels.caption}${results[index].caption}
\n${t(locale, 'search.labels.media', [index + 1, results.length])}`.formatForm()
					},
					{ quoted: message }
				);

				if (index + 1 >= results.length) {
					return;
				}

				const wait = await waitForInput(client, {
					message: Ls.labels.yourQuery,
					expectedType: ['conversation', 'extendedTextMessage'],
					from,
					sender,
					timeInSecond: 10
				});

				if (wait.timeout) {
					return;
				}

				const isYes = yn(wait.message);

				if (isYes === undefined) {
					return;
				}

				if (isYes) {
					await send();
				}
			};

			await send();
		} else {
			const url = [];
			const nonUrl = [];

			queries.forEach((v) => (isURL(v) && _regex.test(v) ? url.push(v) : nonUrl.push(v)));

			if (url.length) {
				const promises = url.map(pinterest.download);
				const results = await Promise.all(promises);
				const builder = new client.TemplateBuilder.Carousel();

				await builder
					.destination(from)
					.body(Ls.titles.pinterest)
					.footer(`Total Media : ${results.length}`)
					.cards(
						results.map(({ authorUsername, authorFullname, follower, caption, url, pinSource }) => ({
							body: `${Ls.labels.username}${authorUsername}\n${Ls.labels.authorFullname}${authorFullname}\n${Ls.labels.followers}${follower}`,
							footer: 'Powered by Hidden Finder',
							title: caption === 'No caption' ? Ls.labels.titleIsNA : caption,
							header: url,
							buttons: [
								builder.button.url({
									display: Ls.buttons.originalSource,
									url: pinSource
								}),
								builder.button.url({
									display: Ls.buttons.originalMedia,
									url
								})
							]
						}))
					)
					.send();
			}

			if (nonUrl.length) {
				const promises = nonUrl.map((v) => pinterest.search(v.trim()));
				const results = await Promise.all(promises);

				const notErrors = results.filter((v) => !v.error);
				const errors = results.filter((v) => v.error);

				for (const result of notErrors) {
					const builder = new client.TemplateBuilder.Carousel();

					await builder
						.destination(from)
						.body(Ls.titles.pinterest)
						.footer(`${Ls.labels.keyword}${result.keyword}\nTotal Media : ${result.results.length}`)
						.cards(
							result.results.map(({ authorUsername, authorFullname, follower, caption, url, pinSource }) => ({
								body: `${Ls.labels.username}${authorUsername}\n${Ls.labels.authorFullname}${authorFullname}\n${Ls.labels.followers}${follower}`,
								footer: 'Powered by Hidden Finder',
								title: caption === 'No caption' ? Ls.labels.titleIsNA : caption,
								header: url,
								buttons: [
									builder.button.url({
										display: Ls.buttons.originalSource,
										url: pinSource
									}),
									builder.button.url({
										display: Ls.buttons.originalMedia,
										url
									})
								]
							}))
						)
						.send();
				}

				if (errors.length) {
					await client.reply(
						from,
						`Could not retrieve these queries :\n\n${errors.map((v, i) => `${i + 1}. ${v.keyword}`).join('\n')}`,
						message
					);
				}
			}
		}
	}
});
