import { generateDeviceID, generateGPTToken, ROLES } from './util.js';
import { fetchJSON } from '../modules/index.js';

const url = 'https://chatgpt.vulcanlabs.co/api/v3';

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
	_request(path, method = 'GET', data = null) {
		return fetchJSON(url + path, {
			method,
			headers: {
				Authorization: `Bearer ${generateGPTToken()}`,
				'Content-Type': 'application/json; charset=utf-8',
				'User-Agent': 'Chat GPT Android 3.0.2 373 Android SDK: 30 (11)'
			},
			body: JSON.stringify(data)
		});
	}

	/**
	 * Send message to chatgpt api
	 * @param {string} text
	 * @returns {Promise<{ message: string, error: boolean }>
	 */
	sendMessage(text) {
		return new Promise(async (resolve, reject) => {
			try {
				if (text) {
					this._postData.messages.push({
						role: 'user',
						content: text
					});
				}

				const data = await this._request('/chat', 'POST', this._postData);

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
				reject(reject);
			}
		});
	}
}
