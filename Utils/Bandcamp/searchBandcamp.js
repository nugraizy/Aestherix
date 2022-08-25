import Axios from "axios";

const URL_API = "https://bandcamp.com/api/bcsearch_public_api/1/autocomplete_elastic";

export const searchBandcamp = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			const { headers } = await Axios({ url: "https://bandcamp.com/", method: "GET" });
			const { data } = await Axios({
				url: URL_API,
				method: "POST",
				data: { search_text: keyword, search_filter: "", full_page: true, fan_id: null },
				headers: {
					Cookie: parseCookie(headers["set-cookie"]),
					"Content-Type": "application/json; charset=UTF-8",
					"X-Requested-With": "XMLHttpRequest",
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36",
					Host: "bandcamp.com",
					Origin: "https://bandcamp.com",
					Referer: "https://bandcamp.com/",
					"Content-Type": "application/json; charset=UTF-8",
				},
			});
			if (data?.auto?.results?.length == 0) {
				return resolve({ error: "Not Found" });
			}
			const { results } = data.auto;
			resolve(parse(results));
		} catch (err) {
			reject(err);
		}
	});

const parse = (arr) => {
	arr = arr.filter((v) => v.type == "t");
	return arr.map(({ art_id, name, band_id, band_name, album_id, item_url_path, stat_params, album_name }) => ({
		bandId: band_id,
		bandName: band_name,
		title: name,
		albumName: album_name || null,
		albumId: album_id || null,
		urlBase: `${item_url_path}?${stat_params}`,
		thumbnailUrl: `https://f4.bcbits.com/img/a${art_id}_5.jpg`,
	}));
};

const parseCookie = (arr) => arr.map((v) => v.split(";")[0]).join("; ");
