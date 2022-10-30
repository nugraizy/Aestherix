import axios from 'axios';
import fs from 'fs-extra';

/**
 * Get slazzer tokens if the slazzer config is none.
 * @returns {Promise<{csrf: string, cookie: string}>}
 */
export const getTokens = async () => {
	try {
		const req = await axios.get('https://www.slazzer.com');

		return {
			csrf: req.data
				.match(/<meta name="csrf-token" content=".*">/g)[0]
				.match(/"(.*?)"/g)[1]
				.replace(/"/g, ''),
			cookie: req.headers['set-cookie'].map((v) => v.split(';')[0]).join(';'),
		};
	} catch (error) {
		return error;
	}
};

/**
 * Get slazzer tokens if the slazzer config is none.
 * @param {string} file input file path.
 * @returns {Promise<ReadableStream>}
 */
export const saveAndStream = async (file) => {
	await fs.writeFile('./temporary_files/tmp_img', file);

	const read = fs.createReadStream('./temporary_files/tmp_img');

	await fs.unlink('./temporary_files/tmp_img');

	return read;
};
