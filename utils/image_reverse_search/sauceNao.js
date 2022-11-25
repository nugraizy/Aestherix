import FormData from 'form-data';

import { createReadStream } from 'fs';
import { cheerioLOAD, fetchTEXT, isURL } from '../../helper/modules/index.js';

const _api = (input) => `https://saucenao.com/search.php${input ? input : ''}`;
const _apiRequest = (input) => _api(`?url=${input}`);

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

export const sauceNao = async (file) =>
	new Promise(async (resolve) => {
		try {
			let data = null;

			if (!isURL(file)) {
				const form = new FormData();

				form.append('file', createReadStream(file));
				const response = await new Promise((resolve, reject) => {
					form.submit(_api(), (err, res) => {
						if (err) {
							reject(err);
						} else {
							resolve(res);
						}
					});
				});

				response.setEncoding('utf-8');
				data = '';
				response.on('data', (v) => (data += v));
				await new Promise((r) => response.on('end', r));
			} else if (isURL(file) && !(await isValidImageURL(file))) {
				return resolve({ error: 'Invalid image URL' });
			}

			data = data ?? (await fetchTEXT(_apiRequest(file)));
			const $ = cheerioLOAD(data);
			const result = $('#middle > div:nth-child(2)');
			const results = {
				title: result.find('div.resulttitle > strong').text(),
				description: result.find('div.resulttitle').text(),
				similarity: Number(result.find('div.resultmatchinfo > div.resultsimilarityinfo').text().replace('%', '')),
				MAL: result.find('div.resultmatchinfo > div.resultmiscinfo > a:nth-child(4)').attr('href'),
			};

			if (!results.MAL) {
				delete results.MAL;
			}

			resolve(results);
		} catch (error) {
			resolve({ error: error.message });
		}
	});
