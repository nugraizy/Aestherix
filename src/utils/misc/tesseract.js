import Tesseract from 'tesseract.js';
import fs from 'fs-extra';

import { color, loggers } from '../modules/index.js';

let LANGUAGES;

const TESSDATA_URL = 'https://raw.githubusercontent.com/tesseract-ocr/tessdoc/main/Data-Files-in-different-versions.md';

function parseLanguageTable(markdown) {
	const languages = [];
	const lines = markdown.split('\n');
	let inTable = false;

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed.startsWith('|')) {
			if (inTable) {
				break;
			}

			continue;
		}

		const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);

		if (cells.length < 2) {
			continue;
		}

		if (/langcode/i.test(cells[0]) || /language/i.test(cells[1])) {
			inTable = true;

			continue;
		}

		if (!inTable) {
			continue;
		}

		if (/^[-:]+$/.test(cells[0])) {
			continue;
		}

		const code = cells[0];
		const name = cells[1];

		if (code && name && !/^\d/.test(code)) {
			languages.push({ code, name });
		}
	}

	return languages;
}

export const tesseract = async (image, sender, lang = 'ind') =>
	new Promise(async (resolve, reject) => {
		try {
			if (lang === '') {
				lang = 'ind';
			}

			if (!LANGUAGES) {
				if (await fs.exists('./tmp/tesseract_lang.json')) {
					LANGUAGES = await fs.readJSON('./tmp/tesseract_lang.json');
				} else {
					const response = await fetch(TESSDATA_URL, { signal: AbortSignal.timeout(15000) });

					if (!response.ok) {
						throw new Error(`Failed to fetch tessdata: ${response.status}`);
					}

					const markdown = await response.text();

					LANGUAGES = parseLanguageTable(markdown);
					await fs.writeFile('./tmp/tesseract_lang.json', JSON.stringify(LANGUAGES));
				}
			}

			const languages = LANGUAGES;

			if (!languages.some((l) => l.code.toLowerCase() === lang.toLowerCase())) {
				await fs.unlink(image);
				loggers.error(`${color(`Language ${lang} is not supported`, 'red')}`);
				resolve({ error: `Language ${lang} not found`, languages });
				return;
			}

			loggers.warning(`${color('Recognizing the image..', 'pink')} to ${color(sender, 'lilac')}`);
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
