import fs from 'fs-extra';

/**
 * Create read stream of files.
 * @param {string} file input file path.
 * @returns {Promise<ReadableStream>}
 */
export const streamFile = (file) => {
	const read = fs.createReadStream(file);

	return read;
};
