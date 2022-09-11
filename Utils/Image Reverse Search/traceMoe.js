import Axios from 'axios';
import FormData from 'form-data';
import { readFileSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

import { __dirname } from '../../connect.js';
import { fetchBUFFER, fetchJSON, isURL } from '../../Helper/Modules/index.js';

const URL_BASE_API = 'https://api.trace.moe/search?cutBorders&';
const URL_BASE_ANILIST = 'https://trace.moe/anilist/';

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace('https:', 'http:'));

		if (data.status !== 200) {
			return false;
		}

		return true;
	} catch (error) {
		return false;
	}
};

export const traceMoe = async (file) =>
	new Promise(async (resolve, reject) => {
		try {
			if (isURL(file) && isValidImageURL(file)) {
				file = await fetchBUFFER(file);
			} else if (isURL(file) && !(await isValidImageURL(file))) {
				return resolve({ error: 'Invalid image URL' });
			} else {
				file = readFileSync(file);
			}

			file = await sharp(file).jpeg({ quality: 100 }).toBuffer();
			const form = new FormData();

			form.append('image', file, { contentType: 'image/jpeg', filename: 'blob' });
			const {
				data: { result },
			} = await Axios.post(URL_BASE_API, form);

			result.forEach((v) => {
				return (v.similarity = Number((v.similarity * 100).toFixed(2)));
			});
			const {
				data: {
					Page: { media },
				},
			} = await fetchJSON(URL_BASE_ANILIST, {
				method: 'POST',
				body: JSON.stringify({
					query: readFileSync(path.join(__dirname, 'Utils/Image Reverse Search/query.graphql')).toString(),
					variables: {
						ids: result.map((v) => v.anilist),
					},
				}),
				headers: {
					'content-type': 'application/json',
					cookie: 'laravel_session=b7cAHsg8W1BucvpMg3I8VxYHEyUEpk8wxL1mI08I',
				},
			});
			const container = result.map((v) => {
				return { ...v, media: media.find((w) => w.id == v.anilist) ?? 'No Detail' };
			});

			resolve(container.filter((v) => v.media !== 'No Detail'));
		} catch (error) {
			reject(error);
		}
	});
