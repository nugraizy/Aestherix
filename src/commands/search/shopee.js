import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { numberWithCommas, removeDuplicatesArray } from '../../utils/modules/index.js';
import { shopeeProduct } from '../../utils/misc/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'shopee',
	minifiedDescription: 'Search Shopee',
	description: 'Search products from Shopee.',
	usage: '!shopee `<query>`',
	category: 'Search',
	aliases: ['shop'],
	limit: 5,
	cooldown: 10,
	status: 'enable',
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
			const product = await shopeeProduct(querie.trim());

			if (product?.error) {
				await client.reply(from, product.error, message);
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
				await client.send(
					from,
					{
						image: { url: imageURL },
					caption:
						Ls.titles.shopee.formatHeaders() +
						`\n\n${Ls.labels.name} : ${productName}
${Ls.labels.stock} : ${numberWithCommas(stock)}
${Ls.labels.sold} : ${numberWithCommas(sold)}
${Ls.labels.brand} : ${brand}
${Ls.labels.price} : ${
							prices === 0
								? numberWithCommas(pricesDiscount)
								: `${numberWithCommas(prices)}\n${Ls.labels.pricesAfterDiscount} : ${numberWithCommas(pricesDiscount)}`
						}
${Ls.labels.percentDiscount} : ${discountPercent}
${Ls.labels.likes} : ${likes}
${Ls.labels.ratings} : ${ratings.toFixed(2)}
${Ls.labels.location} : ${location}`.formatForm()
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
});
