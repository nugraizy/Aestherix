import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { randomize } from '../modules/index.js';

const _api = 'https://api.deepai.org/api/nsfw-detector';

export const isNsfw = (input, filename) =>
	new Promise(async (resolve) => {
		try {
			input = fs.writeFileSync(filename, input);
			input = fs.createReadStream(filename);
			const KEY = randomize(process.env.DEEP_KEY.split('\n'));
			const form = new FormData();
			const axiosInstance = axios.create({ headers: { 'client-library': 'deepai-js-client' } });

			axiosInstance.defaults.headers.common['api-key'] = KEY;
			const reqOptions = {
				withCredentials: true
			};

			form.append('image', input);
			reqOptions.headers = form.getHeaders();
			const {
				data: { output }
			} = await axiosInstance.post(_api, form, reqOptions);
			const outputPercentageNSFW = output?.detections?.some((v) => Number(v.confidence) > 0.6) || output.nsfw_score >= 0.4;

			if (outputPercentageNSFW) {
				fs.unlinkSync(filename);
				return resolve({ status: true, ...output });
			}

			fs.unlinkSync(filename);
			resolve({ status: false, ...output });
		} catch (err) {
			fs.unlinkSync(filename);
			resolve({ status: false });
		}
	});
