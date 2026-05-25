import { fetchJSON } from '../modules/index.js';

const BASE_URL = (path) => `https://api.jikan.moe/v4${path}`;
const TYPE = {
	ANIME: ['tv', 'movie', 'ova', 'special', 'ona', 'music', 'cm', 'pv', 'tv_special'],
	MANGA: ['manga', 'novel', 'lightnovel', 'oneshot', 'doujin', 'manhwa', 'manhua']
};

export class Jikan {
	constructor() {
		this.anime = {
			search: (query) =>
				this.request(
					'/anime',
					{
						q: query,
						limit: 25
					},
					'GET'
				),

			/**
			 * @param {import('./types.d.ts').AnimeType} type
			 * @returns
			 */
			ranking: (type = 'tv') => {
				if (!TYPE.ANIME.includes(type)) {
					return { error: true, message: `Invalid type\nValid types are :\n${TYPE.ANIME.join(', ')}` };
				}

				return this.request(
					'/top/anime',
					{
						type: type
					},
					'GET'
				);
			},

			detail: (id) => this.request(`/anime/${id}/full`, {}, 'GET')
		};

		this.manga = {
			search: (query) =>
				this.request(
					'/manga',
					{
						q: query,
						limit: 25
					},
					'GET'
				),

			/**
			 * @param {import('./types.d.ts').MangaType} type
			 * @returns
			 */
			ranking: (type = 'manga') => {
				if (!TYPE.MANGA.includes(type)) {
					return { error: true, message: `Invalid type\nValid types are :\n${TYPE.MANGA.join(', ')}` };
				}

				return this.request(
					'/top/manga',
					{
						type: type
					},
					'GET'
				);
			},

			detail: (id) => this.request(`/manga/${id}/full`, {}, 'GET')
		};
	}
	async request(path, params = {}, method = 'GET') {
		return new Promise(async (resolve, reject) => {
			try {
				const url = new URL(BASE_URL(path));
				Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
				const data = await fetchJSON(url.toString(), { method });

				resolve(data);
			} catch (err) {
				reject(err);
			}
		});
	}
}
