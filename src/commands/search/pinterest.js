import yn from 'yn';

import { isURL, removeDuplicatesArray, increment } from '../../utils/modules/index.js';
import { pinterest } from '../../utils/pinterest/index.js';

const _regex = new RegExp(
	'https?://(?:[^/]+.)?(pinterest|pin).(?:com|fr|de|ch|jp|cl|ca|it|co.uk|nz|ru|com.au|at|pt|co.kr|es|com.mx|dk|ph|th|com.uy|co|nl|info|kr|ie|vn|com.vn|ec|mx|in|pe|co.at|hu|co.in|co.nz|id|com.ec|com.py|tw|be|uk|com.bo|com.pe)'
);

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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
		if (!query) {
			return await client.instance.reply(
				'You must provide a `quer(y/ies)` or `url(s)`.\nYou can use `commas` as a separator.',
				{
					from,
					quoted: message
				}
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		if (queries.length === 1) {
			if (isURL(query.trim())) {
				const result = await pinterest.download(query);

				const builder = new client.instance.TemplateBuilder.Native(client);

				builder
					.mainBody('Pinterest Downloader')
					.mainFooter(
						`Username : ${result.authorUsername}\nFullname : ${result.authorFullname}\nFollowers : ${result.follower}\n\nPowered by Aestherix`
					)
					.mainHeader('Header', result.url)
					.buttons(
						builder.button.url({
							display: 'Original Source',
							url: result.pinSource
						}),
						builder.button.url({
							display: 'Original Media',
							url: result.url
						})
					);

				const messageBuilt = await builder.render();

				return await client.instance.relayMessage(from, messageBuilt.message, { messageId: messageBuilt.key.id });
			}

			let result = await pinterest.search(query.trim());

			if (result?.error) {
				await client.instance.reply(result.message, { from, quoted: message });
			}

			const { results } = result;

			const incrementedIndex = increment(0, results.length - 1);

			const send = async () => {
				const index = incrementedIndex();

				if (index === null) {
					return;
				}

				await client.instance.send(
					from,
					{
						...(results[index].type === 'image'
							? { image: { url: results[index].url } }
							: { video: { url: results[index].url }, gifPlayback: results[index].type === 'gif' }),
						caption:
							'Pinterest'.formatHeaders() +
							`\n\nAuthor : ${results[index].authorUsername}
Author Fullname : ${results[index].authorFullname}
Followers : ${results[index].follower}
Caption : ${results[index].caption}
\nMedia ${index + 1} of ${results.length}`.formatForm()
					},
					{ quoted: message }
				);

				if (index + 1 >= results.length) {
					return;
				}

				const wait = await waitForInput(client, {
					message: 'Do you want to get more image? [y/n]',
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
				const builder = new client.instance.TemplateBuilder.Carousel(client);

				builder
					.mainBody('Pinterest Downloader')
					.mainFooter(`Total Media : ${results.length}`)
					.cards(
						results.map(({ authorUsername, authorFullname, follower, caption, url, pinSource }) => ({
							body: `Username : ${authorUsername}\nFullname : ${authorFullname}\nFollowers : ${follower}`,
							footer: 'Powered by Aestherix',
							title: caption === 'No caption' ? 'Title is n/a' : caption,
							header: url,
							buttons: [
								builder.button.url({
									display: 'Original Source',
									url: pinSource
								}),
								builder.button.url({
									display: 'Original Media',
									url
								})
							]
						}))
					);

				const messageBuilt = await builder.render();

				await client.instance.relayMessage(from, messageBuilt.message, { messageId: messageBuilt.key.id });
			}

			if (nonUrl.length) {
				const promises = nonUrl.map((v) => pinterest.search(v.trim()));
				const results = await Promise.all(promises);

				const notErrors = results.filter((v) => !v.error);
				const errors = results.filter((v) => v.error);

				for (const result of notErrors) {
					const builder = new client.instance.TemplateBuilder.Carousel(client);

					builder
						.mainBody('Pinterest Downloader')
						.mainFooter(`Keyword : ${result.keyword}\nTotal Media : ${result.results.length}`)
						.cards(
							result.results.map(({ authorUsername, authorFullname, follower, caption, url, pinSource }) => ({
								body: `Username : ${authorUsername}\nFullname : ${authorFullname}\nFollowers : ${follower}`,
								footer: 'Powered by Aestherix',
								title: caption === 'No caption' ? 'Title is n/a' : caption,
								header: url,
								buttons: [
									builder.button.url({
										display: 'Original Source',
										url: pinSource
									}),
									builder.button.url({
										display: 'Original Media',
										url
									})
								]
							}))
						);

					const messageBuilt = await builder.render();

					await client.instance.relayMessage(from, messageBuilt.message, { messageId: messageBuilt.key.id });
				}

				if (errors.length) {
					await client.instance.reply(
						`Could not retrieve these queries :\n\n${errors.map((v, i) => `${i + 1}. ${v.keyword}`).join('\n')}`,
						{
							from,
							quoted: message
						}
					);
				}
			}
		}
	}
};
