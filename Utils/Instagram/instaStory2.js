import fetch from "node-fetch";
import cheerio from "cheerio";

export const getStory2 = (username) =>
	new Promise(async (resolve, reject) => {
		let data = null;
		if (username.startsWith("@")) {
			username = username.replace("@", "");
		}
		try {
			for (let i = 0; i < 5; i++) {
				data = await fetch(URL_BASE(username, i)).then((res) => res.text());
				if (!data.includes("nostory")) break;
			}
			const $ = cheerio.load(data);
			const results = [];
			$("center").each((i, el) => {
				if ($(el).find("a.download-btn").attr("href") !== undefined) {
					results.push($(el).find("a.download-btn").attr("href"));
				}
			});
			resolve(results);
		} catch (e) {
			reject({ error: e });
		}
	});

const URL_BASE = (username, tries) => `https://www.insta-stories.net/data.php?username=${username}&b=${tries}&t=${Date.now()}`;
