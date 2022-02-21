import Axios from "axios";
import cheerio from "cheerio";
import { COOKIE } from "../../Utils/TikTok/cookie.js";

export const tiktokProfileTIKTOK = (username) =>
	new Promise((resolve, reject) => {
		if (username.startsWith("@")) username = username.substr(1);
		Axios.get(URL_BASE(username), {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
				// Cookie: COOKIE.TIKTOK_COOKIE, optional.
			},
		}).then(({ data }) => {
			const $ = cheerio.load(data);
			const userName = $("[data-e2e='user-title']").text().trim();
			const fullName = $("[data-e2e='user-subtitle']").text().trim();
			const bio = $("[data-e2e='user-bio']").text().trim();
			const following = $("[data-e2e='following-count']").text().trim();
			const followers = $("[data-e2e='followers-count']").text().trim();
			const likes = $("[data-e2e='likes-count']").text().trim();
			const linkMedia = $("[data-e2e='user-page'] > div > div:nth-child(2)").find("a > span").text();
			let results = { userName, fullName, bio, following, followers, likes };
			if (linkMedia) {
				results = { ...results, linkMedia };
			}
			resolve(results);
		});
	});

const URL_BASE = (input) => {
	if (input) return `https://www.tiktok.com/${input}`;
	return `https://www.brainans.com/user/`;
};
