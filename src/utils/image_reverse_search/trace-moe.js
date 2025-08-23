import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

import { fetchBUFFER, fetchJSON, isURL } from '../modules/index.js';

const graphql = await fs.readFile(path.join(__dirname, 'src/utils/image_reverse_search/query.graphql'), { encoding: 'utf-8' });
const _api = 'https://api.trace.moe/search?cutBorders&';
const _apiPost = 'https://trace.moe/anilist/';

const isValidImageURL = async (url) => {
	try {
		const data = await fetch(url.replace('https:', 'http:'));

		if (data.status !== 200) {
			return false;
		}

		return true;
	} catch {
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
				file = fs.readFileSync(file);
			}

			file = await sharp(file).jpeg({ quality: 100 }).toBuffer();
			const form = new FormData();

			form.append('image', file, { contentType: 'image/jpeg', filename: 'blob' });
			const {
				data: { result }
			} = await axios.post(_api, form);

			result.forEach((v) => {
				return (v.similarity = Number((v.similarity * 100).toFixed(2)));
			});
			const {
				data: {
					Page: { media }
				}
			} = await fetchJSON(_apiPost, {
				method: 'POST',
				body: JSON.stringify({
					query: graphql,
					variables: {
						ids: result.map((v) => v.anilist)
					}
				}),
				headers: {
					'content-type': 'application/json',
					cookie: 'laravel_session=b7cAHsg8W1BucvpMg3I8VxYHEyUEpk8wxL1mI08I'
				}
			});
			const container = result.map((v) => ({
				...v,
				media: media.find((w) => w.id === v.anilist) ?? 'No Detail'
			}));

			resolve(container.filter((v) => v.media !== 'No Detail'));
		} catch (error) {
			reject(error);
		}
	});
