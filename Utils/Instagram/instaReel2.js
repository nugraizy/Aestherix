import fetch from "node-fetch";
import cheerio from "cheerio";

export async function getReels2(url) {
	return new Promise(async (resolve, reject) => {
		try {
			const response = await fetch("https://instasave.website/", {
				method: "post",
				headers: {
					"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: `link=${encodeURIComponent(url)}&submit=`,
			}).then((res) => res.text());
			const $ = cheerio.load(response);
			const data = $("#downloadBox > a").attr("href");
			resolve(data);
		} catch (e) {
			reject({ error: e });
		}
	});
}
getReels2("https://www.instagram.com/reel/CZ6kTpeJljE/?utm_source=ig_web_copy_link").then(console.log);
