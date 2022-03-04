import fetch from "node-fetch";

export const tiktokDownloader = (url) =>
	new Promise(async (resolve) => {
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
	});
const URL_KEY_PARSER = (input) => `https://api.snaptik.site/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.snaptik.site/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.snaptik.site/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.snaptik.site/download?key=${input}&type=music`;
