import fetch from "node-fetch";
import cheerio from "cheerio";
import qs from "qs";

export const getHighlights = (username) =>
	new Promise(async (resolve) => {
		try {
			if (!username) return resolve({ status: false, error: "Insert username!" });
			if (username.startsWith("@")) username = username.replace("@", "");
			const data = await (
				await fetch(URL_BASE(username), {
					headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36", Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1" },
				})
			).text();
			const $ = cheerio.load(data);
			const token = $("input#token").attr("value");
			const dataResult = await (
				await fetch(URL_POST(), {
					method: "POST",
					headers: {
						"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
						origin: URL_ORIGIN(),
						referer: URL_BASE(username),
						"Content-Type": `application/x-www-form-urlencoded; charset=UTF-8`,
						Cookie: "PHPSESSID=hj2p3i96va7kqs7csbq16a5tip; _ga=GA1.2.1623964880.1642090612; _gid=GA1.2.553723423.1642090612; _gat=1",
					},
					body: qs.stringify({ url: URL_INSTA(username), action: "highlights", token }),
				})
			).json();
			resolve(dataResult);
		} catch (err) {
			resolve({ status: false, error: err.message });
		}
	});

const URL_BASE = (input) => `https://www.instagramsave.com/instagram-story-downloader.php?input=${input}`;
const URL_ORIGIN = () => "https://www.instagramsave.com";
const URL_POST = () => "https://www.instagramsave.com/system/action.php";
const URL_INSTA = (input) => `https://www.instagram.com/${input}`;
