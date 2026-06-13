import { execFile } from 'child_process';
import FormData from 'form-data';
import fs from 'fs-extra';

import { color, fetchJSON, isURL, loggers } from '../modules/index.js';

export const toOpus = (ext, opts = {}) =>
	new Promise(async (resolve, reject) => {
		let container;
		let tmp;

		if (typeof opts.media === 'string' && isURL(opts.media)) {
			tmp = `${opts.input}.${ext}`;
			container = [
				'-y', '-i', opts.media, '-vn', '-c:a', 'libopus',
				'-b:a', '128k', '-vbr', 'on', '-compression_level', '10',
				`${opts.output}.${ext}`
			];
		} else {
			tmp = `${opts.input}.${ext}`;

			if (Buffer.isBuffer(opts.media)) {
				await fs.writeFile(tmp, opts.media);
			}

			container = [
				'-y', '-i', tmp, '-vn', '-c:a', 'libopus',
				'-b:a', '128k', '-vbr', 'on', '-compression_level', '10',
				`${opts.output}.${ext}`
			];
		}

		execFile('ffmpeg', container, async (err) => {
			if (err) {
				loggers.error(`${color('Failed to Convert Audio OPUS Codec', 'red')}`);
				await fs.unlink(tmp).catch(() => {});
				return reject(err);
			}

			resolve(await fs.readFile(`${opts.output}.${ext}`));
			await fs.unlink(`${opts.output}.${ext}`).catch(() => {});
		});
	});

export const soundRemover = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const bodyForm = new FormData();

			bodyForm.append('fileName', fs.createReadStream(input));
			const data = await fetchJSON('https://aivocalremover.com/api/v2/FileUpload', {
				method: 'post',
				body: bodyForm,
				headers: { 'Content-Type': `multipart/form-data; boundary=${bodyForm._boundary}` }
			});
			const apiKey = process.env.VOCAL_REMOVER_KEY || 'X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn';
			const { vocal_path: vocal, instrumental_path: instrumental } = await fetchJSON(
				'https://aivocalremover.com/api/v2/ProcessFile',
				{
					method: 'post',
					body: `file_name=${data.file_name}&action=watermark_video&key=${apiKey}&web=web`,
					headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
				}
			);

			await fs.unlink(input);
			loggers.info(`${color('Removed Sound', 'pink')} for ${color(sender, 'lilac')}`);
			resolve({ result: { vocal, instrumental } });
		} catch (err) {
			loggers.error(color('File processing failed:', 'red'), err);
			loggers.error(`${color('Failed to Remove Sound', 'red')} for ${color(sender, 'lilac')}`);
			reject(err);
		}
	});
