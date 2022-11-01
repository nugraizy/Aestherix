/* global log, botNum, client */
import axios from 'axios';
import { exec } from 'child_process';
import FormData from 'form-data';
import fs from 'fs-extra';
import dayjs from 'dayjs';
import path from 'path';
import petting from 'pet-pet-gif';
import sharp from 'sharp';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { color, ERRLOG, fetchJSON, INFOLOG, isFileExist, isURL, readBuffer, readJSON, unlinkFile, writeBuffer } from '../../helper/modules/index.js';
import { webp2mp4File } from './ezgifs/index.js';
import { streamFile } from './_utils.js';

const VIDEO_MIMETYPE = readJSON(path.join(__dirname, 'databases/mimetypes/Video.json'));

/**
 * Convert to MP4.
 * @param {string} input file path or url of the input.
 * @param {string} sender
 * @returns {Promise<Buffer>}
 * @throws {Error}
 */
export const toMp4 = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const time = dayjs().unix();

			exec(`ffmpeg -i "${input}" "./temporary_files/${sender}${time}.mp4"`, async (err) => {
				if (err) {
					if (!isURL(input)) {
						unlinkFile(input);
					}

					log(err);
					reject(err);
				}

				const buffer = readBuffer(`./temporary_files/${sender}${time}.mp4`);

				unlinkFile(`./temporary_files/${sender}${time}.mp4`);
				resolve(buffer);
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});

/**
 * Convert GIF to MP4.
 * @param {string} input file path or url of the input.
 * @param {string} sender
 * @returns {Promise<Buffer>}
 * @throws {Error}
 */
export const gifToMp4 = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const time = dayjs().unix();

			exec(`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "./temporary_files/${sender}${time}.mp4"`, async (err) => {
				if (err) {
					if (!isURL(input)) {
						unlinkFile(input);
					}

					log(err);
					reject(err);
				}

				const buffer = readBuffer(`./temporary_files/${sender}${time}.mp4`);

				unlinkFile(`./temporary_files/${sender}${time}.mp4`);
				resolve(buffer);
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});

/**
 * Convert URL or file into readable WhatsApp audio.
 * @param {string} ext extensions of the file.
 * @param {{media: string | Buffer, input: string, output: string}} opts
 * @returns {Promise<Buffer>}
 * @throws {Error}
 */
export const toOpus = (ext, opts = {}) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');
		let container;
		let tmp;

		if (typeof opts.media == 'string' && isURL(opts.media)) {
			tmp = `${opts.input}.${ext}`;
			container = ['-y', '-i', `"${opts.media}"`, '-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10', `"${opts.output}.${ext}"`];
		} else {
			tmp = `${opts.input}.${ext}`;

			if (Buffer.isBuffer(opts.media)) {
				writeBuffer(tmp, opts.media);
			}

			container = ['-y', '-i', `"${tmp}"`, '-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10', `"${opts.output}.${ext}"`];
		}

		exec(`ffmpeg ${container.join(' ')}`, (err) => {
			if (err) {
				ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Audio OPUS Codec', 'red')}`);
				unlinkFile(tmp);
				reject(err);
			}

			resolve(readBuffer(`${opts.output}.${ext}`));
			unlinkFile(`${opts.output}.${ext}`);
			unlinkFile(tmp);
		});
	});

/**
 * Convert media to WhatsApp sticker.
 * @param {string} filepath input of the path.
 * @param {string} sender
 * @param {string} output
 * @param {string} mimetype
 * @returns {Promise<Buffer>}
 * @throws {Error}
 */
export const convertMediaToSticker = (filePath, sender, output, mimetype) =>
	new Promise((resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');
		const pathExif = path.join(__dirname, 'temporary_files/data.exif');
		let pathSticker = filePath;

		if (!isFileExist(pathSticker)) {
			pathSticker = path.join(__dirname, `temporary_files/${pathSticker}`);
		}

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converting Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);

		if (filePath.endsWith('webp') && isFileExist(filePath)) {
			exec(`webpmux -set exif "${pathExif}" "${pathSticker}" -o "${pathSticker}-done.webp"`, (err, stdout, stderr) => {
				if (err) {
					ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);
					unlinkFile(pathSticker);
					reject(stderr);
				}

				const buffer = readBuffer(`${pathSticker}-done.webp`);

				unlinkFile(`${pathSticker}-done.webp`);
				unlinkFile(pathSticker);
				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
				resolve(buffer);
			});
		} else if (filePath.endsWith('jpeg')) {
			exec(
				`ffmpeg -i "${pathSticker}" -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=30" -lossless 0 -an -vsync 0 -s 512:512 "${pathSticker}.webp"`,
				(err) => {
					if (err) {
						ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);
						unlinkFile(pathSticker);
						reject(err);
					}

					exec(`webpmux -set exif "${pathExif}" "${pathSticker}.webp" -o "${pathSticker}-done.webp"`, (err) => {
						if (err) {
							ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);
							unlinkFile(`${pathSticker}-done.webp`);
							unlinkFile(pathSticker);
							unlinkFile(`${pathSticker}.webp`);
							reject(err);
						}

						const buffer = readBuffer(`${pathSticker}-done.webp`);

						unlinkFile(`${pathSticker}-done.webp`);
						unlinkFile(pathSticker);
						unlinkFile(`${pathSticker}.webp`);
						INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
						resolve(buffer);
					});
				},
			);
		} else {
			pathSticker = output ? output : pathSticker;
			exec(
				`ffmpeg -i "${filePath}" ${
					!pathSticker.includes('.webp')
						? '-vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=10" -lossless 0 -preset default -ss 00:00:00 -t 00:00:10 -an -vsync 0 -s 512:512'
						: ''
				} "${mimetype && VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker}"`,
				(er) => {
					if (er) {
						ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);
						unlinkFile(pathSticker);
						reject(er);
					}

					exec(`webpmux -set exif "${pathExif}" "${VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker}" -o "${pathSticker}-done.webp"`, (err) => {
						if (err) {
							ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);
							unlinkFile(pathSticker);
							reject(err);
						}

						const buffer = readBuffer(`${pathSticker}-done.webp`);

						unlinkFile(`${pathSticker}-done.webp`);
						unlinkFile(pathSticker);
						unlinkFile(`${pathSticker}.webp`);
						INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
						resolve(buffer);
					});
				},
			);
		}
	});

