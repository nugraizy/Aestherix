import dayjs from 'dayjs';
import Tesseract from 'tesseract.js';
import fs from 'fs-extra';

import { cheerioLOAD, color, fetchJSON, INFOLOG } from '../modules/index.js';

let LANGUAGES;

export const tesseract = async (image, sender, lang = 'ind') =>
	new Promise(async (resolve, reject) => {
		try {
			if (lang === '') {
				lang = 'ind';
			}

			const time = dayjs().format('HH:mm:ss DD/MM');
			const languages = [];

			if (!(await fs.exists('./src/media/temporary_files/tesseract_lang.json'))) {
				LANGUAGES = await fetchJSON('https://github.com/tesseract-ocr/tessdoc/blob/main/Data-Files-in-different-versions.md');
				await fs.writeFile('./src/media/temporary_files/tesseract_lang.json', JSON.stringify(LANGUAGES));
			} else if (!LANGUAGES) {
				LANGUAGES = await fs.readJSON('./src/media/temporary_files/tesseract_lang.json');
			}

			const $ = cheerioLOAD(LANGUAGES.payload.blob.richText);

			$('article > table > tbody > tr').each(function () {
				const code = $(this).find('td:nth-child(1)').text();

				if (code === '') {
					return;
				}

				languages.push({
					code,
					name: $(this).find('td:nth-child(2)').text()
				});
			});

			if (!languages.some((l) => l.code.toLowerCase() === lang.toLowerCase())) {
				await fs.unlink(image);
				INFOLOG(`[${color(time, 'cyan')}]`, `${color(`Language ${lang} is not supported`, 'red')}`);
				resolve({ error: `Language ${lang} not found`, languages });
				return;
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Recognizing the image..', '#01cdfe')} to ${color(sender, '#ff71ce')}`);
			let {
				data: { text, confidence, paragraphs }
			} = await Tesseract.recognize(image, lang);

			await fs.unlink(image);
			resolve({ result: { text, confidence, paragraphs: paragraphs.map((v) => v.text), languages } });
		} catch (err) {
			await fs.unlink(image);
			reject(err);
		}
	});
