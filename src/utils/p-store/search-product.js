import { fetchJSON, numberWithCommas } from '../modules/index.js';

const _api = 'https://api.p-store.net/api/products';
const _apiBase = (input) => `https://p-store.net/${input}`;

const _parse = (arr) =>
	arr.map((v) => ({
		estimations: v.days,
		idProduct: v.id,
		name: v.name,
		priceRaw: v.price,
		priceFormatted: `Rp. ${numberWithCommas(v.price, 'id', 'dot')}`,
		stock: v.stock,
		maxOrder: v.max_order,
		ratings: v.rating,
		sellerUsername: v.merchant.name,
		source: _apiBase(`${v.merchant.slug}/${v.slug}`),
		thumbnail: v.image
	}));

export const pStoreProduct = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const url = new URL(_api);

			url.searchParams.set('search', keyword);
			const data = await fetchJSON(url.toString());

			resolve(_parse(data.items.data));
		} catch (err) {
			reject(err);
		}
	});
