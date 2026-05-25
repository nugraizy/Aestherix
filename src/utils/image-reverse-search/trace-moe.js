import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import sharp from 'sharp';

import { fetchBUFFER, isURL } from '../modules/index.js';

const _api = 'https://api.trace.moe/search?cutBorders&anilistInfo';

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

			resolve(result);
		} catch (error) {
			reject(error);
		}
	});