/**
 * Convert WhatsApp sticker to media.
 * @param {string} filepath input of the path.
 * @param {string} sender
 * @param {*} mediaData
 * @returns {Promise<{result: string | Buffer}>}
 */
export const convertStickerToMedia = (filePath, sender, mediaData) =>
	new Promise(async (resolve) => {
		const time = dayjs().format('HH:mm:ss DD/MM');
		const pathResults = path.join(__dirname, 'temporary_files/sticker_conversion.png');

		if (mediaData.isAnimated) {
			const { result } = await webp2mp4File(filePath);

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
			unlinkFile(filePath);
			resolve({
				result,
			});
		} else {
			exec(`dwebp '${filePath}' -o '${pathResults}'`, async (err) => {
				if (err) {
					const { result } = await webp2mp4File(filePath);

					INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
					unlinkFile(filePath);
					resolve({
						result,
					});
					return;
				}

				const buffer = readBuffer(pathResults);

				unlinkFile(pathResults);
				unlinkFile(filePath);
				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
				resolve({
					result: buffer,
				});
			});
		}
	});

/**
 * Convert MP4 to MP3.
 * @param {string} input file input path or url.
 * @param {string} output file output path.
 * @param {string} sender
 * @returns {Promise<{output: string}>}
 * @throws {Error}
 */
export const mp42mp3 = (input, output, sender) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		exec(`ffmpeg -i "${input}" "${output.slice(-3) != 'mp3' ? `${output}.mp3` : output}"`, (err) => {
			if (err) {
				ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Video to Audio', 'red')} for ${color(sender, '#ff71ce')}`);
				reject(err);
				return;
			}

			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
			resolve({ output: output.slice(-3) != 'mp3' ? `${output}.mp3` : output });
		});
	});

/**
 * Convert GIF to MP4.
 * @param {string} input file input path or url.
 * @param {string} output file output path.
 * @param {{duration: number}} sender
 * @returns {Promise<{output: string}>}
 * @throws {Error}
 */
export const gif2mp4 = (input, output, opts = {}) =>
	new Promise((resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		exec(
			`ffmpeg -stream_loop -1 -i "${input}" -vcodec libx264 -acodec libmp3lame -pix_fmt yuv420p -crf 23 -ss 00:00:00.000 -t 00:00:${opts.duration || 4}.000 "${output}"`,
			(err) => {
				if (err) {
					ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Convert Gif to Video', 'red')}`);
					reject(err);
					return;
				}

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Converted Media', '#01cdfe')}`);
				resolve({ output });
			},
		);
	});

/**
 * Remove specific sound from a song/audio.
 * @param {string} input file input path.
 * @param {string} sender
 * @returns {Promise<{result: {vocal: string, instrumental: string}}>}
 * @throws {Error}
 */
export const soundRemover = (input, sender) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		try {
			const bodyForm = new FormData();

			bodyForm.append('fileName', fs.createReadStream(input));
			const data = await fetchJSON('https://aivocalremover.com/api/v2/FileUpload', {
				method: 'post',
				body: bodyForm,
				headers: { 'Content-Type': `multipart/form-data; boundary=${bodyForm._boundary}` },
			});
			const { vocal_path: vocal, instrumental_path: instrumental } = await fetchJSON('https://aivocalremover.com/api/v2/ProcessFile', {
				method: 'post',
				body: `file_name=${data.file_name}&action=watermark_video&key=X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn`,
				headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
			});

			unlinkFile(input);
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Removed Sound', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
			resolve({ result: { vocal, instrumental } });
		} catch (err) {
			log(err);
			ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Remove Sound', 'red')} for ${color(sender, '#ff71ce')}`);
			reject(err);
		}
	});

/**
 * Image Petting animations.
 * @param {string} input file input path.
 * @param {string} sender
 * @param {{output: 'sticker' | undefined, filename: string}} opts
 * @returns {Promise<{Buffer}>}
 * @throws {Error}
 */
