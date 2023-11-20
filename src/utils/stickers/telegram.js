import { cheerioLOAD, fetchJSON, fetchTEXT } from '../modules/index.js';

const _apiBase = (input) => `https://api.telegram.org/bot1324131825:AAFA5kj-T55WZ6nnOmU35A4iKhRsPVyLAU8/${input}`;
const _apiDatabase = (input) => `https://api.telegram.org/file/bot1324131825:AAFA5kj-T55WZ6nnOmU35A4iKhRsPVyLAU8/${input}`;
const _apiCombot = (input) => `https://combot.org/telegram/stickers?q=${encodeURI(input)}`;

const telegramFind = (query) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchTEXT(_apiCombot(query), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
				}
			});
			const results = [];
			const $ = cheerioLOAD(data);
			const bound = $('body > div > main > div.page > div > div.stickers-catalogue > div.tab-content > div > div');

			bound.each(function () {
				const title = $(this).find('.sticker-pack__title').text()?.trim();
				const thumbnail = $(this)
					.find('.sticker-pack__sticker > div.sticker-pack__sticker-inner > div.sticker-pack__sticker-img')
					.attr('data-src');
				const url = $(this).find('.sticker-pack__header > a.sticker-pack__btn').attr('href');

				results.push({
					title,
					thumbnail,
					url
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
			if (
				new RegExp(
					/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
					'gi'
				).test(query)
			) {
				const data = await fetchJSON(_apiBase(`getStickerSet?name=${query.split('t.me/addstickers/')[1]}`));

				const files = await Promise.all(data.result.stickers.map((v) => fetchJSON(_apiBase(`getFile?file_id=${v.file_id}`))));

				resolve({
					status: true,
					name: data.result.name,
					title: data.result.title,
					isAnimated: data.result.is_animated,
					stickers: files.map((v) => _apiDatabase(v.result.file_path))
				});
				return;
			}

			const results = await telegramFind(query);
			const data = await fetchJSON(
				_apiBase(
					`getStickerSet?name=${
						results.results[Math.floor(Math.random() * results.results.length)].url.split('t.me/addstickers/')[1]
					}`
				)
			);

			const files = await Promise.all(data.result.stickers.map((v) => fetchJSON(_apiBase(`getFile?file_id=${v.file_id}`))));

			resolve({
				status: true,
				name: data.result.name,
				title: data.result.title,
				isAnimated: data.result.is_animated,
				stickers: files.map((v) => _apiDatabase(v.result.file_path))
			});
		} catch (e) {
			resolve({ error: e.message });
		}
	});
