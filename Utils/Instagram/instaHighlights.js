import Axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

export function getHighlights(username) {
	return new Promise((resolve, reject) => {
		if (!username) return reject({ status: false, message: "Insert username!" });
		if (username.startsWith("@")) {
			username.replace("@", "");
		}
		Axios.get(`https://www.instagramsave.com/instagram-story-downloader.php?input=${username}`, {
			headers: {
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
				Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
			},
		})
			.then(({ data }) => {
				const $ = cheerio.load(data);
				const token = $("input#token").attr("value");
				Axios.post(
					"https://www.instagramsave.com/system/action.php",
					qs.stringify({
						url: `https://www.instagram.com/${username}`,
						action: "highlights",
						token,
					}),
					{
						headers: {
							"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
							origin: "https://www.instagramsave.com",
							referer: `https://www.instagramsave.com/instagram-story-downloader.php?input=${username}`,
							"Content-Type": `application/x-www-form-urlencoded; charset=UTF-8`,
							Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
						},
					},
				)
					.then(({ data }) => {
						resolve(data);
					})
					.catch((_) => reject({ error: _ }));
			})
			.catch((_) => reject({ error: _ }));
	});
}
