import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { shopeeProduct } from '../../utils/misc/index.js';

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'shopee',
	description: 'Search products from shopee',
	usage: '!shopee <query>',
	category: 'Search',
	aliases: ['shop'],
	limit: 5,
	cooldown: 10,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			const product = await shopeeProduct(querie.trim());

			if ('error' in product) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, product.error);
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
				productURL,
				imageURL
			} of items) {
				await client[botNum].send(
					from,
					{
						image: { url: imageURL },
						caption: 'Shopee'.formatHeaders(),
						templateButtons: [
							{
								urlButton: {
									displayText: 'Product Source',
									url: productURL
								}
							},
							{
								urlButton: {
									displayText: 'Image Source',
									url: imageURL
								}
							}
						],
						footer: `Name : ${productName}
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
Location : ${location}`
					},
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
