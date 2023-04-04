import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { pStoreProduct } from '../../utils/p_store/index.js';

const regex = (str1, str2) => new RegExp(`\\b${str1}\\b`).test(str2.toLowerCase());

export default {
	name: 'pstore',
	description: 'Search products from p-store',
	usage: '!pstore <query>',
	category: 'Search',
	aliases: ['pstor'],
	limit: 4,
	cooldown: 8,
	status: 'enable',
	async run({ query, from, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You must provide a query.');
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let product = await pStoreProduct(querie.trim());

			if ('error' in product) {
				await client[botNum].reply({ groupMetadata, from, quoted: message }, product.error);
				continue;
			}

			const filterProduct = product.filter((v) => regex(querie.trim(), v.name));

			product = filterProduct.length === 0 ? product.slice(0, 5) : filterProduct.slice(0, 5);

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
				await client[botNum].send(
					from,
					{
						image: { url: thumbnail },
						caption: 'P-Store'.formatHeaders(),
						templateButtons: [
							{
								urlButton: {
									displayText: 'Product Source',
									url: source
								}
							},
							{
								urlButton: {
									displayText: 'Image Source',
									url: thumbnail
								}
							}
						],
						footer: `Name : ${name}
Seller Name : ${sellerUsername}
ID Product : ${idProduct}
Estimations : ${estimations}
Stock : ${numberWithCommas(stock || 0)}
Max Order : ${numberWithCommas(maxOrder)}
Price : ${priceFormatted}
Ratings : ${ratings.toFixed(2)}`
					},
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
