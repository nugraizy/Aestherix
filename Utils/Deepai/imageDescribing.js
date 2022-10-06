import Axios from 'axios';
import FormData from 'form-data';

import { randomize } from '../../Helper/index.js';

const URL_API = 'https://api.deepai.org/api/text2img';

export const createImage = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const KEY = randomize(process.env.DEEP_KEY.split('\n'));
			const form = new FormData();
			const axiosInstance = Axios.create({ headers: { 'client-library': 'deepai-js-client' } });

			axiosInstance.defaults.headers.common['api-key'] = KEY;
			const reqOptions = {
				withCredentials: true,
			};

			form.append('text', input);
			reqOptions.headers = form.getHeaders();
			const {
				data: { output_url: outputUrl },
			} = await axiosInstance.post(URL_API, form, reqOptions);

			resolve(outputUrl);
		} catch (err) {
			reject(err);
		}
	});
