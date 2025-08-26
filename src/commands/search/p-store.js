import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { pStoreProduct } from '../../utils/p_store/index.js';

const regex = (str1, str2) => new RegExp(`\\b${str1}\\b`).test(str2.toLowerCase());

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pstore',
	description: 'Search products from p-store',
	usage: '!pstore `<query>`',
	category: 'Search',
	aliases: ['pstor'],
	limit: 4,
	cooldown: 8,
	status: 'disable',
	premium: false,
	minifiedDescription: 'Search P-Store Products',
	async run({ query, from, message }, client) {
		if (!query) {
			return await client.instance.reply('You must provide a query.', { from, quoted: message });
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let product = await pStoreProduct(querie.trim());

			if (product?.error) {
				await client.instance.reply(product.error, { from, quoted: message });
				continue;
			}

			const filterProduct = product.filter((v) => regex(querie.trim(), v.name));

			product = !filterProduct.length ? product.slice(0, 5) : filterProduct.slice(0, 5);

			for (const {
				estimations,
				idProduct,
				name,
				priceFormatted,
				stock,
				maxOrder,
				ratings,
				sellerUsername,
				source,
				thumbnail
			} of product) {
				await client.instance.send(
					from,
					{
						image: { url: thumbnail },
						caption:
							'P-Store'.formatHeaders() +
							`\n\nName : ${name}
Seller Name : ${sellerUsername}
ID Product : ${idProduct}
Estimations : ${estimations}
Stock : ${numberWithCommas(stock || 0)}
Max Order : ${numberWithCommas(maxOrder)}
Price : ${priceFormatted}
Ratings : ${ratings.toFixed(2)}
Source : ${source}`.formatForm()
						// templateButtons: [
						// 	{
						// 		urlButton: {
						// 			displayText: 'Product Source',
						// 			url: source
						// 		}
						// 	},
						// 	{
						// 		urlButton: {
						// 			displayText: 'Image Source',
						// 			url: thumbnail
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
