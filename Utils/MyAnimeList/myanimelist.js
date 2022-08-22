import Axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = (path) => `https://api.myanimelist.net/v2${path}`;
const TYPE = {
	MANGA: ["all", "manga", "novels", "oneshots", "doujin", "manhwa", "manhua", "bypopularity", "favorite"],
	ANIME: ["all", "airing", "upcoming", "tv", "ova", "movie", "special", "bypopularity", "favorite"],
};

export class MyAnimeList {
	#access = `Bearer ${process.env.MAL_ACCESS}`;
	constructor() {
		this.searchAnime = async (query) => {
			return (
				await this.request(
					"/anime",
					{
						q: query,
						limit: 100,
						fields:
							"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
					},
					null,
					"GET",
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.searchManga = async (query) => {
			return (
				await this.request(
					"/manga",
					{
						q: query,
						limit: 100,
						fields:
							"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
					},
					null,
					"GET",
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.getAnimeDetail = async (id) => {
			return await this.request(
				`/anime/${id}`,
				{
					fields:
						"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
				},
				"GET",
			);
		};

		this.getMangaDetail = async (id) => {
			return await this.request(
				`/manga/${id}`,
				{
					fields:
						"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
				},
				"GET",
			);
		};

		this.getAnimeRanking = async (type = "all") => {
			if (!TYPE.ANIME.includes(type)) {
				return { error: true, message: `Invalid type\nValid types are :\n${TYPE.ANIME.join(", ")}` };
			}
			return (
				await this.request(
					`/anime/ranking`,
					{
						ranking_type: type,
						fields:
							"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
					},
					"GET",
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.getMangaRanking = async (type = "all") => {
			if (!TYPE.MANGA.includes(type)) {
				return { error: true, message: `Invalid type\nValid types are :\n${TYPE.ANIME.join(", ")}` };
			}
			return (
				await this.request(
					`/manga/ranking`,
					{
						ranking_type: type,
						fields:
							"id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics",
					},
					"GET",
				)
			)?.data?.map((v) => {
				return v.node;
			});
		};

		this.userDetails = async () => {
			return await this.request("/users/@me", {
				fields: "anime_statistics",
			});
		};
	}
	async request(path, params = {}, method = "GET") {
		try {
			const url = BASE_URL(path);
			const response = await Axios({
				method,
				url,
				params,
				headers: {
					Authorization: this.#access,
				},
			});
			return response.data;
		} catch (err) {
			return err.response;
		}
	}
}
