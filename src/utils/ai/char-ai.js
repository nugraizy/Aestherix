import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';

import { color, fetchJSON, loggers } from '../modules/index.js';
import { CHARACTER_ROLES, generateDeviceID } from './util.js';

const url = 'https://api.vulcanlabs.co/smith-v2/api';
const authUrl = 'https://api.vulcanlabs.co/smith-auth/api/v1';

const CONFIG = {
	MAX_IMAGE_WIDTH: 2000,
	MAX_IMAGE_HEIGHT: 2000,
	VULCAN_APPLICATION_ID: 'com.smartwidgetlabs.chatgpt',
	USER_AGENT: 'Chat Smith Android, Version 3.9.9(696)',
	DEVICE_ID: process.env.CHAR_AI_DEVICE_ID || 'C8DC43F3FBE1ADB9',
	X_AUTH_TOKEN:
		process.env.CHAR_AI_AUTH_TOKEN || 'DaiExBn7Ib03PWRtbQu4HQGUEGQKfA8GtrLN1oA8n4nOy9CdRu71OjKBwUZazZQxIgtCVQFCZtoBKgjuLVJpJTenTRjimRkaQUqZwtbXWjckIo3LeXut/Wslmkysgm9G0+lVxx38r0Eifu95+rIk5FMcZrQfZ+ubR0JkItOebU='
};

/**
 * @typedef {object} RoleData
 * @property {string} name
 * @property {string} time
 * @property {string} role
 */

/**
 * @typedef {Object.<string, string[]>} RoleObject
 */

class RoleManager {
	/**
	 * @private
	 */
	_role;

	/**
	 * @param {string} name
	 * @param {string} time
	 */
	constructor(name, time) {
		/**
		 * @private
		 */
		this._role = CHARACTER_ROLES(name, time);
	}

	/**
	 * @returns {string[]}
	 */
	getCharacters() {
		return Object.keys(this._role);
	}

	/**
	 * @param {string} character
	 * @returns {string[]}
	 */
	getRole(character) {
		return this._role[character];
	}
}

class ChatHistoryManager {
	/**
	 * @param {string} user - unique user/device ID
	 * @param {string[]} rolePrompts - the role prompt array for the chosen character
	 * @param {{ mode?: 'character' | 'agent' }} [options]
	 */
	constructor(user, rolePrompts, options = {}) {
		/** @private */
		this._user = user;

		/** @private */
		this._systemMessages =
			options.mode === 'agent'
				? [{ role: 'assistant', content: rolePrompts.join(' ') }]
				: [
						{
							role: 'assistant',
							content: `IMPORTANT NOTES:
- USE A SEPARATOR TO SEPARATE A PHRASE FROM ANOTHER PHRASE, AND NATURAL, SO MESSAGE PARSER CAN PARSE IT AS A SEPARATE PHRASE, SHOW EXCITEMENT, BUT DO NOT OVERDO.. 
- SEPARATOR IS {OTHER_MESSAGE}, SEPARATOR CAN BE MORE THAN 1, BUT CANNOT BE MORE THAN 2. NATURALLY MAKE ONE OR MORE SHORT PHRASE TO EXPRESS YOURSELF. DO NOT USE THIS TOO FREQUENTLY, USE IT WHEN NEEDED.
- USE JAPANESE EMOTICON RATHER THAN DEFAULT EMOJIS. TO EXPRESS EMOTION, OR JUST WHAT THE CONTEXT NEEDED. ALSO KEEP IN MIND TO MATCH THE EMOTICON WITH THE CHARACTER. THIS IS EXTREMELY IMPORTANT!!`
						},
						{
							role: 'assistant',
							content: rolePrompts.join(', ')
						}
					];

		/** @private */
		this._messages = [...this._systemMessages];
	}

	/**
	 * Add a user message to the history
	 * @param {string} content
	 */
	addUserMessage(content) {
		this._messages.push({ role: 'user', content });
	}

	/**
	 * Add an assistant message to the history
	 * @param {string} content
	 */
	addAssistantMessage(content) {
		this._messages.push({ role: 'assistant', content });
	}

	/**
	 * Reset chat history back to system messages only (context overflow recovery)
	 */
	reset() {
		this._messages = [...this._systemMessages];
	}

	/**
	 * Get the full messages array (for API payload)
	 * @returns {Array<{ role: string, content: string }>}
	 */
	getMessages() {
		return this._messages;
	}

