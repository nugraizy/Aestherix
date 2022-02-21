import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import yts from "yt-search";

const post = (url, formdata) =>
	fetch(url, {
		method: "POST",
		headers: {
			accept: "*/*",
			"accept-language": "en-US,en;q=0.9",
			"content-type": "application/x-www-form-urlencoded; charset=UTF-8",
			"sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
			"x-requested-with": "XMLHttpRequest",
		},
		body: new URLSearchParams(Object.entries(formdata)),
	});
const ytIdRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/;
export const isUrl = (url) => url.match(new RegExp(/(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:shorts\/)?(?:watch\?.*(?:|\&)v=|embed\/|v\/)|youtu\.be\/)\/.+/, "gi"));

export const yt = async (url, quality, type, bitrate, server = "en60") =>
	new Promise(async (resolve, reject) => {
		try {
			if (!ytIdRegex.test(url)) throw "Invalid URL";
			const ytId = ytIdRegex.exec(url);
			url = `https://youtu.be/${ytId[1]}`;
			const json = await post(`https://www.y2mate.com/mates/${server}/analyze/ajax`, {
				url,
				q_auto: 0,
				ajax: 1,
			}).then((res) => res.json());
			if (json.result.includes("Error: </span>This video is copyrighted.")) return reject({ error: "```Error : Video ini dilarang didownload bajakan```", internal: false });
			if (json.result.includes("Error: </span>We can not convert your video.")) return reject({ error: "```Error : Link yang kamu masukkan tidak dapat ditemukan.```", internal: false });
			let { document } = new JSDOM(json.result).window;
			const tables = document.querySelectorAll("table");
			const table = tables[{ mp4: 0, mp3: 1 }[type] || 0];
			let list;
			switch (type) {
				case "mp4":
					list = Object.fromEntries([...table.querySelectorAll('td > a[href="#"]')].filter((v) => !/\.3gp/.test(v.innerHTML)).map((v) => [v.innerHTML.match(/.*?(?=\()/)[0].trim(), v.parentElement.nextSibling.nextSibling.innerHTML]));
					break;
				case "mp3":
					list = {
						"128kbps": table.querySelector('td > a[href="#"]').parentElement.nextSibling.nextSibling.innerHTML,
					};
					break;
				default:
					list = {};
			}
			const filesize = list[quality];
			const id = /var k__id = "(.*?)"/.exec(document.body.innerHTML) || ["", ""];
			const title = document.querySelector("b").innerHTML;
			const json2 = await post(`https://www.y2mate.com/mates/${server}/convert`, {
				type: "youtube",
				_id: id[1],
				v_id: ytId[1],
				ajax: "1",
				token: "",
				ftype: type,
				fquality: bitrate,
			}).then((res) => res.json());
			const KB = parseFloat(filesize) * (1000 * /MB$/.test(filesize));
			resolve({
				title,
				dl_link: /<a.+?href="(.+?)"/.exec(json2.result)[1],
				filesizeF: filesize,
				filesize: KB,
			});
		} catch (e) {
			reject({
				error: e.stacj,
				internal: true,
			});
		}
	});

export const ytsr = (query, all = true) =>
	new Promise((resolve, reject) => {
		try {
			if (all) {
				yts(query)
					.then((res) => {
						resolve(res.all);
					})
					.catch((e) => reject({ error: e, internal: false }));
			} else {
				yts(query)
					.then((res) => {
						const data = res.all[0];
						let {
							videoId,
							url,
							title,
							description,
							thumbnail,
							timestamp,
							seconds: times,
							ago: uploaded,
							views,
							author: { name: author },
							author: { url: urlChannel },
						} = data;
						resolve({ videoId, url, title, description, thumbnail, timestamp, times, uploaded, views, author, urlChannel });
					})
					.catch((e) => reject({ error: e, internal: false }));
			}
		} catch (e) {
			reject({
				error: e.stack,
				internal: true,
			});
		}
	});

export const ytv = (query) =>
	new Promise((resolve, reject) => {
		try {
			if (ytIdRegex.test(query)) {
				yt(query, "360p", "mp4", "360")
					.then((res) => {
						const container = res;
						ytsr(res.title, false)
							.then((res) => {
								resolve({ ...container, ...res });
							})
							.catch((e) => reject({ error: e.error, internal: false }));
					})
					.catch((e) => reject({ error: e.error, internal: false }));
			} else if (isUrl(query)) reject({ error: "Link YouTube tidak valid.", internal: false });
			else {
				ytsr(query, false)
					.then((res) => {
						const url = `https://youtu.be/${res.videoId}`;
						const container = res;
						yt(url, "360p", "mp4", "360")
							.then((res) => {
								resolve({ ...container, ...res });
							})
							.catch((e) => reject({ error: e.error, internal: false }));
					})
					.catch((e) => reject({ error: e.error, internal: false }));
			}
		} catch (e) {
			reject({
				error: e.stack,
				internal: true,
			});
		}
	});

export const yta = (query) =>
	new Promise((resolve, reject) => {
		try {
			if (ytIdRegex.test(query)) {
				yt(query, "128kbps", "mp3", "128")
					.then((res) => {
						const container = res;
						ytsr(res.title, false)
							.then((res) => {
								resolve({ ...container, ...res });
							})
							.catch((e) => reject({ error: e.error, internal: false }));
					})
					.catch((e) => reject({ error: e.error, internal: false }));
			} else if (isUrl(query)) reject({ error: "Link YouTube tidak valid.", internal: false });
			else {
				ytsr(query, false)
					.then((res) => {
						const url = `https://youtu.be/${res.videoId}`;
						const container = res;
						yt(url, "128kbps", "mp3", "128")
							.then((res) => {
								resolve({ ...container, ...res });
							})
							.catch((e) => reject({ error: e.error, internal: false }));
					})
					.catch((e) => {
						reject({ error: e.error, internal: false });
					});
			}
		} catch (e) {
			reject({
				error: e.stack,
				internal: true,
			});
		}
	});