export const pet = (input, sender, opts = {}) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		try {
			let petted;

			await new Promise(async (res) => {
				petted = await petting(input, opts);
				await fs.writeFile(`${opts.filename}.gif`, petted);
				res();
			});

			if (opts.output == 'sticker') {
				const file = await sharp(await fs.readFile(`${opts.filename}.gif`), { animated: true })
					.toFormat('webp')
					.webp()
					.toBuffer();
				const sticker = await client[botNum].prepareSticker(file, `${opts.filename}-done.webp`, 'stickerAnimated', { author: configuration.author, packname: configuration.packname });

				unlinkFile(`${opts.filename}.gif`);
				unlinkFile(`${opts.filename}-done.webp`);
				resolve(sticker);
				return;
			}

			const { output } = await gif2mp4(`${input}.gif`, `${input}.mp4`, opts);

			resolve(readBuffer(output));
			unlinkFile(input);
			unlinkFile(`${input}.gif`);
			unlinkFile(output);
		} catch (err) {
			ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Pet Image', 'red')} for ${color(sender, '#ff71ce')}`);
			reject(err);
		}
	});

/**
 * Merge video with audio.
 * @param {string} video file video input path.
 * @param {string} audio file audio input path
 * @param {string} output file output path.
 * @returns {Promise<{Buffer}>}
 * @throws {Error}
 */
export const mergeVideoWithAudio = (video, audio, output, sender) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		try {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Merging files', '#01cdfe')}`);
			exec(`ffmpeg -i "${video}" -i "${audio}" -c:v copy -c:a copy "${output}"`, (err) => {
				if (err) {
					ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Merge Audio to Video', 'red')}`);
					reject(err);
					return;
				}

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Completed merging', '#01cdfe')}`);
				const buffer = readBuffer(output);

				unlinkFile(output);
				resolve(buffer);
			});
		} catch (err) {
			ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Merge Audio to Video', 'red')} for ${color(sender, '#ff71ce')}`);
			reject(err);
		}
	});

/**
 * Remove background image.
 * @param {string} input file input path.
 * @param {string} sender
 * @returns {Promise<{Buffer}>}
 * @throws {Error}
 */

export const removeBg = (input, sender) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		const apiKeys = process.env.REMOVEBG_KEY.split('\n');
		const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

		const output = input.replace(input.slice(input.lastIndexOf('.'), input.length), '.png');

		try {
			await sharp(input).toFormat('png').toFile(output);
			const file = streamFile(output);

			const form = new FormData();

			form.append('size', 'auto');
			form.append('image_file', file);

			const { data } = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
				headers: {
					...form.getHeaders(),
					'X-Api-Key': apiKey,
				},
				responseType: 'arraybuffer',
			});

			await fs.unlink(input);
			await fs.unlink(output);
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Removing image background success', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
			resolve(new Buffer.from(data, 'base64'));
		} catch (error) {
			await fs.unlink(output);
			await fs.unlink(input);

			ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Remove image background', 'red')} for ${color(sender, '#ff71ce')}\nRemove Background Token Used : ${apiKey}`);
			reject(error);
		}
	});

const _api = (path, version) => `https://api.alcaamado.es/api/${version}/waifu2x${path}`;

/**
 * Enhance image using Waifu2x enhancer API.
 * @param {string} input file input path.
 * @param {string} sender
 * @returns {Promise<{Buffer}>}
 * @throws {Error}
 */

export const waifu2x = (input, sender) =>
	new Promise(async (resolve, reject) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		const output = input.replace(input.slice(input.lastIndexOf('.'), input.length), '.png');

		try {
			await sharp(input).toFormat('png').toFile(output);
			const file = streamFile(output);

			const form = new FormData();

			form.append('denoise', 2);
			form.append('scale', 'true');
			form.append('file', file);

			const {
				data: { hash },
			} = await axios.post(_api('/convert', 'v1'), form, {
				headers: {
					'Accept-Language': 'en-US,en;q=0.9',
					Referer: 'https://waifu2x.pro/',
					Accept: 'application/json',
					'Use-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					...form.getHeaders(),
				},
			});

			const {
				data: { finished },
			} = await axios.get(_api('/check', 'v2'), {
				params: { hash },
				headers: {
					Referer: 'https://waifu2x.pro/',
					Accept: 'application/json',
					'Use-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
				},
			});

			if (finished) {
				const { data } = await axios.get(_api('/get', 'v2'), {
					params: {
						hash,
						type: 'png',
					},
					responseType: 'arraybuffer',
				});

				INFOLOG(`[${color(time, 'cyan')}]`, `${color('Enhancing image success', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
				await fs.unlink(input);
				resolve(new Buffer.from(data, 'base64'));
				return;
			}

			await fs.unlink(input);
			reject(new Error('Cannot resolve your requests. Try again later.'));
		} catch (err) {
			ERRLOG(`[${color(time, 'cyan')}]`, `⚠️ ${color('Failed to Enhance image', 'red')} for ${color(sender, '#ff71ce')}`);
			await fs.unlink(input);
			reject(err);
		}
	});