	/**
	 * Build the post data payload for the chat API
	 * @returns {object}
	 */
	getPostData() {
		return {
			model: 'gpt-4o',
			user: this._user,
			nsfw_check: false,
			messages: this._messages
		};
	}
}

export class ChatGPTDialogue {
	/**
	 * @param {string} name
	 * @param {string} time
	 * @param {string} character
	 * @param {{ mode?: 'character' | 'agent', rolePrompts?: string[] }} [options]
	 */
	constructor(name, time, character, options = {}) {
		/** @private */
		this._user = generateDeviceID();

		/** @private */
		this._accessToken = null;

		/** @private */
		this._tokenExpiration = 0;

		const mode = options.mode || 'character';

		if (mode === 'agent' && options.rolePrompts) {
			this._roleManager = null;
			this._chatHistory = new ChatHistoryManager(this._user, options.rolePrompts, { mode: 'agent' });
		} else {
			this._roleManager = new RoleManager(name, time);
			this._chatHistory = new ChatHistoryManager(this._user, this._roleManager.getRole(character));
		}
	}

	/**
	 * Get list of characters
	 * @returns {string[]}
	 */
	get getCharacters() {
		return this._roleManager?.getCharacters() ?? [];
	}

	/**
	 * Send request to API
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
					data,
					timeout: 60000
				});
			} catch (error) {
				loggers.error(color('Character AI request failed:', 'red'), error);
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
				loggers.error(color('Character AI request failed:', 'red'), error);
			}
		}
	};

	/**
	 * Get access token from Vulcan auth API
	 * @private
	 * @returns {Promise<[string, number] | null>}
	 */
	async _getTokenArray() {
		try {
			const payload = {
				device_id: CONFIG.DEVICE_ID,
				order_id: '',
				product_id: '',
				purchase_token: '',
				subscription_id: ''
			};

			const { data } = await this._request.axios(
				null,
				'POST',
				payload,
				{
					'X-Vulcan-Application-ID': CONFIG.VULCAN_APPLICATION_ID,
					Accept: 'application/json',
					'User-Agent': CONFIG.USER_AGENT,
					'X-Vulcan-Request-ID': '914948789' + Math.floor(Date.now() / 1000),
					'Content-Type': 'application/json; charset=utf-8'
				},
				`${authUrl}/token`
			);

			if (data) {
				const newAccessToken = data.AccessToken;
				const newExpiration = Math.floor(new Date(data.AccessTokenExpiration).getTime() / 1000);

				return [newAccessToken, newExpiration];
			}

			return null;
		} catch (error) {
			loggers.error(color('Token request failed:', 'red'), error);
			return null;
		}
	}

	/**
	 * Get valid token (refresh if expired)
	 * @private
	 * @returns {Promise<string | null>}
	 */
	async _getValidToken() {
		const currentTime = Math.floor(Date.now() / 1000);

		if (!this._accessToken || currentTime >= this._tokenExpiration) {
			const tokenData = await this._getTokenArray();

			if (tokenData) {
				this._accessToken = tokenData[0];
				this._tokenExpiration = tokenData[1];
			} else {
				return null;
			}
		}

		return this._accessToken;
	}

