import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { pStoreProduct } from '../../utils/p-store/index.js';
import { defineCommand } from '../_define.js';

const regex = (str1, str2) => new RegExp(`\\b${str1}\\b`).test(str2.toLowerCase());

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ls = useLocale(locale, 'search');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		let queries = query.split(',');

		queries = removeDuplicatesArray(queries);

		for (const querie of queries) {
			let product = await pStoreProduct(querie.trim());

			if (product?.error) {
				await client.reply(from, product.error, message);
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
				await client.send(
					from,
					{
						image: { url: thumbnail },
					caption:
						Ls.titles.pStore.formatHeaders() +
						`\n\n${Ls.labels.name} : ${name}
${Ls.labels.sellerName} : ${sellerUsername}
${Ls.labels.idProduct} : ${idProduct}
${Ls.labels.estimations} : ${estimations}
${Ls.labels.stock} : ${numberWithCommas(stock || 0)}
${Ls.labels.maxOrder} : ${numberWithCommas(maxOrder)}
${Ls.labels.price} : ${priceFormatted}
${Ls.labels.ratings} : ${ratings.toFixed(2)}
${Ls.labels.url} : ${source}`.formatForm()
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
});
