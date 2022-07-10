import Axios from "axios";

export const bilibiliSearch = (keyword) =>
	new Promise(async (resolve) => {
		try {
			const { data } = (await Axios.get(URL_SEARCH(keyword))).data;
			if (data.result == undefined) resolve({ error: "Videos Not Found" });
			resolve(bilibiliVideo(data.result));
		} catch (err) {
			resolve({ error: err.message });
		}
	});

const bilibiliParseMetadata = (arr) =>
	new Promise((resolve) => {
		try {
			let CONTAINER = [];
			CONTAINER = arr.map(({ title, owner: { name: author, mid: author_id }, stat: { like, favorite, share, view }, duration, pic: thumbnail, desc: description, bvid, durl: [{ url: download_link, size }] }) => {
				return {
					title,
					author,
					author_id,
					like,
					share,
					duration: convertSecondstoTime(duration),
					favorite,
					view,
					thumbnail: `https:${thumbnail}`,
					description: description == "" ? "No Description" : description,
					original_video_link: URL_BASE(bvid),
					download_link,
					size,
				};
			});
			resolve(CONTAINER);
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when parsing Bilibili results metadata." });
		}
	});

const bilibiliVideo = (arr) =>
	new Promise(async (resolve) => {
		try {
			const CONTAINER = [];
			const METADATA = [];
			for (const { aid } of arr) {
				CONTAINER.push(Axios.get(URL_VIDEO_DETAILS(aid)));
			}
			await Promise.all(CONTAINER)
				.then(async (result) => {
					for (const {
						data: { data: detail_metadata },
					} of result) {
						const { data: file_metadata } = (await Axios.get(URL_VIDEO(detail_metadata.aid, detail_metadata.cid))).data;
						METADATA.push({ ...detail_metadata, ...file_metadata });
					}
				})
				.catch((err) => {
					resolve({ error: err.message, cus_message: "Error when looking for Bilibili video metadata." });
				});
			resolve(bilibiliParseMetadata(METADATA));
		} catch (err) {
			resolve({ error: err.message, cus_message: "Error when looking for Bilibili video metadata." });
		}
	});

function convertSecondstoTime(s) {
	const dateObj = new Date(s * 1000);
	const hours = dateObj.getUTCHours();
	const minutes = dateObj.getUTCMinutes();
	const seconds = dateObj.getSeconds();
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

const URL_BASE = (code) => `https://www.bilibili.com/video/${code}`;
const URL_SEARCH = (keyword) => `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&pagesize=3&search_type=video&order=totalrank`;
const URL_VIDEO_DETAILS = (aid) => `https://api.bilibili.com/x/web-interface/view?aid=${aid}&bvid=`;
const URL_VIDEO = (aid, cid) => `https://api.bilibili.com/x/player/playurl?cid=${cid}&avid=${aid}&type=flv`;
