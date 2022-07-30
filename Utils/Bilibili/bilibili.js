import Axios from "axios";
import { UA, formatViews, convertSecondstoTime } from "../../Helper/index.js";

export const bilibiliSearchCOM = (keyword) =>
	new Promise(async (resolve) => {
		try {
			const { data } = (
				await Axios.get(URL_SEARCH_COM(keyword), {
					headers: {
						"user-agent": UA(),
					},
				})
			).data;
			if (data.result == undefined) return resolve({ error: "Videos Not Found", cus_message: "Error when searching Bilibili videos." });
			resolve(bilibiliVideoCOM(data.result));
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when searching Bilibili videos." });
		}
	});

const bilibiliParseMetadataCOM = (arr) =>
	new Promise((resolve) => {
		try {
			arr = arr.map(({ title, owner: { name: author, mid: author_id }, stat: { like, favorite, share, view }, duration, pic: thumbnail, desc: description, bvid, durl: [{ url: download_link, size }] }) => {
				return {
					title,
					author,
					author_id,
					like,
					share,
					duration: convertSecondstoTime(duration),
					favorite,
					view,
					thumbnail,
					description: description == "" ? "No Description" : description,
					original_video_link: URL_BASE_COM(bvid),
					download_link,
					size,
				};
			});
			resolve(arr);
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when parsing Bilibili results metadata." });
		}
	});

const bilibiliVideoCOM = (arr) =>
	new Promise(async (resolve) => {
		try {
			const CONTAINER = [];
			const METADATA = [];
			for (const { aid } of arr) {
				CONTAINER.push(
					Axios.get(URL_VIDEO_DETAILS_COM(aid), {
						headers: {
							"user-agent": UA(),
						},
					}),
				);
			}
			await Promise.all(CONTAINER)
				.then(async (result) => {
					for (const {
						data: { data: detail_metadata },
					} of result) {
						const { data: file_metadata } = (
							await Axios.get(URL_VIDEO_COM(detail_metadata.aid, detail_metadata.cid), {
								headers: {
									"user-agent": UA(),
								},
							})
						).data;
						METADATA.push({ ...detail_metadata, ...file_metadata });
					}
				})
				.catch((err) => {
					resolve({ error: err.message, cus_message: "Error when looking for Bilibili video metadata." });
				});
			resolve(bilibiliParseMetadataCOM(METADATA));
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when looking for Bilibili video metadata." });
		}
	});

export const bilibiliSearchTV = (keyword) =>
	new Promise(async (resolve) => {
		try {
			const { data } = (
				await Axios.get(URL_SEARCH_TV(keyword), {
					headers: {
						"user-agent": UA(),
					},
				})
			).data;
			if (!data.some((v) => v.module == "ugc")) return resolve({ error: "Videos Not Found", cus_message: "Error when searching Bilibili videos." });
			let { items } = data[data.findIndex((v) => v.module == "ugc")];
			resolve(bilibiliParseMetadataTV(items));
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when searching Bilibili videos." });
		}
	});

const bilibiliParseMetadataTV = (arr) =>
	new Promise((resolve) => {
		try {
			arr = arr.map(({ title, aid, cover, desc, duration, score }) => {
				return {
					title,
					aid,
					cover,
					source: URL_BASE_TV(aid),
					author: desc.split("·")[0].trim(),
					view: formatViews(desc.split("·")[1].split("Ditonton")[0].trim()),
					duration,
					score: Number(score.toFixed(2)),
				};
			});
			resolve(arr);
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when parsing Bilibili results metadata." });
		}
	});

export const detailSourceFormat = (aid) =>
	new Promise(async (resolve) => {
		try {
			let { data } = await Axios.get(URL_VIDEO_TV(aid), {
				headers: {
					"user-agent": UA(),
					cookie: "bstar-web-lang=id; buvid3=8ee5ac76-5a96-4bad-ba97-15797dcb024347191infoc",
					"x-bili-trace-id": "3c2da06e4591969923e488a48f62e445",
				},
			});
			const vid = data.data.playurl.video.filter((v) => v.video_resource.url !== "" && v.video_resource.quality < 64).find((v) => v.video_resource.quality == 32 || v.video_resource.quality == 16 || v.video_resource.quality == 6);
			const audio = data.data.playurl.audio_resource.filter((v) => v.url !== "")[0].url;
			data = {
				video: vid.video_resource.url,
				size: vid.video_resource.size,
				resolution: vid.stream_info.desc_words,
				audio,
			};
			resolve(data);
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when formatting Bilibili results video & audio metadata." });
		}
	});

const subtitleVideos = (aid) =>
	new Promise(async (resolve) => {
		try {
			throw new Error("not yet made. only the videos that official/verified has subtitle");
			const { data } = await Axios.get(
				URL_SUBTITLE_TV(aid, {
					headers: {
						"user-agent": UA(),
					},
				}),
			);
		} catch (err) {
			console.log(err);
		}
	});

const URL_BASE_COM = (code) => `https://www.bilibili.com/video/${code}`;
const URL_SEARCH_COM = (keyword) => `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&pagesize=3&search_type=video&order=totalrank`;
const URL_VIDEO_DETAILS_COM = (aid) => `https://api.bilibili.com/x/web-interface/view?aid=${aid}&bvid=`;
const URL_VIDEO_COM = (aid, cid) => `https://api.bilibili.com/x/player/playurl?cid=${cid}&avid=${aid}&type=flv`;

const URL_BASE_TV = (code) => `https://www.bilibili.tv/id/video/${code}`;
const URL_SEARCH_TV = (keyword) => `https://api.bilibili.tv/intl/gateway/web/v2/search?keyword=${keyword}&platform=web&s_locale=id_ID`;
const URL_VIDEO_TV = (aid) => `https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&qn=112&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=bstar-web.search-result.0.0`;
const URL_SUBTITLE_TV = (aid) => `https://api.bilibili.tv/intl/gateway/web/v2/subtitle?s_locale=id_ID&platform=web&aid=${aid}&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=bstar-web.search-result.0.0`;
