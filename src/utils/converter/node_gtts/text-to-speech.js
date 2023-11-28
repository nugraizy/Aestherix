import Text2Speech from 'node-gtts';
import axios from 'axios';
import fetch from 'node-fetch';
import AsyncRetry from 'async-retry';

import { toOpus } from '../index.js';
import { LANGUAGES, VOICES, _apiTiktok, _apiUberduck, caches } from './util.js';

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
export const gttsAI = (text, uuid) =>
	new Promise(async (resolve, reject) => {
		try {
			if (caches.uberduck.has(text + uuid)) {
				resolve(caches.get(text + uuid));
			}

			const basicAuth = `Basic ${
				process.env.UBERDUCK_BASIC.split('\n')[Math.floor(Math.random() * process.env.UBERDUCK_BASIC.split('\n').length)]
			}`;

			const container = await (
				await fetch(_apiUberduck, {
					method: 'POST',
					body: JSON.stringify({ speech: text, voicemodel_uuid: uuid }), // eslint-disable-line
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
			} catch (error) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			if (!result.failed_at && !result.finished_at) {
				resolve({ error: 'Could not process the request. Try again later.' });
			}

			caches.uberduck.set(text + uuid, { url: result.path });

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

			if (caches.tiktok.has(text + voice)) {
				resolve(caches.tiktok.get(text + voice));
			}

			const { data } = await axios({
				url: _apiTiktok(text, voice),
				method: 'POST',
				headers: {
					Cookie:
						'tt_csrf_token=85P3IjRf-iBzsXGJEAPwXUMoocg8k9e5bvnQ; tt_chain_token=WgUfs/iKzJO3NhQtTAWzgg==; __tea_cache_tokens_1988={%22_type_%22:%22default%22%2C%22user_unique_id%22:%227279426732095800834%22%2C%22timestamp%22:1694873659065}; tiktok_webapp_theme=light; msToken=HisMBbwZxtC-T8q2-KlD-LRxwhY7XgWuogQNzTEjNEYxd0d7PARGqzQZHTwWVTJ8UNJ7J4J5aarmksAPsn3O4rPdrtpPTjMU_N8_JuiJzCwOsjOUD1ntuiI9HF9b; passport_csrf_token=59d4754e205f234a65485d695ee43b65; passport_csrf_token_default=59d4754e205f234a65485d695ee43b65; s_v_web_id=verify_lmm42z6m_0L1z1e4x_AkQv_4LxZ_8TPw_oa5ljr5hlU9L; multi_sids=6799533634086487042%3A0c3260eb9d2fccab8b81a159651285cd; cmpl_token=AgQQAPPdF-RO0o5iJXcaOR07_2QhONiSv4ArYMyfrA; passport_auth_status=27a542eafc7ac7a25f11856183139128%2C; passport_auth_status_ss=27a542eafc7ac7a25f11856183139128%2C; sid_guard=0c3260eb9d2fccab8b81a159651285cd%7C1694873788%7C15551999%7CThu%2C+14-Mar-2024+14%3A16%3A27+GMT; uid_tt=ef7c53fbeee0ed315a403c0c2cb0a1a95e9150b452fcaae05e77a79baaeba620; uid_tt_ss=ef7c53fbeee0ed315a403c0c2cb0a1a95e9150b452fcaae05e77a79baaeba620; sid_tt=0c3260eb9d2fccab8b81a159651285cd; sessionid=0c3260eb9d2fccab8b81a159651285cd; sessionid_ss=0c3260eb9d2fccab8b81a159651285cd; sid_ucp_v1=1.0.0-KDczNTBlN2YyY2MyMTYwNzY4ZDNjN2ZhYjhlNTI0OTRkYWMxYmIxODEKHwiCiK-Qifqyrl4QvPGWqAYYswsgDDD9mPPyBTgIQBIQAxoGbWFsaXZhIiAwYzMyNjBlYjlkMmZjY2FiOGI4MWExNTk2NTEyODVjZA; ssid_ucp_v1=1.0.0-KDczNTBlN2YyY2MyMTYwNzY4ZDNjN2ZhYjhlNTI0OTRkYWMxYmIxODEKHwiCiK-Qifqyrl4QvPGWqAYYswsgDDD9mPPyBTgIQBIQAxoGbWFsaXZhIiAwYzMyNjBlYjlkMmZjY2FiOGI4MWExNTk2NTEyODVjZA; store-idc=maliva; store-country-code=id; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=tJzBt4PodlGf0Q3w5osJKMYhSKx7KkQJH68RBcNyI-G4j3ukTKeTEY9JK6CwE1O1S8aHznA2zdPgegsvpzndgQzBM22avCZx5j3kzIQpO4_tszZ6rRCDRShUrArkfjp6zexAjHfd_SI5TzUisItxZZhouNrGzyjmh1Y90KsFPl8joUjCCfkXXrVA6Nh-0n5HCGorwWIsxJyKVUhACPX1wSlVtpDmbtTX0P_fnqkjR0WaKURZugUf5Pdh9jAKYFODr3itzCTn_MXhslrcuUhLqcRuFv9i8Dln4PcEX4Cy8jifXBWxDmMH8SRKkxyUIg8cjRzS2ZDxtgYzqAsjjM4GongpeiWU2Ybx7wk8LmV1JQ4mzvlu_PqfZFHYD8BsLvi8ckDuh5aU_G--QsMBm_q3kh5g_l0tEo2vYgvVAW_tQ6PWcBKJZKK-ciku8LccT9Z1YzdV5Rj9ddw5ghUtcAzUNveZLfUJxg7H1WrjVuT_cebc9LY2aaMEEvyu5W3KfFrf; passport_fe_beating_status=true; ttwid=1%7CKOz5eZr3DW6FsI8g6a4TXBlMEDLDhLcOB6kk1-U5gZc%7C1694874869%7Cc4408b90c6c5885460fb37083db48c7932384c62895591456aac6f001aec0598; odin_tt=22aeb24e93106f485e1d2da91f7e8bc0008f6270a12c4b6b65555ddfa9a335da33aa9f8da18f55e107feeefd873ed0e1ba59ed86380318504bb085ed36bfcf99c5bd85f963a05b642dcb003a1c2acc03; msToken=D9eo42IT5vRNAELE3gl8eVHoHjTOrPmFSVPXTsCsw8orz2Sl4MDaJNo4cWR2GH9HpbSQOKTJ282z69QaA5HVwQKGLnmkaZsWuMFPArdpwa4LYdWiVTfQRiNbIa3T',
					'Content-Type': 'application/json'
				}
			});

			const {
				data: { v_str: strBuffer }
			} = data;

			const buffer = Buffer.from(strBuffer, 'base64');

			caches.tiktok.set(text + voice, { buffer, message: container?.message });

			resolve({
				buffer,
				message: container?.message
			});
		} catch (error) {
			reject(error);
		}
	});
