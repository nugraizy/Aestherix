import yn from 'yn';

import { isURL, removeDuplicatesArray, increment } from '../../utils/modules/index.js';
import { pinterest } from '../../utils/pinterest/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pinterest',
	minifiedDescription: 'Search Pinterest',
	description: 'Search images from Pinterest.',
	usage: '!pinterest <query>',
	category: 'Search',
	aliases: ['pin'],
	limit: 4,
	cooldown: 5,
	status: 'enable',
	async run({ query, from, message, args, type, groupMetadata, sender, waitForInput }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		if (isURL(query)) {
			const image = await pinterest.download(query);

			return await client.instance.send(
				from,
				{
					image: {
						url: image.image
					},
					caption:
						'Pinterest'.formatHeaders() +
						`\n\nAuthor : ${image.authorUsername}
Author Fullname : ${image.authorFullname}
Follower : ${image.follower}
Caption : ${image.caption}`.formatForm()
				},
				{ quoted: message, groupMetadata }
			);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let result = await pinterest.search(querie.trim());

			if ('error' in result) {
				await client.instance.reply(result.message, { from, quoted: message, groupMetadata });
				continue;
			}

			const incrementedIndex = increment(0, result.length - 1);

			const send = async () => {
				const index = incrementedIndex();

				if (index === null) {
					return;
				}

				await client.instance.send(
					from,
					{
						image: { url: result[index].image },
						caption:
							'Pinterest'.formatHeaders() +
							`\n\nAuthor : ${result[index].authorUsername}
Author Fullname : ${result[index].authorFullname}
Follower : ${result[index].follower}
Caption : ${result[index].caption}
\nImage ${index + 1} of ${result.length}`.formatForm()
					},
					{ groupMetadata, quoted: message }
				);

				if (index + 1 >= result.length) {
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
		}
	}
};
