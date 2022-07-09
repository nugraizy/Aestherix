import fetch from "node-fetch";

export const pinterest = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const RAW_DATA = await (
				await fetch(
					`https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${query}&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22${query}%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559`,
				)
			).json();
			let RAW_RESULTS = RAW_DATA.resource_response.data.results;
			RAW_RESULTS = RAW_RESULTS.filter((v) => v.images?.orig !== undefined)?.map((v) => v.images.orig.url);
			if (RAW_RESULTS.length == 0) resolve({ error: true, message: "Original Image Not Available." });
			resolve(RAW_RESULTS);
		} catch (err) {
			resolve({ error: err });
		}
	});
