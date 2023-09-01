import axios from 'axios';
import asyncRetry from 'async-retry';
import Bluebird from 'bluebird';

import { _api, bilibiliParseMetadataEn, bilibiliParseMetadataTv } from './utils.js';

const { Promise } = Bluebird;

const headers = {
	'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36'
};

export const bilibiliDetailEn = ({ aid }) =>
	new Promise(async (resolve, reject) => {
		try {
			let detailMetadata;
			let fileMetadata;

			try {
				detailMetadata = await asyncRetry(
					async () => {
						const { data } = await axios.get(_api.en.detail(aid), {
							headers
						});

						if (!data.data) {
							throw new Error('Error when getting Bilibili video details.');
						}

						return data.data;
					},
					{
						retries: 5
					}
				);

				if (!detailMetadata) {
					reject(new Error('Error when getting Bilibili video details.'));
				}

				fileMetadata = await asyncRetry(
					async () => {
						const { data } = await axios.get(_api.en.file(detailMetadata.aid, detailMetadata.cid), {
							headers
						});

						if (!data.data) {
							throw new Error('Error when getting Bilibili video file.');
						}

						return data.data;
					},
					{
						retries: 5
					}
				);

				if (!fileMetadata) {
					reject(new Error('Error when getting Bilibili video file.'));
				}
			} catch (error) {
				reject(error);
			}

			resolve(bilibiliParseMetadataEn({ ...detailMetadata, ...fileMetadata }));
		} catch (error) {
			reject(error);
		}
	});

export const bilibiliSearchEn = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			let data;

			try {
				data = await asyncRetry(
					async () => {
						const { data } = await axios.get(_api.en.search(keyword), {
							headers,
							validateStatus: () => true
						});

						if (!data.data) {
							throw new Error('Error when searching Bilibili videos.');
						}

						return data.data;
					},
					{
						retries: 10
					}
				);
			} catch (error) {
				reject(error);
			}

			if (!data) {
				reject(new Error('Error when searching Bilibili videos.'));
			}

			resolve(data.result.filter((v) => v.type === 'video').slice(0, 5));
		} catch (error) {
			reject(error);
		}
	});

export const bilibiliDetailTv = ({ aid }) =>
	new Promise(async (resolve, reject) => {
		try {
			let data;

			try {
				data = await asyncRetry(
					async () => {
						const { data } = await axios.get(_api.id.file(aid), {
							headers
						});

						return data;
					},
					{
						retries: 5
					}
				);
			} catch (error) {
				reject(error);
			}

			if (!data || !data.data) {
				reject(new Error('Error when searching Bilibili videos.'));
			}

			const vid = data.data.playurl.video
				.filter((v) => v.video_resource.url !== '' && v.video_resource.quality < 64)
				.find((v) => v.video_resource.quality === 32 || v.video_resource.quality === 16 || v.video_resource.quality === 6);
			const audio = data.data.playurl.audio_resource.find((v) => v.url !== '')?.url;

			resolve({
				video: vid.video_resource.url,
				size: vid.video_resource.size,
				resolution: vid.stream_info.desc_words,
				audio
			});
		} catch (error) {
			reject(error);
		}
	});

export const bilibiliSearchTv = (keyword) =>
	new Promise(async (resolve, reject) => {
		try {
			let data;

			try {
				data = await asyncRetry(
					async () => {
						const { data } = (
							await axios.get(_api.id.search(keyword), {
								headers
							})
						).data;

						if (!data) {
							throw new Error('Error when getting Bilibili video details.');
						}

						return data;
					},
					{
						retries: 5
					}
				);
			} catch (error) {
				reject(error);
			}

			if (!data.modules.some((v) => v.type === 'ugc')) {
				reject(new Error('Error when searching Bilibili videos.'));
			}

			let { items } = data.modules[data.modules.findIndex((v) => v.type === 'ugc')];

			resolve(items.map(bilibiliParseMetadataTv));
		} catch (error) {
			reject(error);
		}
	});
