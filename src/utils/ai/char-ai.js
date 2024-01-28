import axios from 'axios';
import querystring from 'node:querystring';

import { generateDeviceID, generateGPTToken, ROLES } from './util.js';
import { fetchJSON } from '../modules/index.js';

const url = 'https://chatgpt.vulcanlabs.co/api';

export class ChatGPTDialogue {
	constructor(data) {
		/**
		 * @private
		 */
		this._user = generateDeviceID();

		/**
		 * @private
		 */
		this._messages = [
			{
				role: 'assistant',
				content: ROLES(data).join(', ')
			}
		];

		/**
		 * @private
		 */
		this._postData = {
			model: 'gpt-4',
			user: this._user,
			nsfw_check: false /* eslint-disable-line */,
			messages: this._messages
		};
	}

	/**
	 * Send request to chatgpt api
	 * @private
	 * @param {string} path
	 * @param {string} method
	 * @param {any} data
	 * @returns
	 */
	_request = {
		axios: (path, method = 'GET', data = null, headers = {}, newUrl = null) => {
			try {
				return axios({
					url: path ? url + path : newUrl,
					method,
					headers,
					data
				});
			} catch (error) {
				console.log(error);
			}
		},
		fetch: (path, method = 'GET', data = null, headers = {}, newUrl = null) => {
			try {
				return fetchJSON(path ? url + path : newUrl, {
					method,
					headers,
					body: data
				});
			} catch (error) {
				console.log(error);
			}
		}
	};

	/**
	 * Send message to chatgpt api
	 * @param {string} content
	 * @returns {Promise<{ message: string, error: boolean }>
	 */
	sendMessage(content) {
		return new Promise(async (resolve, reject) => {
			try {
				const re = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

				check: {
					if (Buffer.isBuffer(content)) {
						const scanImage = await this.processImage(content);
						this._postData.messages.push({
							role: 'system',
							content: `Beritahu user bahwa kamu telah mendeteksi gambar yang user berikan dan gambar itu adalah "${scanImage}" (Jelaskan dalam singkat mengenai foto tersebut menggunakan bahasa indonesia.)`
						});

						break check;
					}

					const isUrl = content.match(re);

					if (typeof content === 'string' && isUrl) {
						const contentType = await fetch(isUrl[0]).then((res) => res.headers.get('content-type'));

						if (!contentType?.startsWith('image')) {
							this._postData.messages.push({
								role: 'assistant',
								content: 'Tidak bisa membuka link selain link yang berisi gambar'
							});
						}
					}

					if (content) {
						this._postData.messages.push({
							role: 'user',
							content: content
						});
					}
				}

				const data = await this._request.fetch('/v3/chat', 'POST', JSON.stringify(this._postData), {
					Authorization: `Bearer ${generateGPTToken()}`,
					'User-Agent': 'Chat GPT Android 3.0.2 373 Android SDK: 30 (11)',
					'Content-Type': 'application/json; charset=utf-8'
				});

				if (data.error) {
					if (data.error.code === 'context_length_exceeded') {
						this._postData.messages = [
							{
								role: 'assistant',
								content: ROLES.join(', ')
							}
						];
						resolve({
							message:
								'Sesi chat kamu dengan Rias telah melampaui batas! Rias akan melakukan cloning diri untuk melayani master! Sebentar ya :3',
							error: true
						});
					}
				}

				this._postData.messages.push({
					role: 'assistant',
					content: data.choices[0].Message.content
				});

				resolve({ message: data.choices[0].Message.content, error: false });
			} catch (error) {
				reject(error);
			}
		});
	}

	async assignFile() {
		const payload = {
			file_name: `aestherix_${Date.now()}`
		};
		const { data } = await this._request.axios('/v1/signed_url', 'POST', payload, {
			Authorization: `Bearer ${generateGPTToken()}`
		});

		const file_id = data.file_id;
		const signed_url = data.signed_url;

		return {
			file_id,
			signed_url
		};
	}

	async processImage(buffer) {
		const { file_id: fileId, signed_url: signedUrl } = await this.assignFile();

		const data = await this._request.axios(
			null,
			'PUT',
			buffer,
			{
				'Content-Type': 'application/octet-stream'
			},
			signedUrl
		);

		if (data.status === 200) {
			const {
				data: { result }
			} = await this._request.axios(
				'/v1/vqa',
				'POST',
				querystring.stringify({
					file_id: fileId
				}),
				{ Authorization: `Bearer ${generateGPTToken()}` }
			);

			return result;
		}
	}
}
