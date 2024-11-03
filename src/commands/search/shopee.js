import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { shopeeProduct } from '../../utils/misc/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'shopee',
	minifiedDescription: 'Search Shopee',
	description: 'Search products from Shopee.',
	usage: '!shopee <query>',
	category: 'Search',
	aliases: ['shop'],
	limit: 5,
	cooldown: 10,
	status: 'enable',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const product = await shopeeProduct(querie.trim());

			if ('error' in product) {
				await client.instance.reply(product.error, { from, quoted: message });
				continue;
			}

			let { items } = product;

			for (const {
				productName,
				stock,
				sold,
				brand,
				prices,
				pricesDiscount,
				discountPercent,
				likes,
				ratings,
				location,
				productURL, // eslint-disable-line
				imageURL
			} of items) {
				await client.instance.send(
					from,
					{
						image: { url: imageURL },
						caption:
							'Shopee'.formatHeaders() +
							`\n\nName : ${productName}
Stock : ${numberWithCommas(stock)}
Sold : ${numberWithCommas(sold)}
Brand : ${brand}
Price : ${
								prices === 0
									? numberWithCommas(pricesDiscount)
									: `${numberWithCommas(prices)}\nPrices After Discount : ${numberWithCommas(pricesDiscount)}`
							}
Percent Discount : ${discountPercent}
Likes : ${likes}
Ratings : ${ratings.toFixed(2)}
Location : ${location}`.formatForm()
						// templateButtons: [
						// 	{
						// 		urlButton: {
						// 			displayText: 'Product Source',
						// 			url: productURL
						// 		}
						// 	},
						// 	{
						// 		urlButton: {
						// 			displayText: 'Image Source',
						// 			url: imageURL
						// 		}
						// 	}
						// ],
						// footer:
					},
					{ quoted: message }
				);
			}
		}
	}
};
