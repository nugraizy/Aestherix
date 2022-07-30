import Axios from "axios";
import cheerio from "cheerio";

export const wpSearch = (text) =>
	new Promise(async (resolve) => {
		try {
			const { data } = await Axios.get(`https://waifuplay.my.id/?s=${text}`);
			const $ = cheerioLOAD(data);
			if ($("div.pagenon > h2").text() == "No Post Found") return resolve({ error: "Anime not found. Try another keyword. If you sure if this keyword belongs to a few Anime title and you see this error keep happening, please report to owner ASAP." });
			const listEpisode = await wpList($(".flexbox2-item").find("a").attr("href"));
			resolve({
				title: $(".flexbox2-item").find("a").attr("title"),
				image: $(".flexbox2-item").find("img").attr("src").replace("?resize=225,310", "").replace("waifuplay.me", "waifuplay.my.id"),
				score: $(".flexbox2-item").find(".score").text(),
				studio: $(".flexbox2-item")
					.find(".flexbox2-title > span")
					.map((i, el) => $(el).text())
					.get(1),
				season: $(".flexbox2-item").find(".season").text(),
				type: $(".flexbox2-item").find(".type").text(),
				genre: $(".flexbox2-item").find(".genres").text(),
				link: $(".flexbox2-item").find("a").attr("href").replace("waifuplay.me", "waifuplay.my.id"),
				sysnopsis: $(".flexbox2-item").find(".synops").text(),
				listEpisode,
			});
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

export const wpList = (url) =>
	new Promise(async (resolve) => {
		try {
			switch (url) {
				case url.includes("batch"): {
					const { data } = await Axios.get(url);
					const $ = cheerioLOAD(data);
					const result = $("div#download > ul > li")
						.get()
						.map((res) => {
							return {
								quality: $(res).find("b").text(),
								url: $(res).find("a").attr("href"),
							};
						});
					resolve({ type: "batch", result });
				}
				default:
					const { data } = await Axios.get(url);
					const $ = cheerioLOAD(data);
					const result = $(".series-episodelist > li")
						.get()
						.map((res) => {
							return {
								episode: Number(
									$(res)
										.find("a > span")
										.map((i, el) => $(el).text())
										.get(0)
										.replace("Episode ", ""),
								),
								url: $(res).find("a").attr("href"),
							};
						})
						.sort((a, b) => a.episode - b.episode);
					resolve({ type: "episode", result });
			}
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

export const wpDownload = (url) =>
	new Promise(async (resolve) => {
		try {
			const { data } = await Axios.get(url);
			const $ = cheerioLOAD(data);
			const result = $(".dlbox2 > a")
				.get()
				.map((res) => {
					return {
						quality: $(res).text() || "",
						url: $(res).attr("href") || "",
					};
				});
			resolve(result);
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

export const wpLatest = () =>
	new Promise(async (resolve) => {
		try {
			const { data } = await Axios.get("https://waifuplay.my.id/");
			const $ = cheerioLOAD(data);
			resolve({
				results: $(".flexbox")
					.map((_, element) => $(element).find(".flexbox-item"))
					.get(1)
					.get()
					.map((res) => {
						return {
							title: $(res).find(".flexbox-title").text(),
							episode: $(res).find(".flexbox-episode").text().replace("Episode", ""),
							image: $(res).find("img").attr("src").replace("?resize=225,310", "").replace("waifuplay.me", "waifuplay.my.id"),
							status: $(res).find(".flexbox-status").text(),
							type: $(res).find(".flexbox-type").text(),
							link: $(res).find("a").attr("href").replace("waifuplay.me", "waifuplay.my.id"),
						};
					}),
			});
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});
