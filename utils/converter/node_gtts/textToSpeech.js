import Text2Speech from 'node-gtts';

import { toOpus } from '../index.js';

const LANGUAGES = {
	af: 'Afrikaans',
	sq: 'Albanian',
	ar: 'Arabic',
	hy: 'Armenian',
	ca: 'Catalan',
	zh: 'Chinese',
	'zh-cn': 'Chinese (Mandarin/China)',
	'zh-tw': 'Chinese (Mandarin/Taiwan)',
	'zh-yue': 'Chinese (Cantonese)',
	hr: 'Croatian',
	cs: 'Czech',
	da: 'Danish',
	nl: 'Dutch',
	en: 'English',
	'en-au': 'English (Australia)',
	'en-uk': 'English (United Kingdom)',
	'en-us': 'English (United States)',
	eo: 'Esperanto',
	fi: 'Finnish',
	fr: 'French',
	de: 'German',
	el: 'Greek',
	ht: 'Haitian Creole',
	hi: 'Hindi',
	hu: 'Hungarian',
	is: 'Icelandic',
	id: 'Indonesian',
	it: 'Italian',
	ja: 'Japanese',
	ko: 'Korean',
	la: 'Latin',
	lv: 'Latvian',
	mk: 'Macedonian',
	no: 'Norwegian',
	pl: 'Polish',
	pt: 'Portuguese',
	'pt-br': 'Portuguese (Brazil)',
	ro: 'Romanian',
	ru: 'Russian',
	sr: 'Serbian',
	sk: 'Slovak',
	es: 'Spanish',
	'es-es': 'Spanish (Spain)',
	'es-us': 'Spanish (United States)',
	sw: 'Swahili',
	sv: 'Swedish',
	ta: 'Tamil',
	th: 'Thai',
	tr: 'Turkish',
	vi: 'Vietnamese',
	cy: 'Welsh',
};

export const textToSpeech = (text, language, filename) =>
	new Promise((resolve, reject) => {
		let gtts;

		try {
			gtts = Text2Speech(language);
		} catch (e) {
			reject({ name: 'lang not found', message: LANGUAGES });
			return;
		}
		gtts.save(`${filename}.opus`, text, async (err) => {
			if (err) {
				reject({ message: 'error while converting text to speech', name: err });
				return;
			}

			const buffer = await toOpus('opus', { input: `${filename}`, output: `${filename}-done` });

			resolve({ buffer });
		});
	});
