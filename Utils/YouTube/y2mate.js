import { JSDOM } from "jsdom";
import yts from "yt-search";
import { fetchJSON, isURL } from "../../Helper/index.js";

const post = async (url, formdata) => {
	return await fetchJSON(url, {
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
};
export const isUrl = (url) => url.match(new RegExp(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/, "g"));

export const yt = async (url, quality, type, bitrate, server = "en60") =>
	new Promise(async (resolve) => {
		try {
			if (!isUrl(url)) {
				return resolve({ error: "Invalid URL" });
			}
			const json = await post(`https://www.y2mate.com/mates/${server}/analyze/ajax`, {
				url,
				q_auto: 0,
				ajax: 1,
			});
			if (json.result.includes("Error: </span>This video is copyrighted.")) {
				return resolve({ error: "```Error : Video ini dilarang didownload bajakan```", internal: false });
			}
			if (json.result.includes("Error: </span>We can not convert your video.")) {
				return resolve({ error: "```Error : Link yang kamu masukkan tidak dapat ditemukan.```", internal: false });
			}
			let { document } = new JSDOM(json.result).window;
			const tables = document.querySelectorAll("table");
			const table = tables[{ mp4: 0, mp3: 1 }[type] || 0];
			let list;
			switch (type) {
				case "mp4":
					list = Object.fromEntries(
						[...table.querySelectorAll('td > a[href="#"]')]
							.filter((v) => !/\.3gp/.test(v.innerHTML))
							.map((v) => [v.innerHTML.match(/.*?(?=\()/)[0].trim(), v.parentElement.nextSibling.nextSibling.innerHTML]),
					);
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
			const vId = /var k_data_vid = "(.*?)"/.exec(document.body.innerHTML) || ["", ""];
			const title = document.querySelector("b").innerHTML;
			const json2 = await post(`https://www.y2mate.com/mates/${server}/convert`, {
				type: "youtube",
				_id: id[1],
				v_id: vId[1],
				ajax: "1",
				token: "",
				ftype: type,
				fquality: bitrate,
			});
			const KB = parseFloat(filesize) * (1000 * /MB$/.test(filesize));
			resolve({
				title,
				dl_link: /<a.+?href="(.+?)"/.exec(json2.result)[1],
				filesizeF: filesize,
				filesize: KB,
			});
		} catch (e) {
			resolve({
				error: e.stacj,
				internal: true,
			});
		}
	});

export const ytsr = (query, all = true) =>
	new Promise(async (resolve, reject) => {
		try {
			if (all) {
				const res = await yts(query);
				resolve(res.all);
			} else {
				const res = await yts(query);
				const data = res?.all?.[0];
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
			}
		} catch (e) {
			reject(e);
		}
	});

export const ytv = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isUrl(query)) {
				let res = await yt(query, "360p", "mp4", "360");
				const container = res;
				res = await ytsr(res.title, false);
				resolve({ ...container, ...res });
			} else if (isURL(query) && !isUrl(query)) {
				resolve({ error: "Link YouTube tidak valid.", internal: false });
			} else {
				let res = await ytsr(query, false);
				const url = `https://youtu.be/${res.videoId}`;
				const container = res;
				res = yt(url, "360p", "mp4", "360");
				resolve({ ...container, ...res });
			}
		} catch (e) {
			reject(e);
		}
	});

export const yta = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isUrl(query)) {
				let res = await yt(query, "128kbps", "mp3", "128");
				const container = res;
				res = await ytsr(res.title, false);
				resolve({ ...container, ...res });
			} else if (isURL(query) && !isUrl(query)) {
				resolve({ error: "Link YouTube tidak valid.", internal: false });
			} else {
				const res = await ytsr(query, false);
				const url = `https://youtu.be/${res.videoId}`;
				const container = res;
				res = await yt(url, "128kbps", "mp3", "128");
				resolve({ ...container, ...res });
			}
		} catch (e) {
			reject(e);
		}
	});
