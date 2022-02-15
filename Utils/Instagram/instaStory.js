import Axios from "axios";
import cheerio from "cheerio";
import qs from "qs";

export function getStory(username) {
	return new Promise((resolve, reject) => {
		if (!username) return reject({ status: false, message: "Insert username!" });
		if (username.startsWith("@")) username.substr(1);
		Axios.get(URL_BASE(username), {
			headers: {
				"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
				Cookie: "PHPSESSID=4cnkqg281u4mf19m23htlrcm7g; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
			},
		})
			.then(({ data }) => {
				const $ = cheerio.load(data);
				const token = $("input#token").attr("value");
				Axios.post(
					URL_POST(),
					qs.stringify({
						url: URL_INSTA(username),
						action: "story",
						token,
					}),
					{
						headers: {
							"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
							origin: URL_ORIGIN(),
							referer: URL_BASE(username),
							"Content-Type": `application/x-www-form-urlencoded; charset=UTF-8`,
							Cookie: "PHPSESSID=4cnkqg281u4mf19m23htlrcm7g; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
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

const URL_ORIGIN = () => `https://www.instagramsave.com`;
const URL_BASE = (input) => `https://www.instagramsave.com/instagram-story-downloader.php?input=${input}`;
const URL_POST = () => `https://www.instagramsave.com/system/action.php`;
const URL_INSTA = (input) => `https://www.instagram.com/${input}`;
