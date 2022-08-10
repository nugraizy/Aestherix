import { cheerioLOAD, fetchJSON, fetchTEXT } from "../../Helper/index.js";

const TELEGRAM_URL_BASE = (input) => `https://api.telegram.org/bot1324131825:AAFA5kj-T55WZ6nnOmU35A4iKhRsPVyLAU8/${input}`;
const TELEGRAM_URL_DATABASES = (input) => `https://api.telegram.org/file/bot1324131825:AAFA5kj-T55WZ6nnOmU35A4iKhRsPVyLAU8/${input}`;
const COMBOT_URL_BASE = (input) => `https://combot.org/telegram/stickers?q=${encodeURI(input)}`;

const telegramFind = (query) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchTEXT(COMBOT_URL_BASE(query));
			const results = [];
			const $ = cheerioLOAD(data);
			const bound = $("body > div > main > div.page > div > div.stickers-catalogue > div.tab-content > div > div");
			bound.each(function () {
				const title = $(this).find(".sticker-pack__title").text()?.trim();
				const thumbnail = $(this).find(".sticker-pack__sticker > div.sticker-pack__sticker-inner > div.sticker-pack__sticker-img").attr("data-src");
				const url = $(this).find(".sticker-pack__header > a.sticker-pack__btn").attr("href");
				results.push({
					title,
					thumbnail,
					url,
				});
			});
			resolve({ status: true, results });
		} catch (e) {
			resolve({ error: e.message });
		}
	});

export const telegram = (query) =>
	new Promise(async (resolve) => {
		try {
			if (query.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, "gi"))) {
				const data = await fetchJSON(TELEGRAM_URL_BASE(`getStickerSet?name=${query.split("t.me/addstickers/")[1]}`)).json();
				resolve({
					status: true,
					containername: data.result.name,
					title: data.result.title,
					isAnimated: data.result.is_animated,
					stickers: await Promise.all(
						data.result.stickers.map(async (v) => TELEGRAM_URL_DATABASES((await fetchJSON(TELEGRAM_URL_BASE(`getFile?file_id=${v.thumb.file_id}`))).result.file_path)),
					),
				});
				return;
			}
			const results = await telegramFind(query);
			const data = await fetchJSON(TELEGRAM_URL_BASE(`getStickerSet?name=${results.results[Math.floor(Math.random() * results.results.length)].url.split("t.me/addstickers/")[1]}`));
			resolve({
				status: true,
				name: data.result.name,
				title: data.result.title,
				isAnimated: data.result.is_animated,
				stickers: await Promise.all(
					data.result.stickers.map(async (v) => TELEGRAM_URL_DATABASES((await fetchJSON(TELEGRAM_URL_BASE(`getFile?file_id=${v.thumb.file_id}`))).result.file_path)),
				),
			});
		} catch (e) {
			resolve({ error: e.message });
		}
	});
