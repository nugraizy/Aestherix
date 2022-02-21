import Axios from "axios";

export const tiktokDownloader = (url) =>
	new Promise(async (resolve, reject) => {
		Axios.get(URL_KEY_PARSER(url))
			.then(async ({ data }) => {
				if (data.status !== "success") reject(data);
				Axios.get(URL_DETAIL_PARSER(data.data.key))
					.then(({ data }) => {
						if (data.status !== "success") reject(data);
						resolve({
							...data.data.author,
							description: data.data.description,
							with_watermark: URL_BASE_DOWNLOAD(data.data.video.with_watermark),
							no_watermark: URL_BASE_DOWNLOAD(data.data.video.no_watermark),
							no_watermark_raw: data.data.video.no_watermark_raw,
							music: URL_BASE_MUSIC(data.data.music),
						});
					})
					.catch((e) => reject({ error: e }));
			})
			.catch((e) => reject({ error: e }));
	});
const URL_KEY_PARSER = (input) => `https://api.snaptik.site/video-key?video_url=${input}`;
const URL_DETAIL_PARSER = (input) => `https://api.snaptik.site/video-details-by-key?key=${input}`;
const URL_BASE_DOWNLOAD = (input) => `https://api.snaptik.site/download?key=${input}&type=video`;
const URL_BASE_MUSIC = (input) => `https://api.snaptik.site/download?key=${input}&type=music`;
