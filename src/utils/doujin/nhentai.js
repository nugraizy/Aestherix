import { fetchJSON, fetchTEXT } from '../modules/index.js';

/**
 * Get the type of the image
 * @param {string} input
 * @returns {'png' | 'jpg' | 'gif' | null}
 */
const _imageType = (input) => {
	const types = {
		p: 'png',
		j: 'jpg',
		g: 'gif'
	};

	return types[input] || null;
};

/**
 * @typedef {{titles: {english: string, japanese: string, pretty: string}, uploadDate: number, totPages: number, totFavorites: number, tags: string[], images: string[]}} ParsedResponse
 */

/**
 * Parse metadata from NHentai data
 * @param {object} data
 * @returns {ParsedResponse}
 */
const parseNhentaiMetadata = (data) => ({
	titles: data.title,
	uploadDate: data.upload_date,
	totPages: data.num_pages,
	totFavorites: data.num_favorites,
	tags: data.tags.map((v) => v.name),
	images: data.images.pages.map((v, i) => `https://i.nhentai.net/galleries/${data.media_id}/${i + 1}.${_imageType(v.t)}`)
});

/**
 * Check if the provided code is valid
 * @param {any} code
 * @returns {boolean}
 */
const isValidCode = (code) => {
	const parsedCode = Number(code);

	return !isNaN(parsedCode) && Number.isInteger(parsedCode) && parsedCode > 0;
};

/**
 * Request NHentai API
 * @param {number} code
 * @returns {Promise<object>}
 */
const requestApi = async (code) => {
	const data = await fetchJSON(`https://nhentai.net/api/gallery/${code}`);

	if (data.error) {
		return {
			status: false,
			message: data.error,
			shouldDone: true
		};
	}

	return { ...data, status: true };
};

/**
 * Request NHentai Web
 * @param {number} code
 * @param {string} cookie
 * @returns
 */
const requestWeb = async (code, cookie) => {
	const html = await fetchTEXT('https://nhentai.net/g/' + code, {
		headers: {
			cookie,
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36'
		}
	});

	const jsonString = /window\._gallery\s*=\s*JSON\.parse\("(.*?)"\)/.exec(html);

	if (!jsonString) {
		return {
			status: false,
			message: 'not found',
			shouldDone: true
		};
	}

	const data = JSON.parse(jsonString[1].replace(/\\"/g, ''));

	if (data.error) {
		return {
			status: false,
			message: data.error
		};
	}

	return { ...data, status: true };
};

/**
 * Request data either via API or web
 * @param {number} code
 * @param {boolean} isApi
 * @param {string} cookie
 * @returns {Promise<object>}
 */
const request = async (code, isApi, cookie) => {
	if (!isValidCode(code)) {
		return {
			status: false,
			message: 'Not a number',
			shouldDone: true
		};
	}

	return isApi ? requestApi(code) : requestWeb(code, cookie);
};

/**
 * Fetch NHentai
 * @param {string} code - the doujin code
 * @param {string} cookie - cookie for cloudflare bypass
 * @returns {Promise<ParsedResponse>}
 */
export const nhentai = async (code, cookie) => {
	try {
		let data = await request(code, true);

		if (data.shouldDone) {
			if (!cookie) {
				throw new Error(
					'No Cookie found to proceed the website request. You will be catched with Cloudflare anti-bot. Please run `npm run nhentai:cookie`'
				);
			}

			data = await request(code, false, cookie);
		}

		if (!data.status) {
			throw new Error(data.message);
		}

		return parseNhentaiMetadata(data);
	} catch (err) {
		throw err;
	}
};
