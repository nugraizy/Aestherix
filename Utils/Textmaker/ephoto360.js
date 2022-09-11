import Axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { cheerioLOAD } from '../../Helper/index.js';

const BASE_URL_PAGE = 'https://en.ephoto360.com/home-p';
const BASE_URL = (input) => `https://en.ephoto360.com${input}`;
const CREATE_URL = () => 'https://en.ephoto360.com/effect/create-image';
const NO_VAL = (v) => v == '' || v == undefined || v == null || v == false;

const parseUrlDownload = ({ image_code: imageCode, session_id: sessionId, image }) => {
	return { preview: `https://e1.yotools.net${image}`, dl: `https://e1.yotools.net/save-images/${imageCode}/${sessionId}` };
};

const split = (text, len) => {
	if (len == 1) {
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

export const ephoto360 = async (api, texts, buffer) =>
	new Promise(async (resolve, reject) => {
		try {
			const tmpBuffer = buffer;

			if (buffer) {
				buffer = fs.createReadStream(buffer);
			}

			let { data, headers } = await Axios.get(api, {
				headers: {
					'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
				},
			});
			let $ = cheerioLOAD(data);
			const token = $('input[name="token"]').attr('value');
			const cookie = headers['set-cookie'][0].split(';')[0];
			const isNeedImageBuffer = $('li.item-content > span.file-input-wrapper > span.btn.btn-primary.choose_file_button').text().trim() == 'Select Photo';

			if (isNeedImageBuffer && !buffer) {
				return resolve({ error: 'This Model Need image buffer' });
			}

			let formData = new FormData();
			const howManyText = $('li.item-content > div.item-inner').find('div.item-input > input.form-control').get().length;
			const style = $('input[name="radio0[radio]"]')
				.map((i, el) => $(el).attr('value'))
				.get()?.[0];

			texts = howManyText !== 0 ? split(texts, howManyText) : 0;

			if (texts.length < howManyText) {
				return resolve({ error: 'Texts is not enough' });
			}

			if (isNeedImageBuffer) {
				formData.append('file', buffer);
				const { data: payloadImages } = await Axios.post('https://e1.yotools.net/upload', formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
					},
				});

				formData = null;
				formData = new FormData();
				formData.append('file_image_input', '');
				formData.append(
					'image[]',
					/* eslint-disable */
					JSON.stringify({
						image: payloadImages.uploaded_file,
						image_thumb: payloadImages.thumb_file,
						icon_file: payloadImages.icon_file,
						x: 29.296551724137963,
						y: 0,
						width: 223.99999999999997,
						height: 223.99999999999997,
						rotate: 0,
						scaleX: 1,
						scaleY: 1,
						thumb_width: 400,
					}),
					/* eslint-enable */
				);
			}

			if (style) {
				formData.append('radio0[radio]', style);
			}

			formData.append('build_server', 'https://e2.yotools.net');
			formData.append('build_server_id', 2);
			formData.append('submit', 'GO');
			formData.append('token', token);

			if (howManyText !== 0) {
				for (const text of texts) {
					formData.append('text[]', text);
				}
			}

			data = (
				await Axios.post(api, formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
					},
				})
			).data;
			$ = cheerioLOAD(data);
			const jsonDataRaw = $('input[name="form_value_input"]').attr('value');

			if (NO_VAL(jsonDataRaw)) {
				return resolve({ error: 'Process Failed. Reason : No Token found at the last step.' });
			}

			const jsonData = JSON.parse(jsonDataRaw);

			formData = null;
			formData = new FormData();

			if (isNeedImageBuffer) {
				formData.append('file_image_input', '');
				formData.append('image[]', jsonData.image[0]);
			}

			if (style) {
				formData.append('radio0[radio]', style);
			}

			formData.append('build_server', 'https://e1.yotools.net');
			formData.append('build_server_id', 2);
			formData.append('id', jsonData.id);
			formData.append('token', jsonData.token);

			if (howManyText !== 0) {
				for (const text of texts) {
					formData.append('text[]', text);
				}
			}

			data = (
				await Axios.post(CREATE_URL(), formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
					},
				})
			).data;

			if (buffer) {
				fs.unlinkSync(tmpBuffer);
			}

			resolve(parseUrlDownload(data));
		} catch (err) {
			reject(err);
		}
	});

const container = [];

export const scrapePages = async (page) => {
	const { data } = await Axios.get(`${BASE_URL_PAGE}${page}`, {
		headers: {
			'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
		},
	});
	const $ = cheerioLOAD(data);

	$('div.row > div.col-md-4').each((i, el) => {
		const $el = $(el);
		const url = $el.find('a').attr('href');

		if (url.endsWith('.html')) {
			const effectName = $el.find('a > div.title-effect-home').text();

			container.push({ url: BASE_URL(url), effectName });
		}
	});

	if (page == 39) {
		return fs.writeFileSync('./Databases/Textmaker/ephoto360url.json', JSON.stringify(container, undefined, 2));
	}

	await scrapePages(page + 1);
};
