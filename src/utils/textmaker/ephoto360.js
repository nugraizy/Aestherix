import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

import { cheerioLOAD } from '../modules/index.js';

const _apiBase = 'https://en.ephoto360.com';
const _apiBaseUrl = (input) => _apiBase + input;
const isNoVal = (v) => v === '' || v === undefined || v === null || v === false;

/**
 * @param {{image_code: string, session_id: string, image: string}} param0
 * @typedef {{preview: string, dl: string}} ImageContainer
 * @returns {ImageContainer}
 */
const parseUrlDownload = ({ image_code: imageCode, session_id: sessionId, image }) => ({
	preview: `https://e1.yotools.net${image}`,
	dl: `https://e1.yotools.net/save-images/${imageCode}/${sessionId}`
});

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

/**
 * Scrape ephoto360.
 * @param {string} api
 * @param {string} texts
 * @param {string} path
 * @returns {Promise<ImageContainer & {error?: string}>}
 * @throws {Error}
 */
export const ephoto360 = async (api, texts, path) =>
	new Promise(async (resolve, reject) => {
		try {
			const tmpBuffer = path;

			if (path) {
				path = fs.createReadStream(path);
			}

			let { data, headers } = await axios.get(api, {
				headers: {
					'user-agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36'
				}
			});
			let $ = cheerioLOAD(data);
			const token = $('input[name="token"]').attr('value');
			const cookie = headers['set-cookie'][0].split(';')[0];
			const isNeedImageBuffer =
				$('li.item-content > span.file-input-wrapper > span.btn.btn-primary.choose_file_button').text().trim() ==
				'Select Photo';

			if (isNeedImageBuffer && !path) {
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
				formData.append('file', path);
				const { data: payloadImages } = await axios.post('https://e1.yotools.net/upload', formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36'
					}
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
						thumb_width: 400
					})
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
				await axios.post(api, formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36'
					}
				})
			).data;
			$ = cheerioLOAD(data);
			const jsonDataRaw = $('input[name="form_value_input"]').attr('value');

			if (isNoVal(jsonDataRaw)) {
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
				await axios.post(_apiBaseUrl('/effect/create-image'), formData, {
					headers: {
						Cookie: cookie,
						...formData.getHeaders(),
						'user-agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36'
					}
				})
			).data;

			if (path) {
				fs.unlinkSync(tmpBuffer);
			}

			resolve(parseUrlDownload(data));
		} catch (err) {
			reject(err);
		}
	});

const container = [];

export const scrapePages = async (page) => {
	const { data } = await axios.get(`${_apiBase}/home-p${page}`, {
		headers: {
			'user-agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36'
		}
	});
	const $ = cheerioLOAD(data);

	$('div.row > div.col-md-4').each((i, el) => {
		const $el = $(el);
		const url = $el.find('a').attr('href');

		if (url.endsWith('.html')) {
			const effectName = $el.find('a > div.title-effect-home').text();

			container.push({ url: _apiBaseUrl(url), effectName });
		}
	});

	if (page === 39) {
		return fs.writeFileSync('./databases/textmaker/ephoto360url.json', JSON.stringify(container, undefined, 2));
	}

	await scrapePages(page + 1);
};
