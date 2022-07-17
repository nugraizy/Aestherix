import fetch from "node-fetch";
import cheerio from "cheerio";

export const tiktokDownloader = (url) =>
	new Promise(async (resolve) => {
		try {
			url = url.includes("vm.tiktok.com") ? url.replace("vm.tiktok.com", "vt.tiktok.com") : url;
			const data = await (await fetch(URL_KEY_PARSER(url))).json();
			if (data.status !== "success") resolve(data);
			const dataResult = await (await fetch(URL_DETAIL_PARSER(data.data.key))).json();
			if (dataResult.status !== "success") resolve(dataResult);
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
			const res = await (
				await fetch(url, {
					headers: {
						"user-agent": UA(),
					},
				})
			).text();
			const $ = cheerio.load(res);
			const parsed = await parseData(JSON.parse($("#SIGI_STATE").html()));
			if (parsed.type == "images") {
				resolve(parsed);
			}
			const with_no_watermark = (await (await fetch(URL_API(parsed.keyword))).json()).aweme_detail.video.play_addr.url_list[Math.floor(Math.random() * 3)];
			parsed.published = Number(parsed.published);
			parsed.url = {
				...parsed.url,
				with_no_watermark,
			};
			resolve(parsed);
		} catch (err) {
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
		const data = await (await fetch(URL_API(keyword))).json();
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
			music: {
				play_url: { uri: music },
				duration: musicDuration,
				matched_song: { author: authorMusic, title: musicTitle },
			},
		} = data.aweme_detail;
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
