import dayjs from 'dayjs';
import Tesseract from 'tesseract.js';

import { cheerioLOAD, color, fetchTEXT, INFOLOG, unlinkFile } from '../../helper/modules/index.js';

export const tesseract = async (image, sender, lang = 'ind') =>
	new Promise(async (resolve, reject) => {
		try {
			if (lang === '') {
				lang = 'ind';
			}

			const time = dayjs().format('HH:mm:ss DD/MM');
			const languages = [];
			const $ = cheerioLOAD(
				await fetchTEXT('https://github.com/tesseract-ocr/tessdoc/blob/main/Data-Files-in-different-versions.md'),
			);

			$('#readme > article > table:nth-child(2) > tbody > tr').each(function () {
				if ($(this).find('td:nth-child(1)').text() === '') {
					return;
				}

				languages.push({
					code: $(this).find('td:nth-child(1)').text(),
					name: $(this).find('td:nth-child(2)').text(),
				});
			});

			if (!languages.some((l) => l.code.toLowerCase() === lang.toLowerCase())) {
				unlinkFile(image);
				INFOLOG(`[${color(time, 'cyan')}]`, `${color(`Language ${lang} is not supported`, 'red')}`);
				resolve({ error: `Language ${lang} not found`, languages });
				return;
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Recognizing the image..', '#01cdfe')} to ${color(sender, '#ff71ce')}`);
			let {
				data: { text, confidence, paragraphs },
			} = await Tesseract.recognize(image, lang);

			unlinkFile(image);
			resolve({ result: { text, confidence, paragraphs: paragraphs.map((v) => v.text), languages } });
		} catch (err) {
			unlinkFile(image);
			reject(err);
		}
	});
