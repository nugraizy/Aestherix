import axios from 'axios';
import { contentType } from 'mime-types';

import { cheerioLOAD } from '../modules/index.js';
import { whatFormat } from '../misc/index.js';

/**
 * Parse downloadable url path.
 * @param {string} str
 * @returns {{path: string, id: number, filepath: string}}
 */
const _parse = (str) => {
	/* eslint-disable-next-line */
	const number = str.split("    document.getElementById('dlbutton').omg = ")[1].split('\n')[0].replace(/;/g, '').split('%');

	const numberMultiplication = parseInt(Number(number[0]) % Number(number[1])) * Number(number[0] % 3) + 18;

	return str
		.split("    document.getElementById('dlbutton').href    = ")[1] /* eslint-disable-line */
		.split('\n')[0]
		.replace(/"/g, '')
		.replace('+(b+18)+', numberMultiplication);
};

/**
 *
 * @param {string} url Zippyshare url.
 * @returns {Promise<{filename: string, filetype: string, mimetype: string, filesize: string, uploaded: string, dlLink: string} & {error?: string}>}
 * @throws {Error}
 */
export const zippyshare = (url) =>
	new Promise(async (resolve, reject) => {
		try {
			const { origin } = new URL(url);
			const { data } = await axios.get(url);

			const $ = cheerioLOAD(data);

			const dlLinkRaw = $('#dlbutton').next().next().next().html() || $('#player').next().next().next().html();

			const dlLink = _parse(dlLinkRaw);

			const info = $('title').text();

			const filename = info.replace(/Zippyshare\.com - /g, '');
			const details = {
				filename,
				filetype: whatFormat(contentType(filename)),
				mimetype: contentType(filename),
				filesize: $('font:contains(Size:)').next().text(),
				uploaded: $('font:contains(Uploaded:)').next().text(),
				dlLink: origin + dlLink
			};

			if (!details.dlLink) {
				resolve({ error: 'Cannot find downloadable link. Please check if the url is valid.' });
			}

			resolve(details);
		} catch (error) {
			reject(error);
		}
	});
