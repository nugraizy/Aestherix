import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';

import { cheerioLOAD, delay, randomize } from '../modules/index.js';

const _apiBase = (page) => `https://textpro.me/home-p${page}`;
const createUrl = () => 'https://textpro.me/effect/create-image';
const NO_VAL = (v) => v === '' || v === undefined || v === null || v === false;

const parseUrlDownload = ({ image_code: imageCode, session_id: sessionId, code, image }) => ({
	preview: `https://textpro.me${image}`,
	dl: `https://textpro.me/save-images/${imageCode}/${sessionId}/${code}`
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

export const textpro = (api, texts) =>
	new Promise(async (resolve, reject) => {
		try {
			let form = new FormData();
			let { data, headers } = await axios.get(api);
			let $ = cheerioLOAD(data);
			let token = $('input[name="token"]').attr('value');
			const howManyText = $('li.item-content').get().length;
			const cookie = headers['set-cookie'][0].split(';')[0];
			const textsParsedByLength = split(texts, howManyText);

			for (const text of textsParsedByLength) {
				form.append('text[]', text);
			}

			let tokenStyle = '';

			tokenStyle = randomize(
				$('input[name="radio0[radio]"]')
					.map((i, el) => $(el).attr('value'))
					.get()
			);

			if (tokenStyle) {
				form.append('radio0[radio]', tokenStyle);
			}

			form.append('submit', 'Go');
			form.append('token', token);
			form.append('build_server', 'https://textpro.me');
			form.append('build_server_id', 1);
			data = (
				await axios.post(api, form, {
					headers: {
						Cookie: cookie,
						...form.getHeaders()
					}
				})
			).data;
			$ = cheerioLOAD(data);
			const jsonDataRaw = $('div#form_value.sr-only').text();

			if (NO_VAL(jsonDataRaw)) {
				return resolve({ error: 'Process Failed. Reason : No Token found at the last step.' });
			}

			const jsonData = JSON.parse(JSON.parse(JSON.stringify(`${$('div#form_value.sr-only').text().split('}{')[0]}}`)));

			token = jsonData['token'];
			form = null;
			form = new FormData();
			form.append('id', jsonData['id']);

			for (const text of textsParsedByLength) {
				form.append('text[]', text);
			}

			form.append('submit', 'Go');
			form.append('token', token);

			if (tokenStyle) {
				form.append('radio0[radio]', tokenStyle);
			}

			form.append('build_server', 'https://textpro.me');
			form.append('build_server_id', 1);
			data = (
				await axios.post(createUrl(), form, {
					headers: {
						Cookie: cookie,
						...form.getHeaders()
					}
				})
			).data;
			resolve(parseUrlDownload(data));
		} catch (err) {
			reject(err);
		}
	});

export const scrapeUrl = async (page) => {
	if (!fs.existsSync('./databases/textmaker/textprourl.json')) {
		fs.writeFileSync('./databases/textmaker/textprourl.json', JSON.stringify([]));
	}

	const dataJSON = JSON.parse(fs.readFileSync('./databases/textmaker/textprourl.json'));

	if (page === 13) {
		return console.log("scraping is done. saved in './textprourl.json' total page scraped :", page); /* eslint-disable-line */
	}

	console.log('scraping page', page);
	const { data } = await axios.get(_apiBase(page));
	const $ = cheerioLOAD(data);
	let container = [];

	$('div.col-md-12 > div.row')
		.find('div.col-md-4.col-sm-6')
		.each((i, e) => {
			const url = `https://textpro.me/${$(e).find('a').attr('href')}`;
			const name = url
				.replace('https://textpro.me/', '')
				.replace(/-/g, ' ')
				.replace(/[^a-zA-Z0-9\s]/g, '')
				.replace(
					/([0-9](d|D)?|create|a |style|(text|effect(s)?)|artistic|write on|cool|on the|realistic( on the)?|html|online|for|free|logo|status and quote with your photos|creation)/gi,
					''
				)
				.replace(/ +(?= )/g, '')
				.trimStart()
				.trimEnd();

			dataJSON.push({ effectName: name, url });
			container.push({ effectName: name, url });
			fs.writeFileSync('./databases/textmaker/textprourl.json', JSON.stringify(dataJSON, undefined, 2));
		});
	console.log(
		'page ',
		page,
		'scraped. result :\n' + container.map((v) => `effect name : ${v.effectName} url : ${v.url}`).join('\n')
	);
	container = [];

	if (page != 13) {
		page++;
	}

	// import delay from baileys
	await delay(2000);
	await scrapeUrl(page);
};
