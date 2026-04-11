import { fetch } from 'undici';

const timeAgo = (unixTimestamp) => {
	const now = Math.floor(Date.now() / 1000);
	let diff = now - unixTimestamp;

	if (diff < 5) {
		return 'just now';
	}

	if (diff < 0) {
		return 'in the future';
	}

	const year = 31536000;
	const month = 2592000;
	const day = 86400;
	const hour = 3600;
	const minute = 60;

	const years = Math.floor(diff / year);

	diff %= year;

	const months = Math.floor(diff / month);

	diff %= month;

	const days = Math.floor(diff / day);

	diff %= day;

	const hours = Math.floor(diff / hour);

	diff %= hour;

	const minutes = Math.floor(diff / minute);

	const plural = (n, str) => `${n} ${str}${n > 1 ? 's' : ''}`;

	if (years > 0) {
		if (months > 0) {
			return `${plural(years, 'year')}, ${plural(months, 'month')} ago`;
		}

		return `${plural(years, 'year')} ago`;
	}

	if (months > 0) {
		if (days > 0) {
			return `${plural(months, 'month')}, ${plural(days, 'day')} ago`;
		}

		return `${plural(months, 'month')} ago`;
	}

	if (days > 0) {
		if (days === 1) {
			return 'yesterday';
		}

		return `${plural(days, 'day')} ago`;
	}

	if (hours > 0) {
		if (hours === 1) {
			return 'an hour ago';
		}

		return `${plural(hours, 'hour')} ago`;
	}

	if (minutes > 0) {
		if (minutes === 1) {
			return 'a minute ago';
		}

		return `${plural(minutes, 'minute')} ago`;
	}

	return 'just now';
};

/**
 * @typedef {{titles: {english: string, japanese: string, pretty: string}, uploaded: string, uploadedInUnix: number, pages: number, totalFavorites: number, parodies: string, tags: string[], artists: string[], groups: string[], languages: string[], categories: string[], images: {cover: string, pages: string[]}}} ParsedResponse
 */

/**
 * Parse metadata from NHentai data
 * @param {object} data
 * @returns {ParsedResponse}
 */
const parseNhentaiMetadata = (data) => ({
	titles: data.title,
	uploaded: timeAgo(data.upload_date),
	uploadedInUnix: data.upload_date,
	pages: data.num_pages,
	totalFavorites: data.num_favorites,
	parodies: data.tags.find((v) => v.type === 'parody')?.name,
	tags: data.tags.filter((v) => v.type === 'tag')?.map((v) => v.name),
	artists: data.tags.filter((v) => v.type === 'artist')?.map((v) => v.name),
	groups: data.tags.filter((v) => v.type === 'group')?.map((v) => v.name),
	languages: data.tags.filter((v) => v.type === 'language')?.map((v) => v.name),
	categories: data.tags.filter((v) => v.type === 'category')?.map((v) => v.name),
	images: {
		cover: `https://i3.nhentai.net/${data.cover.path}`,
		pages: data.pages.map((v) => `https://i3.nhentai.net/${v.path}`)
	}
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
	const data = await fetch(`https://nhentai.net/api/v2/galleries/${code}`);

	if (!data.ok) {
		return {
			status: false,
			message: 'Something went wrong. Code: ' + data.status
		};
	}

	return { ...(await data.json()), status: true };
};

/**
 * Request data via API
 * @param {number} code
 * @returns {Promise<object>}
 */
const request = async (code) => {
	if (!isValidCode(code)) {
		return {
			status: false,
			message: 'Not a number'
		};
	}

	return requestApi(code);
};

/**
 * Fetch NHentai
 * @param {string} code - the doujin code
 * @returns {Promise<ParsedResponse>}
 */
export const nhentai = async (code) => {
	try {
		let data = await request(code);

		if (!data.status) {
			throw new Error(data.message);
		}

		return parseNhentaiMetadata(data);
	} catch (err) {
		throw err;
	}
};
