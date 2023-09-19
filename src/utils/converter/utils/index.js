import axios from 'axios';
import fs from 'fs-extra';
import md5 from 'md5';
import asyncRetry from 'async-retry';

const urlRegex = new RegExp(
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
);
const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:108.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36';

/**
 * Create read stream of files.
 * @param {string} file input file path.
 * @returns {Promise<ReadableStream>}
 */
export const streamFile = (file) => fs.createReadStream(file);

export const signV1 = (obj) => {
	const str = JSON.stringify(obj);

	return md5('https://h5.tu.qq.com' + (str.length + (encodeURIComponent(str).match(/%[89ABab]/g)?.length || 0)) + 'HQ31X02e');
};

export const imageToBuffer = async (image, httpsAgent, opts) => {
	if (typeof image === 'string') {
		if (image.match(urlRegex)) {
			try {
				return await asyncRetry(
					async () => {
						const response = await axios.request({
							method: 'GET',
							url: image,
							headers: {
								'User-Agent': UA
							},
							responseType: 'arraybuffer',
							...(httpsAgent ? { httpsAgent } : {})
						});

						return response.data;
					},
					{
						...opts
					}
				);
			} catch (e) {
				throw new Error(`Unable to download media: ${e.toString()}`);
			}
		} else {
			try {
				await fs.promises.access(image, fs.promises.constants.F_OK);
				return await fs.promises.readFile(image);
			} catch {
				return Buffer.from(image, 'base64');
			}
		}
	} else {
		return image;
	}
};

const getImageProcessingLibrary = async () => {
	const [_jimp, sharp] = await Promise.all([
		await import('jimp').catch(() => undefined),
		await import('sharp').catch(() => undefined)
	]);

	if (sharp) {
		return { sharp };
	}

	const jimp = _jimp?.default || _jimp;

	if (jimp) {
		return { jimp };
	}

	throw new Error('No image processing library available, please install jimp or sharp as a dependency');
};

export const cropImage = async (imgData, type = 'SINGLE') => {
	let lib;

	try {
		lib = await getImageProcessingLibrary();
	} catch (error) {
		throw new Error('No image processing library available, please install jimp or sharp as a dependency');
	}

	if ('sharp' in lib && typeof lib.sharp?.default === 'function') {
		const sharp = lib.sharp.default(imgData);
		const meta = await sharp.metadata();
		const width = meta.width || 0;
		const height = meta.height || 0;

		let cropLeft = 0;
		let cropTop = 0;
		let cropWidth = width;
		let cropHeight = height;
		const widthH = width > height;

		if (type === 'COMPARED') {
			cropLeft = widthH ? 19 : 27;
			cropTop = widthH ? 23 : 30;
			cropWidth = width - cropLeft - (widthH ? 22 : 30);
			cropHeight = height - cropTop - (widthH ? 202 : 213);
		}

		if (type === 'SINGLE') {
			cropLeft = widthH ? 512 : 27;
			cropTop = widthH ? 28 : 544;
			cropWidth = width - cropLeft - (widthH ? 22 : 30);
			cropHeight = height - cropTop - (widthH ? 202 : 213);
		}

		return await sharp.extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight }).png().toBuffer();
	}

	if ('jimp' in lib && typeof lib.jimp?.read === 'function') {
		const jimp = await lib.jimp.read(imgData);
		const width = jimp.getWidth() || 0;
		const height = jimp.getHeight() || 0;

		let cropLeft = 0;
		let cropTop = 0;
		let cropWidth = width;
		let cropHeight = height;
		const widthH = width > height;

		if (type === 'COMPARED') {
			cropLeft = widthH ? 19 : 27;
			cropTop = widthH ? 23 : 30;
			cropWidth = width - cropLeft - (widthH ? 22 : 30);
			cropHeight = height - cropTop - (widthH ? 202 : 213);
		}

		if (type === 'SINGLE') {
			cropLeft = widthH ? 507 : 27;
			cropTop = widthH ? 23 : 544;
			cropWidth = width - cropLeft - (widthH ? 20 : 25);
			cropHeight = height - cropTop - (widthH ? 203 : 212);
		}

		return await jimp.crop(cropLeft, cropTop, cropWidth, cropHeight).getBufferAsync(lib.jimp.MIME_PNG);
	}

	throw new Error('No image processing library available, please install jimp or sharp as a dependency');
};
