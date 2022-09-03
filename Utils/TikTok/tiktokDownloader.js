import fetch from "node-fetch";
import { cheerioLOAD, fetchJSON, fetchTEXT } from "../../Helper/index.js";

export const tiktokDownloader = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes("vm.tiktok.com") ? url.replace("vm.tiktok.com", "vt.tiktok.com") : url;
			const data = await fetchJSON(URL_KEY_PARSER(url));
			if (data.status !== "success") {
				resolve(data);
			}
			const dataResult = await fetchJSON(URL_DETAIL_PARSER(data.data.key));
			if (dataResult.status !== "success") {
				resolve(dataResult);
			}
			resolve({
				...dataResult.data.author,
				description: dataResult.data.description,
				with_watermark: URL_BASE_DOWNLOAD(dataResult.data.video.with_watermark),
				no_watermark: URL_BASE_DOWNLOAD(dataResult.data.video.no_watermark),
				no_watermark_raw: dataResult.data.video.no_watermark_raw,
				music: URL_BASE_MUSIC(dataResult.data.music),
			});
		} catch (e) {
			resolve(e);
		}
	});

export const tiktokAPI = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes("vm.tiktok.com") ? url.replace("vm.tiktok.com", "vt.tiktok.com") : url;
			if (/((vt|vm|vk)\.tiktok\.com)/g.test(url) || !url.includes(/video/)) {
				const req = await fetch(url);
				const { origin, pathname } = new URL(req.url);
				url = origin + pathname;
			}
			const res = await fetchTEXT(url);
			const $ = cheerioLOAD(res);
			const parsed = await parseData(JSON.parse($("#SIGI_STATE").html()));
			if (parsed.type == "images") {
				resolve(parsed);
			}
			const with_no_watermark = (await fetchJSON(URL_API(parsed.keyword))).aweme_detail.video.play_addr.url_list[Math.floor(Math.random() * 3)];
			parsed.published = Number(parsed.published);
			parsed.url = {
				...parsed.url,
				with_no_watermark,
			};
			resolve(parsed);
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

const parseData = async (arr) => {
	const {
		ItemList: {
			video: { keyword },
		},
	} = arr;
	if (arr.ItemModule[keyword] == undefined) {
		const data = await fetchJSON(URL_API(keyword));
		const {
			nickname,
			unique_id: author,
			signature: biograph,
			avatar_larger: { url_list: profilePicture },
		} = data.aweme_detail.author;
		const { digg_count: liked, share_count: shared, comment_count: comment, play_count: view } = data.aweme_detail.statistics;
		const {
			desc: videoDescription,
			image_post_info: { images },
		} = data.aweme_detail;
		const music = data.aweme_detail?.music?.play_url?.uri ?? "N/A";
		const musicDuration = data.aweme_detail?.music?.duration ?? "N/A";
		const authorMusic = data.aweme_detail?.music?.matched_song?.author ?? "N/A";
		const musicTitle = data.aweme_detail?.music?.matched_song?.title ?? "N/A";
		data.aweme_detail?.music;
		return {
			keyword,
			nickname,
			type: "images",
			author,
			liked,
			shared,
			comment,
			view,
			biograph,
			videoDescription,
			music: {
				authorMusic,
				musicTitle,
				musicDuration,
				music,
			},
			profilePicture: profilePicture[0],
			images: images.map((v, i) => {
				return {
					url: v.display_image.url_list[1],
					index: i + 1,
				};
			}),
		};
	}
	const {
		desc: videoDescription,
		createTime: published,
		author,
		stats: { diggCount: liked, shareCount: shared, commentCount: comment, playCount: view },
		authorStats: { followerCount: followers, followingCount: following, heart, videoCount: totalVideo },
		locationCreated,
		nickname,
		avatarThumb: profilePicture,
		video: { downloadAddr: with_watermark, duration: videoDuration, ratio, cover: videoThumbnail },
		music: { title: musicTitle, authorName: authorMusic, playUrl: music, duration: musicDuration },
	} = arr?.ItemModule?.[keyword];
	const { signature: biograph, verified } = arr?.UserModule?.users?.[author];
	return {
		keyword,
		author,
		nickname,
		biograph,
		verified,
		liked,
		shared,
		comment,
		view,
		videoDescription,
		published,
		followers,
		following,
		heart,
		totalVideo,
		locationCreated,
		musicTitle,
		authorMusic,
		videoDuration,
		musicDuration,
		ratio,
		url: {
			profilePicture,
			videoThumbnail,
			music,
			with_watermark,
		},
	};
};

const URL_KEY_PARSER = (input) => `https://api.ngutek.com/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.ngutek.com/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.ngutek.com/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.ngutek.com/download?key=${input}&type=music`;
const URL_API = (input) => `https://api2.musical.ly/aweme/v1/aweme/detail/?aweme_id=${input}`;
const UA = () => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36";
