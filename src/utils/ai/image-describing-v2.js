import axios from 'axios';
import FormData from 'form-data';

import { randomize } from '../modules/index.js';

const _api = 'https://api.deepai.org/api/stable-diffusion';

/**
 * Convert strings into an image v2.
 * @param {string} input descriptive strings.
 * @returns {Promise<string>}
 */
export const createImageV2 = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const KEY = randomize(process.env.DEEP_KEY.split('\n'));
			const form = new FormData();
			const axiosInstance = axios.create({ headers: { 'client-library': 'deepai-js-client' } });

			axiosInstance.defaults.headers.common['api-key'] = KEY;
			const reqOptions = {
				withCredentials: true
			};

			form.append('text', input);
			reqOptions.headers = form.getHeaders();
			const {
				data: { output_url: outputUrl }
			} = await axiosInstance.post(_api, form, reqOptions);

			resolve(outputUrl);
		} catch (err) {
			reject(err);
		}
	});
