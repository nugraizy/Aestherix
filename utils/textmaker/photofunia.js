import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';

import { cheerioLOAD } from '../../helper/index.js';

const _apiBase = (input) => `https://photofunia.com${input}`;

const split = (text, len) => {
	if (len === 1) {
		return [text];
	}

	const arr = text.split(/\s+/);
	let length = len;

	len = arr.length;
	const out = [];
	let i = 0;
	let size;

	if (len % length === 0) {
		size = Math.floor(len / length);
		while (i < len) {
			out.push(arr.slice(i, (i += size)));
		}
	} else {
		while (i < len) {
			size = Math.ceil((len - i) / length--);
			out.push(arr.slice(i, (i += size)));
		}
	}

	return out.map((v) => v.join(' '));
};

export const photofunia = (url, file, texts) =>
	new Promise(async (resolve, reject) => {
		try {
			const init = await axios({
				url,
				method: 'GET',
			});
			let $ = cheerioLOAD(init.data);
			const isRequiredImage = $('div.image-picker-wrap > div.button-container > button.button.gray.js-choose-photo').text();
			const prompts = $('div.prompts');
			const howManyTexts = prompts.find('div.text').get().length;

			texts = split(texts, howManyTexts);
			const effects = {};

			prompts.find('div.imagelist').each((i, element) => {
				const className = $(element).find('input[type="hidden"]').attr('name');

				effects[className] = $(element).find('input[type="hidden"]').attr('value');
			});

			if (isRequiredImage && !file) {
				return resolve({ error: 'Need File for this model.' });
			}

			let form = new FormData();
			let { data } = await axios({
				url: 'https://photofunia.com/images?server=1',
				method: 'GET',
				params: { server: 1 },
			});

			if (isRequiredImage) {
				form.append('image', fs.createReadStream(file));
				data = (
					await axios({
						url: 'https://photofunia.com/images?server=1',
						method: 'POST',
						params: { server: 1 },
						data: form,
						headers: {
							...form.getHeaders(),
							Cookie: `PHPSESSID=${data.response.sid}; accept_cookie=true`,
							'X-Requested-With': 'XMLHttpRequest',
						},
					})
				).data;
			}

			form = new FormData();

			if (isRequiredImage) {
				form.append('image', data.response.key);
			}

			form.append('current-category', 'all_effects');
			let i = 0;

			while (i < howManyTexts) {
				form.append(`text${i === 0 ? '' : i}`, texts[i] ?? texts[i - 1]);
				i++;
			}

			for (const key in effects) {
				form.append(key, effects[key]);
			}

			const tempCookie = data.response.sid;

			data = await axios({
				url,
				method: 'POST',
				params: { server: 1 },
				data: form,
				headers: {
					...form.getHeaders(),
					Cookie: `PHPSESSID=${data.response.sid}; accept_cookie=true`,
					'X-Requested-With': 'XMLHttpRequest',
				},
			});

			if (data.data.trimStart().includes('Fatal error')) {
				return resolve({ error: `Error From Photofunia ${data.data}` });
			}

			const { path } = data.request;

			data = (
				await axios({
					url: _apiBase(path),
					method: 'GET',
					headers: {
						Cookie: `PHPSESSID=${tempCookie}; accept_cookie=true`,
					},
				})
			).data;
			$ = cheerioLOAD(data);
			const resultUrl = $('div.image.p402_hide > #result-image').attr('src');

			resolve(resultUrl);
		} catch (err) {
			reject(err);
		}
	});
