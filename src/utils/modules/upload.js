import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import FormData from 'form-data';
import fs from 'fs-extra';
import { fetch, FormData as FormDataUndici } from 'undici';

import { Logger } from '../../core/logger.js';
import { color } from './color.js';
import { extractFilesize, getFilesizeFromBytes } from './format.js';
import { isFilePath, isURL } from './validation.js';

const loggers = new Logger();

const apiEndpoints = {
	uguu: 'https://uguu.se/upload.php',
	catbox: 'https://catbox.moe/user/api.php',
	monochrome: 'https://worker.uploads.monochrome.qzz.io'
};

export const uploadToTelegraph = async (file) => {
	try {
		const tempFile = file;

		if (Buffer.isBuffer(file)) {
			file = file.toString('base64');
		} else if (isFilePath(file)) {
			file = Buffer.from(fs.readFileSync(file), 'base64');
			await fs.unlink(tempFile);
		} else if (typeof file === 'string') {
			file = Buffer.from(file, 'base64');
		}

		let { ext } = await fileTypeFromBuffer(file);
		const form = new FormData();

		form.append('file', file, `file.${ext}`);
		const { data } = await axios.post('https://telegra.ph/upload', form, { headers: form.getHeaders() });

		return `https://telegra.ph${data[0].src}`;
	} catch (error) {
		loggers.error(color('Telegraph upload failed:', 'red'), error);
	}
};

export class Uploader {
	constructor(media) {
		this._file = media;

		this.uguu = async () => {
			const form = new FormDataUndici();
			let { success, message, ext } = await this.validateFile();

			if (!success) {
				throw new Error(message);
			}

			if (isURL(this._file)) {
				this._file = await this.fetchFileFromURL(this._file);
				const result = await this.validateFile();

				ext = result.ext;
			}

			const file = this.newFile(ext);

			form.set('files[]', file);

			const response = await fetch(apiEndpoints.uguu, { body: form, method: 'POST' });
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.description);
			}

			const { filename, url, size } = data.files[0];

			return {
				filename,
				size: getFilesizeFromBytes(size),
				expired: '6 hours',
				url
			};
		};

		this.catbox = async () => {
			const form = new FormDataUndici();
			let { success, message, ext } = await this.validateFile();

			if (!success) {
				throw new Error(message);
			}

			if (isURL(this._file)) {
				this._file = await this.fetchFileFromURL(this._file);
				const result = await this.validateFile();

				ext = result.ext;
			}

			const file = this.newFile(ext);

			form.set('fileToUpload', file);
			form.set('reqtype', 'fileupload');
			form.set('userhash', '');

			const response = await fetch(apiEndpoints.catbox, { body: form, method: 'POST' });
			const data = await response.text();

			if (data.includes('error')) {
				throw new Error(data);
			}

			const url = data;

			return {
				filename: new URL(url).pathname.replace('/', ''),
				filesize: extractFilesize(this._file),
				expired: 'no expire',
				url
			};
		};

		this.monochrome = async () => {
			try {
				let fileData;
				let fileName = 'file';

				if (Buffer.isBuffer(this._file)) {
					fileData = this._file;
				} else if (isFilePath(this._file)) {
					fileData = await fs.readFile(this._file);
					fileName = this._file;
				} else {
					throw new Error('Could not process input.');
				}

				const fileNameWithoutSpace = fileName.replace(/\s/g, '_');
				const file = new File([fileData], fileNameWithoutSpace);
				const response = await fetch(`${apiEndpoints.monochrome}/${fileNameWithoutSpace}`, {
					method: 'PUT',
					headers: {
						'x-api-key': 'if_youre_reading_this_fuck_off',
						'Content-Type': file.type || 'application/octet-stream'
					},
					body: file
				});

				if (!response.ok) {
					if (response.status === 413) {
						throw new Error('File exceeds 10MB');
					}

					throw new Error(`Upload failed: ${response.status}`);
				}

				const responseText = await response.text();
				const parsedResponse = await this.#tryJsonString(responseText);

				if (typeof parsedResponse === 'string' && parsedResponse !== null) {
					return {
						filename: fileNameWithoutSpace,
						url: `${apiEndpoints.monochrome.replace('worker.uploads', 'images')}/${parsedResponse}`
					};
				}

				throw new Error('Upload error with response: ' + parsedResponse.status + ': ' + parsedResponse.message);
			} catch (error) {
				throw error;
			}
		};
	}

	async validateFile() {
		if (Buffer.isBuffer(this._file)) {
			const types = await fileTypeFromBuffer(this._file);

			if (!types) {
				return { success: false, message: 'Files is not being recognised by the library.', ext: null };
			}

			return { success: true, ext: types.ext };
		} else if (!isURL(this._file)) {
			return { success: false, message: 'Could not process input.', ext: null };
		}

		return { success: true, ext: null };
	}

	newFile(ext) {
		return new File([this._file], `file.${ext}`);
	}

	async fetchFileFromURL(url) {
		const response = await fetch(url, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
		});

		const buffer = await response.arrayBuffer();

		return Buffer.from(buffer);
	}

	async #tryJsonString(text) {
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}
}
