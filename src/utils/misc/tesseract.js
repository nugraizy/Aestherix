import Tesseract from 'tesseract.js';
import fs from 'fs-extra';

import { cheerioLOAD, color, fetchJSON, loggers } from '../modules/index.js';

let LANGUAGES;

export const tesseract = async (image, sender, lang = 'ind') =>
	new Promise(async (resolve, reject) => {
		try {
			if (lang === '') {
				lang = 'ind';
			}

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
				loggers.error(`${color(`Language ${lang} is not supported`, '#FF5555')}`);
				resolve({ error: `Language ${lang} not found`, languages });
				return;
			}

			loggers.warning(`${color('Recognizing the image..', '#FF99C8')} to ${color(sender, '#E4C1F9')}`);
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
