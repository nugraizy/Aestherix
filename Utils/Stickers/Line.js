const LINE_URL_BASE = (input) => `https://store.line.me/api/search/sticker?query=${input}&offset=0&limit=36&type=ALL&includeFacets=true`;

export const line = (query) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchJSON(LINE_URL_BASE(query));
			resolve(data.items.map((v) => ({ title: v.title, author: v.authorName, idAuthor: v.authorId, productURL: v.productUrl, id: v.id, desc: v.description, stickers: { static: v.payloadForProduct.staticUrl, animated: v.payloadForProduct.animationUrl, withSound: v.payloadForProduct.soundUrl } })));
		} catch (e) {
			resolve({ error: e.message });
		}
	});
