import Text2Speech from 'node-gtts';
import axios from 'axios';
import fetch from 'node-fetch';
import AsyncRetry from 'async-retry';

import { toOpus } from '../index.js';

const caches = new Map();

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

/**
 * Convert texts to speech
 * @param {string} text
 * @param {string} language
 * @param {string} filename output file.
 * @returns {Promise<{buffer: Buffer}>}
 * @throws {{name: string, message: string}}
 */
export const textToSpeech = (text, language, filename) =>
	new Promise((resolve, reject) => {
		let gtts;

		try {
			gtts = Text2Speech(language);
		} catch (/** @type {{name: string, message: string}} */ e) {
			reject({ name: 'lang not found', message: LANGUAGES });
			return;
		}
		gtts.save(`${filename}.opus`, text, async (err) => {
			if (err) {
				/** @type {{name: string, message: string}} */
				reject({ message: 'error while converting text to speech', name: err });
				return;
			}

			const buffer = await toOpus('opus', { input: `${filename}`, output: `${filename}-done` });

			resolve({ buffer });
		});
	});

/**
 * Convert texts to speech using A.I
 * @param {string} text
 * @param {string} voice voices over by someone
 * @returns {Promise<{url: string} & {error?: string}>}
 * @throws {Error}
 */
export const gttsAI = (text, voice) =>
	new Promise(async (resolve, reject) => {
		try {
			if (caches.has(text + voice)) {
				resolve(caches.get(text + voice));
			}

			const basicAuth = `Basic ${
				process.env.UBERDUCK_BASIC.split('\n')[Math.floor(Math.random() * process.env.UBERDUCK_BASIC.split('\n').length)]
			}`;

			const container = await (
				await fetch('https://api.uberduck.ai/speak', {
					method: 'POST',
					body: JSON.stringify({ speech: text, voice }),
					headers: {
						accept: 'application/json',
						authorization: basicAuth,
						'content-type': 'application/json',
					},
				})
			).json();

			let result = {};

			try {
				result = await AsyncRetry(
					async () => {
						const { data } = await axios.get(`https://api.uberduck.ai/speak-status?uuid=${container.uuid}`, {
							headers: {
								accept: 'application/json',
								authorization: basicAuth,
							},
						});

						if (!data.path) {
							throw Error();
						}

						return data;
					},
					{
						retries: 10,
						factor: 1,
					},
				);
			} catch (error) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			if (!result.failed_at && !result.finished_at) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			caches.set(text + voice, { url: result.path });

			resolve({ url: result.path });
		} catch (error) {
			reject(error);
		}
	});
