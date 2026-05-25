import axios from 'axios';
import { load } from 'cheerio';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs-extra';
import progress from 'progress-stream';
import { Client, fetch } from 'undici';

export const fetchTEXT = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	return response.text();
};

export const fetchJSON = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	return response.json();
};

export const fetchBUFFER = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	const buffer = await response.arrayBuffer();

	return new Buffer.from(buffer);
};

export const fetchHEADERS = async (url, options) => {
	const response = await fetch(url, options);

	if (!response.ok) {
		throw new Error(response.status);
	}

	return response.headers;
};

export const cheerioLOAD = (html) => load(html);

export const download = async (url, path) => {
	await new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios({
				url,
				method: 'GET',
				responseType: 'arraybuffer'
			});

			path = path || `./temporary_files/${Date.now()}.${(await fileTypeFromBuffer(data)).ext}`;
			await fs.writeFile(path, data);
			resolve();
		} catch (err) {
			reject(err);
		}
	});
	return path;
};

export class Fetch {
	constructor(origin, { delay = 0 } = {}) {
		this._origin = origin;
		this._client = new Client(this._origin);
		this._data = [];
		this._body = null;
		this._progress = null;
		this._delay = delay;
		this._delayLayer = Date.now();
		this._abortController = new AbortController();
	}

	async request(path, { method, config = {} }) {
		const { body, headers } = await this._client.request({
			path,
			method,
			...config
		});

		this._body = body;

		const str = progress({
			length: headers['content-length']
		});

		str.on('data', (data) => {
			this._data.push(data);
		});

		this._body.pipe(str);

		this._progress = str;

		this.headers = headers;

		return this;
	}

	on(event, cb) {
		if (event === 'progress') {
			let firstRun = true;

			this._progress.on(event, (data) => {
				if (data.percentage === 100) {
					cb(data);
					this._progress.emit('finish', true);
				}

				if (!firstRun && Date.now() - this._delayLayer >= this._delay) {
					cb(data);

					this._delayLayer = Date.now();
				} else if (firstRun) {
					cb(data);
					firstRun = false;
					this._delayLayer = Date.now();
				}
			});

			return this;
		}

		this._progress.on(event, (data) => {
			cb(data);
		});

		return this;
	}

	toBuffer() {
		return Buffer.concat(this._data);
	}

	cancel(message = '') {
		this._progress.emit('cancel', { cancelByUser: true });
		this._progress.removeAllListeners();
		return this._abortController.abort(message);
	}
}
