import AsyncRetry from 'async-retry';
import axios from 'axios';
import { fetch } from 'undici';

import { LANGUAGES, VOICES, _apiTiktok, _apiUberduck } from './util.js';

const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';
const MAX_CHARS = 200;

function splitText(text, limit = MAX_CHARS) {
	const chunks = [];
	let remaining = text;

	while (remaining.length > limit) {
		let splitAt = remaining.lastIndexOf(' ', limit);

		if (splitAt === -1) {
			splitAt = limit;
		}

		chunks.push(remaining.slice(0, splitAt));
		remaining = remaining.slice(splitAt).trimStart();
	}

	if (remaining.length) {
		chunks.push(remaining);
	}

	return chunks;
}

async function fetchGoogleTTS(text, lang) {
	const chunks = splitText(text);
	const buffers = [];

	for (let i = 0; i < chunks.length; i++) {
		const params = new URLSearchParams({
			ie: 'UTF-8',
			client: 'tw-ob',
			tl: lang,
			q: chunks[i],
			idx: String(i),
			total: String(chunks.length),
			textlen: String(chunks[i].length)
		});

		const response = await fetch(`${GOOGLE_TTS_BASE}?${params}`, {
			headers: { 'User-Agent': 'Mozilla/5.0' }
		});

		if (!response.ok) {
			throw new Error(`Google TTS returned ${response.status}`);
		}

		buffers.push(Buffer.from(await response.arrayBuffer()));
	}

	return Buffer.concat(buffers);
}

/**
 * Convert texts to speech
 * @param {string} text
 * @param {string} language
 * @returns {Promise<{buffer: Buffer}>}
 * @throws {{name: string, message: string}}
 */
export const textToSpeech = async (text, language) => {
	if (!LANGUAGES[language]) {
		throw { name: 'lang not found', message: LANGUAGES };
	}

	const audioBuffer = await fetchGoogleTTS(text, language);

	return { buffer: audioBuffer };
};

/**
 * Convert texts to speech using A.I
 * @param {string} text
 * @param {string} voice voices over by someone
 * @returns {Promise<{url: string} & {error?: string}>}
 * @throws {Error}
 */
export const gttsAI = (text, uuid) =>
	new Promise(async (resolve, reject) => {
		try {
			const basicAuth = `Basic ${
				process.env.UBERDUCK_BASIC.split('\n')[Math.floor(Math.random() * process.env.UBERDUCK_BASIC.split('\n').length)]
			}`;

			const container = await (
				await fetch(_apiUberduck, {
					method: 'POST',
					body: JSON.stringify({ speech: text, voicemodel_uuid: uuid }),  
					headers: {
						accept: 'application/json',
						authorization: basicAuth,
						'content-type': 'application/json'
					}
				})
			).json();

			let result = {};

			try {
				result = await AsyncRetry(
					async () => {
						const { data } = await axios.get(`https://api.uberduck.ai/speak-status?uuid=${container.uuid}`, {
							headers: {
								accept: 'application/json',
								authorization: basicAuth
							}
						});

						if (!data.path) {
							throw Error();
						}

						return data;
					},
					{
						retries: 10,
						factor: 1
					}
				);
			} catch {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			if (!result.failed_at && !result.finished_at) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			resolve({ url: result.path });
		} catch (error) {
			reject(error);
		}
	});

/**
 * Convert texts to speech using A.I
 * @param {string} text
 * @param {string} voice voices over by someone
 * @returns {Promise<{buffer: Buffer, message}>}
 * @throws {Error}
 */
export const gttsTikTok = (text, voice) =>
	new Promise(async (resolve, reject) => {
		try {
			const container = {};

			if (['DISNEY', 'ENGLISH', 'EUROPE', 'AMERICA', 'ASIA', 'SINGING', 'OTHER'].includes(voice.toUpperCase())) {
				const container = VOICES[voice.toUpperCase()];

				voice = Object.keys(container);
				voice = container[voice[~~(Math.random() * voice.length)]];
			} else {
				const _check = Object.keys(VOICES)
					.map((key) => VOICES[key])
					.find((v) => Object.keys(v).includes(voice));

				if (!_check) {
					container.message = `Voice ${voice} not found!\nFallback to voice Indonesia`;
				}

				voice = _check[voice];
			}

			text = text
				.replace(/#/g, 'hashtag')
				.replace(/@/g, 'at')
				.replace(/&/g, 'and')
				.replace(/%/g, 'percent')
				.replace(/_/g, 'underscore')
				.replace(/\+/g, 'plus');

			const { data } = await axios({
				url: _apiTiktok(text, voice),
				method: 'POST',
				headers: {
					Cookie: 'sessionid=cc11cb1a8f38fd855aad30660349dd8a',
					'Content-Type': 'application/json'
				}
			});

			if (!data.data?.v_str) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			const {
				data: { v_str: strBuffer }
			} = data;

			const buffer = Buffer.from(strBuffer, 'base64');

			resolve({
				buffer,
				message: container?.message
			});
		} catch (error) {
			reject(error);
		}
	});
