import axios from 'axios';

const COOKIE = '__LOCALE__null=ID; csrftoken=VLT3in1vbv6tm8MLZGg37FG2hLk5hCrE; ';
const COOKIE_URL = 'https://shopee.co.id/api/v4/pages/is_short_url/?path=search';

const API_URL = (product, total) =>
	`https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${product}&limit=${total}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
const URL_PRODUCT = (productName, productId, shopeeId) => `https://shopee.co.id/${productName}-i.${shopeeId}.${productId}`;
const URL_IMAGE = (id) => `https://cf.shopee.co.id/file/${id}`;

export const shopeeProduct = (key, total = 5) =>
	new Promise(async (resolve) => {
		try {
			const CONTAINER = {
				items: []
			};
			const DATA_RAW = await axios.get(COOKIE_URL);
			const DATA = await axios.get(API_URL(key, total), {
				headers: {
					cookie: COOKIE + DATA_RAW.headers['set-cookie'].map((v) => v.split(';')[0]).join('; '),
					'user-agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36'
				}
			});

			if (DATA.data.items.length === 0) {
				return resolve({ error: 'No product found' });
			}

			DATA.data.items.forEach((element) => {
				CONTAINER.items.push({
					productName: element.item_basic.name,
					stock: element.item_basic.stock,
					sold: element.item_basic.sold,
					brand: element.item_basic.brand === '' ? 'No Brand' : element.item_basic.brand,
					prices: Number(String(element.item_basic.price_min_before_discount).slice(0, -5)),
					pricesDiscount: Number(String(element.item_basic.price_min).slice(0, -5)),
					discountPercent: element.item_basic.discount ?? 'No Discount',
					likes: element.item_basic.liked_count,
					ratings: element.item_basic.item_rating.rating_star,
					location: element.item_basic.shop_location,
					productURL: URL_PRODUCT(
						element.item_basic.name.replace(/[/[\] ]/g, '-'),
						element.item_basic.itemid,
						element.item_basic.shopid
					),
					imageURL: URL_IMAGE(element.item_basic.image)
				});
			});
			resolve(CONTAINER);
		} catch (err) {
			log(err);
			resolve({ error: err });
		}
	});
