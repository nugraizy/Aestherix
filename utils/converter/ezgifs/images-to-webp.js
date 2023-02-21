import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import FormData from 'form-data';

const _api = 'https://s2.ezgif.com/webp-maker';

const imagesToWebp = (images) =>
	new Promise(async (resolve, reject) => {
		try {
			const form = new FormData();

			if (images instanceof 'string') {
				form.append('files[]', fs.createReadStream(images));
			} else if (typeof images === 'object') {
				if (!images.length || images.length === 0) {
					reject(new Error("Images type must be type of 'string' or 'array of strings'"));
				}
				for (const image of images) {
					form.append('files[]', fs.createReadStream(image));
				}
			}

			const { data } = await axios.post(_api, form, {
				headers: {
					...form.getHeaders(),
				},
			});

			let $ = cheerio.load(data);

			const resultId = $('form#make-webp > input').attr('value');
			const resultReferer = `https://ezgif.com/webp-maker/${resultId}`;
			const dataQuery = new URLSearchParams({
				file: resultId,
				dfrom: 1,
				dto: 5,
				delay: 20,
				loop: '',
				'fader-delay': 6,
				'fader-frames': 10,
				nostack: 'on',
				percentage: 65,
			});
			$('ul#animation-frames')
				.find('li.frame')
				.get()
				.forEach((el, i) => {
					const filename = $(el).find('input.filename-holder').attr('value');
					dataQuery.append('files[]', filename);
					dataQuery.append('delays[]', 20);
				});

			const { data: dataFinal } = await axios({
				url: `${resultReferer}?ajax=true`,
				method: 'POST',
				maxBodyLength: Infinity,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				data: dataQuery,
			});

			$ = cheerio.load(dataFinal);
			resolve({ result: `https:${$('p.outfile > img').attr('src')}` });
		} catch (err) {
			reject(err);
		}
	});
