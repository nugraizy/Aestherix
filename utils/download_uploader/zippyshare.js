import axios from 'axios';
import { contentType } from 'mime-types';

import { cheerioLOAD } from '../../helper/index.js';
import { whatFormat } from '../misc/index.js';

/**
 * Parse downloadable url path.
 * @param {string} str
 * @returns {{path: string, id: number, filepath: string}}
 */
const _parse = (str) => {
	str = str.match(/((?:"[^"]*"|^[^"]*$)|((?:"[^"]*"|^[^"]*$)|\(([^)]+)\)+))/g);

	return {
		path: str[1].replace(/"/g, ''),
		id: eval(str[2]),
		filepath: str[3].replace(/"/g, ''),
	};
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

			const dlLinkRaw = $('#dlbutton').next().html();

			const dlLink = _parse(dlLinkRaw);

			const info = $('title').text();

			const filename = info.replace(/Zippyshare\.com - /g, '');
			const details = {
				filename,
				filetype: whatFormat(contentType(filename)),
				mimetype: contentType(filename),
				filesize: $('font:contains(Size:)').next().text(),
				uploaded: $('font:contains(Uploaded:)').next().text(),
				dlLink: origin + dlLink.path + dlLink.id + dlLink.filepath,
			};

			if (!details.dlLink) {
				resolve({ error: 'Cannot find downloadable link. Please check if the url is valid.' });
			}

			resolve(details);
		} catch (error) {
			reject(error);
		}
	});
