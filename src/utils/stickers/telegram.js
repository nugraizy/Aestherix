import { fetchJSON } from '../modules/index.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

const _apiBase = (input) => `https://api.telegram.org/bot${TELEGRAM_TOKEN}/${input}`;
const _apiDatabase = (input) => `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${input}`;
const _apiSigStick = (keyword) => `https://www.sigstick.com/_next/data/9rEJZP6nb1uI-eY-NyCy3/stickers.json?keyword=${keyword}`;

const telegramFind = (query) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchJSON(_apiSigStick(query), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36'
				}
			});

			const results = data.pageProps.packs.map((v) => ({
				title: v.title,
				thumbnail: v.cover.url,
				url: v.telegramUrl
			}));

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
