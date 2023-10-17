import axios from 'axios';

import { ERRLOG, color } from '../modules/index.js';

const BASE_URL = (path) => `https://api.myanimelist.net/v2${path}`;
const TYPE = {
	MANGA: ['all', 'manga', 'novels', 'oneshots', 'doujin', 'manhwa', 'manhua', 'bypopularity', 'favorite'],
	ANIME: ['all', 'airing', 'upcoming', 'tv', 'ova', 'movie', 'special', 'bypopularity', 'favorite']
};

export class MyAnimeList {
	#access = `Bearer ${process.env.MAL_ACCESS}`;
	#refresh = process.env.MAL_REFRESH;
	#clientId = process.env.MAL_ID;
	#clientSecret = process.env.MAL_SECRET;
	#retries = 0;
	constructor() {
		this.searchAnime = async (query) =>
			(
				await this.request(
					'/anime',
					{
						q: query,
						limit: 100,
						fields:
							'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
					},
					null,
					'GET'
				)
			)?.data?.map((v) => v.node);

		this.searchManga = async (query) =>
			(
				await this.request(
					'/manga',
					{
						q: query,
						limit: 100,
						fields:
							'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
					},
					null,
					'GET'
				)
			).data?.map((v) => v.node);

		this.getAnimeDetail = async (id) =>
			await this.request(
				`/anime/${id}`,
				{
					fields:
						'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
				},
				'GET'
			);

		this.getMangaDetail = async (id) =>
			await this.request(
				`/manga/${id}`,
				{
					fields:
						'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
				},
				'GET'
			);

		this.getAnimeRanking = async (type = 'all') => {
			if (!TYPE.ANIME.includes(type)) {
				return { error: true, message: `Invalid type\nValid types are :\n${TYPE.ANIME.join(', ')}` };
			}

			return (
				await this.request(
					'/anime/ranking',
					{
						ranking_type: type /* eslint-disable-line */,
						fields:
							'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
					},
					'GET'
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.getMangaRanking = async (type = 'all') => {
			if (!TYPE.MANGA.includes(type)) {
				return { error: true, message: `Invalid type\nValid types are :\n${TYPE.ANIME.join(', ')}` };
			}

			return (
				await this.request(
					'/manga/ranking',
					{
						ranking_type: type /* eslint-disable-line */,
						fields:
							'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
					},
					'GET'
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.userDetails = async () =>
			await this.request('/users/@me', {
				fields: 'anime_statistics'
			});
	}
	async request(path, params = {}, method = 'GET') {
		try {
			const url = BASE_URL(path);
			const response = await axios({
				method,
				url,
				params,
				headers: {
					Authorization: this.#access
				}
			});

			return response.data;
		} catch (err) {
			if (err.response.data.error === 'invalid_token') {
				this.showExpiredError();
				await this.refreshToken();

				this.#retries++;

				if (this.#retries > 3) {
					this.#retries = 0;
					return err.response;
				}

				return await this.request(path, params, method);
			}

			return err.response;
		}
	}

	async refreshToken() {
		try {
			const response = await axios('https://myanimelist.net/v1/oauth2/token', {
				method: 'POST',
				data: `grant_type=refresh_token&refresh_token=${this.#refresh}&client_id=${this.#clientId}&client_secret=${
					this.#clientSecret
				}`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});

			this.#access = `Bearer ${response.data.access_token}`;

			ERRLOG(
				`⚠️  ${color('( MyAnimeList ) AccessToken is found. Copy this and paste to .env', 'green')}`,
				color(response.data.access_token, '#05ffa1')
			);

			return response.data;
		} catch (err) {
			return err.response;
		}
	}

	showExpiredError() {
		ERRLOG(`⚠️  ${color('( MyAnimeList ) AccessToken expired. Refreshing the access tokens.', 'red')}`);
	}
}
