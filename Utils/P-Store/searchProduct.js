import Axios from 'axios';

import { numberWithCommas } from '../../Helper/index.js';

const URL_API_BASE = 'https://api.p-store.net/api/products';
const URL_BASE = (input) => `https://p-store.net/${input}`;

const parse = (arr) => {
	return arr.map((v) => {
		return {
			estimations: v.days,
			idProduct: v.id,
			name: v.name,
			priceRaw: v.price,
			priceFormatted: `Rp. ${numberWithCommas(v.price, 'id', 'dot')}`,
			stock: v.stock,
			maxOrder: v.max_order,
			ratings: v.rating,
			sellerUsername: v.merchant.name,
			source: URL_BASE(`${v.merchant.slug}/${v.slug}`),
			thumbnail: v.image,
		};
	});
};

export const PStoreProduct = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { data } = await Axios({
				url: URL_API_BASE,
				method: 'GET',
				params: {
					search: keyword,
				},
			});

			resolve(parse(data.items.data));
		} catch (err) {
			reject(err);
		}
	});