	/**
	 * Send message to chat API
	 * @param {string} content
	 * @returns {Promise<{ message: string, error: boolean }>}
	 */
	sendMessage(content) {
		return new Promise(async (resolve, reject) => {
			try {
				const token = await this._getValidToken();

				if (!token) {
					resolve({ message: 'Gagal mendapatkan token akses :(', error: true });
					return;
				}

				if (content) {
					this._chatHistory.addUserMessage(content);
				}

				const payload = {
					...this._chatHistory.getPostData(),
					temperature: 1,
					top_p: 1
				};

				const data = await this._request.fetch('/v7/chat_android', 'POST', JSON.stringify(payload), {
					'X-Auth-Token': CONFIG.X_AUTH_TOKEN,
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'User-Agent': CONFIG.USER_AGENT,
					'X-Vulcan-Request-ID': '914948789' + Math.floor(Date.now() / 1000),
					'Content-Type': 'application/json; charset=utf-8'
				});

				if (data.error) {
					if (data.error.code === 'context_length_exceeded') {
						this._chatHistory.reset();
						resolve({
							message:
								'Sesi chat kamu dengan Rias telah melampaui batas! Rias akan melakukan cloning diri untuk melayani master! Sebentar ya :3',
							error: true
						});
						return;
					}

					resolve({ message: data.error.message || 'Unknown error', error: true });
					return;
				}

				const assistantContent = data.choices[0].Message?.content || data.choices[0].message?.content;

				this._chatHistory.addAssistantMessage(assistantContent);

				resolve({ message: assistantContent, error: false });
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Generate image from text prompt
	 * @param {string} prompt
	 * @returns {Promise<{ created: number, data: Array<{ b64_json: string }> } | null>}
	 */
	async generateImage(prompt) {
		try {
			const token = await this._getValidToken();

			if (!token) {
				return null;
			}

			const payload = {
				model: 'stable-diffusion-xl-v1-0',
				negative_prompt: '',
				width: 1024,
				height: 1024,
				prompt: prompt,
				steps: 20,
				guidance: 7.5,
				output_format: 'jpeg',
				scheduler: 'euler'
			};

			const { data } = await this._request.axios('/v1/text2image', 'POST', payload, {
				Authorization: `Bearer ${token}`,
				'X-Vulcan-Application-ID': CONFIG.VULCAN_APPLICATION_ID,
				Accept: 'application/json',
				'User-Agent': CONFIG.USER_AGENT,
				'X-Vulcan-Request-ID': '914948789' + Math.floor(Date.now() / 1000),
				'Content-Type': 'application/json; charset=UTF-8',
				'Accept-Encoding': 'gzip'
			});

			if (data?.data?.image) {
				return {
					created: Math.floor(Date.now() / 1000),
					data: [
						{
							b64_json: data.data.image
						}
					]
				};
			}

			return null;
		} catch (error) {
			loggers.error(color('Text-to-image failed:', 'red'), error);
			return null;
		}
	}

	/**
	 * Send vision request (image analysis)
	 * @param {Buffer} imageData
	 * @param {string} content
	 * @returns {Promise<object | null>}
	 */
	async processImage(imageData, content = 'What do you see in this image? Describe it in detail.') {
		try {
			const token = await this._getValidToken();

			if (!token) {
				return null;
			}

			const processedImage = await this._checkAndScaleImage(imageData, CONFIG.MAX_IMAGE_WIDTH, CONFIG.MAX_IMAGE_HEIGHT);

			const form = new FormData();

			const dataObject = {
				model: 'gpt-4o',
				user: this._user,
				nsfw_check: false,
				messages: [
					{
						role: 'user',
						content: content
					}
				]
			};

			form.append('data', JSON.stringify(dataObject), {
				contentType: 'application/json; charset=utf-8'
			});

			form.append('images[]', processedImage, {
				filename: 'image.jpeg',
				contentType: 'image/jpeg'
			});

			const response = await axios.post(`${url}/v7/vision_android`, form, {
				headers: {
					...form.getHeaders(),
					Authorization: `Bearer ${token}`,
					'X-Vulcan-Application-ID': CONFIG.VULCAN_APPLICATION_ID,
					Accept: 'application/json',
					'User-Agent': CONFIG.USER_AGENT,
					'X-Vulcan-Request-ID': '914948789' + Math.floor(Date.now() / 1000),
					'Accept-Encoding': 'gzip',
					Host: 'api.vulcanlabs.co',
					Connection: 'Keep-Alive'
				},
				timeout: 60000
			});

			if (response.status >= 200 && response.status < 300) {
				return response.data;
			}

			return null;
		} catch (error) {
			loggers.error(color('Vision request failed:', 'red'), error);
			return null;
		}
	}

	/**
	 * Check and scale image if it exceeds max dimensions
	 * @private
	 * @param {Buffer} imageBuffer
	 * @param {number} maxWidth
	 * @param {number} maxHeight
	 * @returns {Promise<Buffer>}
	 */
	async _checkAndScaleImage(imageBuffer, maxWidth, maxHeight) {
		try {
			const metadata = await sharp(imageBuffer).metadata();
			const { width: originalWidth, height: originalHeight } = metadata;

			if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
				return imageBuffer;
			}

			const widthRatio = maxWidth / originalWidth;
			const heightRatio = maxHeight / originalHeight;
			const scalingFactor = Math.min(widthRatio, heightRatio);

			const newWidth = Math.floor(originalWidth * scalingFactor);
			const newHeight = Math.floor(originalHeight * scalingFactor);

			const scaledBuffer = await sharp(imageBuffer)
				.resize(newWidth, newHeight, {
					fit: 'inside',
					kernel: sharp.kernel.lanczos3
				})
				.jpeg({ quality: 90 })
				.toBuffer();

			return scaledBuffer;
		} catch (error) {
			loggers.error(color('Image processing failed:', 'red'), error);
			throw error;
		}
	}
}
