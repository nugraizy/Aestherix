import { fetchTEXT, cheerioLOAD } from "../../Helper/index.js";

export const getIgtv2 = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const response = await fetchTEXT("https://downloadgram.org/", {
				method: "post",
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: `url=${encodeURIComponent(url)}&submit=`,
			});
			const $ = cheerioLOAD(response);
			const data = $("#downloadBox > a").attr("href");
			resolve(data);
		} catch (e) {
			reject({ error: e });
		}
	});
