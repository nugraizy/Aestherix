import fetch from "node-fetch";
import moment from "moment-timezone";

const URL_BASE = "https://api.onlinevideoconverter.pro/api/convert";

export function fbDl(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await fetch(URL_BASE, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url,
				}),
			}).then((res) => res.json());
			if (data.code == 102) reject({ error: data.message });
			else {
				let { url } = data.url[0];
				let { duration } = data.meta;
				let { thumb: thumbnail, timestamp: datePosted } = data;
				resolve({
					url,
					duration,
					thumbnail,
					datePosted: moment(datePosted * 1000).format("DD/MM/YYYY HH:mm:ss"),
					rawDatePosted: datePosted * 1000,
				});
			}
		} catch (err) {
			reject({ error: err });
		}
	});
}
