import fetch from "node-fetch";

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
const URL_KEY_PARSER = (input) => `https://api.ngutek.com/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.ngutek.com/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.ngutek.com/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.ngutek.com/download?key=${input}&type=music`;
