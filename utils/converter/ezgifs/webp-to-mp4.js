import FormData from 'form-data';
import fs from 'fs';

import { cheerioLOAD, fetchTEXT } from '../../../helper/index.js';

/**
 * Convert WEBP to MP4.
 * @param {string} path input WEBP path to convert to MP4.
 * @returns {Promise<{result: string}>}
 * @throws {Error}
 */
export const webp2mp4File = async (path) =>
	new Promise(async (resolve, reject) => {
		try {
			const bodyForm = new FormData();

			bodyForm.append('new-image-url', '');
			bodyForm.append('new-image', fs.createReadStream(path));
			const data = await fetchTEXT('https://s6.ezgif.com/webp-to-mp4', {
				method: 'post',
				body: bodyForm,
				headers: { 'Content-Type': `multipart/form-data; boundary=${bodyForm._boundary}` },
			});
			const bodyFormThen = new FormData();
			const $ = cheerioLOAD(data);
			const file = $('input[name="file"]').attr('value');
			const convert = $('input[name="file"]').attr('value');
			const gotdata = {
				file,
				convert,
			};

			bodyFormThen.append('file', gotdata.file);
			bodyFormThen.append('convert', gotdata.convert);
			const dataRes = await fetchTEXT(`https://ezgif.com/webp-to-mp4/${gotdata.file}`, {
				method: 'post',
				body: bodyFormThen,
				headers: { 'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}` },
			});
			const $$ = cheerioLOAD(dataRes);
			const result = `https:${$$('div#output > p.outfile > video > source').attr('src')}`;

			resolve({
				result,
			});
		} catch (err) {
			reject(err);
		}
	});
