import asyncRetry from 'async-retry';
import axios from 'axios';
import { exec } from 'child_process';
import dayjs from 'dayjs';
import FormData from 'form-data';
import fs from 'fs-extra';
import httpsProxyAgent from 'https-proxy-agent';
import isBuffer from 'is-buffer';
import { Writable } from 'node:stream';
import path from 'path';
import PDFDocument from 'pdfkit';
import petting from 'pet-pet-gif';
import sharp from 'sharp';
import socksProxyAgent from 'socks-proxy-agent';

import configuration from '../../helper/config/connect.js';
import { videoFormat as VIDEO_MIMETYPE } from '../misc/mimetype.js';
import { color, fetchBUFFER, fetchJSON, isURL, loggers } from '../modules/index.js';
import { webp2mp4File } from './ezgifs/index.js';
import { cropImage, imageToBuffer, signV1, streamFile } from './utils/index.js';

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

			exec(`ffmpeg -i "${input}" "./src/media/temporary_files/${sender}${time}.mp4"`, async (err) => {
				if (err) {
					if (!isURL(input)) {
						await fs.unlink(input);
					}

					log(err);
					reject(err);
				}

				const buffer = await fs.readFile(`./src/media/temporary_files/${sender}${time}.mp4`);

				await fs.unlink(`./src/media/temporary_files/${sender}${time}.mp4`);
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

			exec(
				`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "./temporary_files/${sender}${time}.mp4"`,
				async (err) => {
					if (err) {
						if (!isURL(input)) {
							await fs.unlink(input);
						}

						log(err);
						reject(err);
					}

					const buffer = await fs.readFile(`./src/media/temporary_files/${sender}${time}.mp4`);

					await fs.unlink(`./src/media/temporary_files/${sender}${time}.mp4`);
					resolve(buffer);
				}
			);
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
		let container;
		let tmp;

		if (typeof opts.media === 'string' && isURL(opts.media)) {
			tmp = `${opts.input}.${ext}`;
			container = [
				'-y',
				'-i',
				`"${opts.media}"`,
				'-vn',
				'-c:a',
				'libopus',
				'-b:a',
				'128k',
				'-vbr',
				'on',
				'-compression_level',
				'10',
				`"${opts.output}.${ext}"`
			];
		} else {
			tmp = `${opts.input}.${ext}`;

			if (isBuffer(opts.media)) {
				await fs.writeFile(tmp, opts.media);
			}

			container = [
				'-y',
				'-i',
				`"${tmp}"`,
				'-vn',
				'-c:a',
				'libopus',
				'-b:a',
				'128k',
				'-vbr',
				'on',
				'-compression_level',
				'10',
				`"${opts.output}.${ext}"`
			];
		}

		exec(`ffmpeg ${container.join(' ')}`, async (err) => {
			if (err) {
				loggers.error(`${color('Failed to Convert Audio OPUS Codec', 'red')}`);
				await fs.unlink(tmp);
				reject(err);
			}

			resolve(await fs.readFile(`${opts.output}.${ext}`));
			await fs.unlink(`${opts.output}.${ext}`);
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
	new Promise(async (resolve, reject) => {
		const pathExif = path.join(__dirname, 'src/media/temporary_files/data.exif');
		let pathSticker = filePath;

		if (!(await fs.exists(pathSticker))) {
			pathSticker = path.join(__dirname, `src/media/temporary_files/${pathSticker}`);
		}

		loggers.warning(`${color('Converting Media', 'pink')} for ${color(sender, 'lilac')}`);

		if (filePath.endsWith('webp') && (await fs.exists(filePath))) {
			exec(`webpmux -set exif "${pathExif}" "${pathSticker}" -o "${pathSticker}-done.webp"`, async (err, stdout, stderr) => {
				if (err) {
					loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
					await fs.unlink(pathSticker);
					reject(stderr);
				}

				const buffer = await fs.readFile(`${pathSticker}-done.webp`);

				await fs.unlink(`${pathSticker}-done.webp`);
				await fs.unlink(pathSticker);
				loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
				resolve(buffer);
			});
		} else if (filePath.endsWith('jpeg')) {
			exec(
				`ffmpeg -i "${pathSticker}" -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=30" -lossless 0 -an -vsync 0 -s 512:512 "${pathSticker}.webp"`,
				async (err) => {
					if (err) {
						loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
						await fs.unlink(pathSticker);
						reject(err);
					}

					exec(`webpmux -set exif "${pathExif}" "${pathSticker}.webp" -o "${pathSticker}-done.webp"`, async (err) => {
						if (err) {
							loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
							await fs.unlink(`${pathSticker}-done.webp`);
							await fs.unlink(pathSticker);
							await fs.unlink(`${pathSticker}.webp`);
							reject(err);
						}

						const buffer = await fs.readFile(`${pathSticker}-done.webp`);

						await fs.unlink(`${pathSticker}-done.webp`);
						await fs.unlink(pathSticker);
						await fs.unlink(`${pathSticker}.webp`);
						loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
						resolve(buffer);
					});
				}
			);
		} else {
			pathSticker = output ? output : pathSticker;
			exec(
				`ffmpeg -i "${filePath}" ${
					!pathSticker.includes('.webp')
						? '-vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=10" -lossless 0 -preset default -ss 00:00:00 -t 00:00:10 -an -vsync 0 -s 512:512'
						: ''
				} "${mimetype && VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker}"`,
				async (er) => {
					if (er) {
						loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
						await fs.unlink(pathSticker);
						reject(er);
					}

					exec(
						`webpmux -set exif "${pathExif}" "${
							VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker
						}" -o "${pathSticker}-done.webp"`,
						async (err) => {
							if (err) {
								loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
								await fs.unlink(pathSticker);
								reject(err);
							}

							const buffer = await fs.readFile(`${pathSticker}-done.webp`);

							await fs.unlink(`${pathSticker}-done.webp`);
							await fs.unlink(pathSticker);
							await fs.unlink(`${pathSticker}.webp`);
							loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
							resolve(buffer);
						}
					);
				}
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
		const pathResults = path.join(__dirname, 'src/media/temporary_files/sticker_conversion.png');

		if (mediaData.isAnimated) {
			const { result } = await webp2mp4File(filePath);

			loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
			await fs.unlink(filePath);
			resolve({
				result
			});
		} else {
			exec(`dwebp '${filePath}' -o '${pathResults}'`, async (err) => {
				if (err) {
					const { result } = await webp2mp4File(filePath);

					loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
					await fs.unlink(filePath);
					resolve({
						result
					});
					return;
				}

				const buffer = await fs.readFile(pathResults);

				await fs.unlink(pathResults);
				await fs.unlink(filePath);
				loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
				resolve({
					result: buffer
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
		exec(`ffmpeg -i "${input}" "${output.slice(-3) !== 'mp3' ? `${output}.mp3` : output}"`, (err) => {
			if (err) {
				loggers.error(`${color('Failed to Convert Video to Audio', 'red')} for ${color(sender, 'lilac')}`);
				reject(err);
				return;
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
			resolve({ output: output.slice(-3) !== 'mp3' ? `${output}.mp3` : output });
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
export const gif2mp4 = (input, output) =>
	new Promise((resolve, reject) => {
		exec(
			`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${output}"`,
			(err) => {
				if (err) {
					loggers.error(`${color('Failed to Convert Gif to Video', 'red')}`);
					reject(err);
					return;
				}

				loggers.info(`${color('Converted Media', 'pink')}`);
				resolve({ output });
			}
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
		try {
			const bodyForm = new FormData();

			bodyForm.append('fileName', fs.createReadStream(input));
			const data = await fetchJSON('https://aivocalremover.com/api/v2/FileUpload', {
				method: 'post',
				body: bodyForm,
				headers: { 'Content-Type': `multipart/form-data; boundary=${bodyForm._boundary}` }
			});
			const { vocal_path: vocal, instrumental_path: instrumental } = await fetchJSON(
				'https://aivocalremover.com/api/v2/ProcessFile',
				{
					method: 'post',
					body: `file_name=${data.file_name}&action=watermark_video&key=X9QXlU9PaCqGWpnP1Q4IzgXoKinMsKvMuMn3RYXnKHFqju8VfScRmLnIGQsJBnbZFdcKyzeCDOcnJ3StBmtT9nDEXJn&web=web`,
					headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
				}
			);

			await fs.unlink(input);
			loggers.info(`${color('Removed Sound', 'pink')} for ${color(sender, 'lilac')}`);
			resolve({ result: { vocal, instrumental } });
		} catch (err) {
			log(err);
			loggers.error(`${color('Failed to Remove Sound', 'red')} for ${color(sender, 'lilac')}`);
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
		try {
			let petted;

			await new Promise(async (res) => {
				petted = await petting(input, opts);
				await fs.writeFile(`${opts.filename}.gif`, petted);
				res();
			});

			if (opts.output === 'sticker') {
				const file = await sharp(await fs.readFile(`${opts.filename}.gif`), { animated: true })
					.toFormat('webp')
					.webp()
					.toBuffer();
				const sticker = await client.instance.prepareSticker(file, `${opts.filename}-done.webp`, 'stickerAnimated', {
					author: configuration.author,
					packname: configuration.packname
				});

				fs.existsSync(`${opts.filename}.gif`) && (await fs.unlink(`${opts.filename}.gif`));
				fs.existsSync(`${opts.filename}-done.webp`) && (await fs.unlink(`${opts.filename}-done.webp`));
				resolve(sticker);
				return;
			}

			const { output } = await gif2mp4(`${input}.gif`, `${input}.mp4`, opts);

			resolve(await fs.readFile(output));
			fs.existsSync(input) && (await fs.unlink(input));
			fs.existsSync(`${input}.gif`) && (await fs.unlink(`${input}.gif`));
			fs.existsSync(output) && (await fs.unlink(output));
		} catch (err) {
			loggers.error(`${color('Failed to Pet Image', 'red')} for ${color(sender, 'lilac')}`);
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
export const mergeVideoWithAudio = (video, audio, output, sender, referer) =>
	new Promise(async (resolve, reject) => {
		let command = 'ffmpeg ';

		if (referer) {
			command += `-headers "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36"$'\r\n'"Referer: ${referer}"$'\r\n' `;
		}

		command += `-i "${video}" `;

		command += `-i "${audio}" -c:v copy -c:a copy "${output}"`;

		try {
			loggers.warning(`${color('Merging files', 'pink')}`);
			asyncRetry(
				() => {
					exec(command, async (err) => {
						if (err) {
							loggers.error(`${color('Failed to Merge Audio to Video', 'red')}`);
							reject(err);
							return;
						}

						loggers.info(`${color('Completed merging', 'pink')}`);
						const buffer = await fs.readFile(output);

						await fs.unlink(output);
						resolve(buffer);
					});
				},
				{
					retries: 5
				}
			);
		} catch (err) {
			loggers.error(`${color('Failed to Merge Audio to Video', 'red')} for ${color(sender, 'lilac')}`);
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
					'X-Api-Key': apiKey
				},
				responseType: 'arraybuffer'
			});

			await fs.unlink(input);
			await fs.unlink(output);
			loggers.info(`${color('Removing image background success', 'pink')} for ${color(sender, 'lilac')}`);
			resolve(new Buffer.from(data, 'base64'));
		} catch (error) {
			await fs.unlink(output);
			await fs.unlink(input);

			loggers.error(
				`⚠️ ${color('Failed to Remove image background', 'red')} for ${color(
					sender, 'lilac')}\nRemove Background Token Used : ${apiKey}`
			);
			reject(error);
		}
	});

const _api = (path, version) => `https://api.alcaamado.es/api/${version}/waifu2x${path}`;
const _apiV2 = 'https://api.deepai.org/api/torch-srgan';

/**
 * Enhance image using Waifu2x enhancer API.
 * @param {string} input file input path.
 * @param {string} sender
 * @returns {Promise<{Buffer}>}
 * @throws {Error}
 */

export const waifu2x = (input, sender) =>
	new Promise(async (resolve, reject) => {
		let output;

		if (isBuffer) {
			output = path.join(__dirname, `src/media/temporary_files/${sender}.png`);
			await sharp(input).toFormat('png').toFile(output);
		} else if (await fs.exists(input)) {
			await sharp(input).toFormat('png').toFile(output);
		} else if (isURL(input)) {
			input = await fetchBUFFER(input);
			await sharp(input).toFormat('png').toFile(output);
		} else {
			output = input.replace(input.slice(input.lastIndexOf('.'), input.length), '.png');
		}

		try {
			const file = streamFile(output);

			const form = new FormData();

			form.append('denoise', 2);
			form.append('scale', 'true');
			form.append('file', file);

			const {
				data: { hash }
			} = await axios.post(_api('/convert', 'v1'), form, {
				headers: {
					'Accept-Language': 'en-US,en;q=0.9',
					Referer: 'https://waifu2x.pro/',
					Accept: 'application/json',
					'Use-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					...form.getHeaders()
				}
			});

			try {
				await asyncRetry(
					async () => {
						const {
							data: { finished }
						} = await axios.get(_api('/get', 'v2'), {
							params: {
								hash,
								type: 'png'
							},
							responseType: 'arraybuffer'
						});

						if (finished) {
							return;
						}
					},
					{ retries: 10, factor: 1 }
				);
			} catch (err) {
				console.log(err);
			}

			const { data } = await axios.get(_api('/get', 'v2'), {
				params: {
					hash,
					type: 'png'
				},
				responseType: 'arraybuffer'
			});

			loggers.info(`${color('Image has been succesfully enhanced', 'pink')} for ${color(sender, 'lilac')}`);

			if (await fs.pathExists(input)) {
				await fs.unlink(input);
			}

			if (await fs.pathExists(input)) {
				await fs.unlink(input);
			}

			resolve(new Buffer.from(data, 'base64'));
		} catch (err) {
			loggers.error(`${color('Failed to Enhance image', 'red')} for ${color(sender, 'lilac')}`);

			if (await fs.pathExists(input)) {
				await fs.unlink(input);
			}

			reject(err);
		}
	});

export const waifu2xV2 = (input, filename) =>
	new Promise(async (resolve, reject) => {
		try {
			input = fs.writeFileSync(filename, input);
			input = fs.createReadStream(filename);

			const form = new FormData();
			const axiosInstance = axios.create({ headers: { 'client-library': 'deepai-js-client' } });

			axiosInstance.defaults.headers.common['api-key'] = process.env.DEEP_KEY;
			const reqOptions = {
				withCredentials: true
			};

			form.append('image', input);
			reqOptions.headers = form.getHeaders();
			const { data } = await axiosInstance.post(_apiV2, form, reqOptions);

			if (!data.output_url) {
				reject(new Error('Cannot get the output result.'));
			}

			await fs.unlink(filename);

			resolve(await fetchBUFFER(data.output_url));
		} catch (err) {
			console.log(err);
		}
	});

export const imageToPdf = (images) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!Array.isArray(images)) {
				images = [images];
			}

			const buffers = [];
			const size = [595.28, 841.89];
			const doc = new PDFDocument({ margin: 0, size, autoFirstPage: false });
			const stream = new Writable({
				write(chunk, encoding, callback) {
					buffers.push(chunk);
					callback();
				}
			});

			stream.on('finish', () => {
				const pdfBuffer = Buffer.concat(buffers);

				resolve(pdfBuffer);
			});

			stream.on('error', (err) => {
				reject(err);
			});

			doc.pipe(stream);

			images = (
				await Promise.all(
					images.map((v) => {
						if (isURL(v)) {
							return axios.get(v, { responseType: 'arraybuffer' });
						}

						return { data: fs.readFile(v) };
					})
				)
			).map((v) => v.data);

			for (let i = 0; i < images.length; i++) {
				doc.addPage();
				doc.image(images[i], 0, 0, { fit: size, align: 'center', valign: 'center' });
			}

			doc.end();
		} catch (error) {
			reject(error);
		}
	});

const DEFAULT_URL = 'https://ai.tu.qq.com/trpc.shadow_cv.ai_processor_cgi.AIProcessorCgi/Process';
const defaultOpts = {
	retries: 10,
	factor: 1
};

/**
 * Convert an existing image to anime-like using QQ A.I
 * @param {Buffer|string} image
 * @param {string} sender
 * @param {{proxy?: string | undefined, enhance?: boolean | undefined, forever?: boolean | undefined, unref: boolean | undefined, maxRetryTime?: number | undefined, retries?: number | undefined, factor?: number | undefined, minTimeout?: number | undefined, maxTimeout?: number | undefined, randomize?: boolean | undefined, crop: 'COMPARED' | 'SINGLE', onRetry: (e) => any | undefined}} options
 * @returns {Promise<Buffer>}
 * @throws {Error}
 */
export const imageToAnime = async (image, sender, options = defaultOpts) => {
	options = Object.assign(defaultOpts, options);

	const useProxy = !!options.proxy;
	let httpsAgent;

	if (useProxy) {
		httpsAgent = /^socks/.test(options.proxy)
			? new socksProxyAgent.SocksProxyAgent(options.proxy)
			: new httpsProxyAgent.HttpsProxyAgent(options.proxy);
		httpsAgent.timeout = 30_000;
	}

	const imageRequest = await imageToBuffer(image, options.proxy ? httpsAgent : undefined, options);

	const imgString = imageRequest.toString('base64');

	const obj = {
		busiId: 'ai_painting_anime_img_entry',
		images: [imgString],
		extra: JSON.stringify({
			face_rects: [] /* eslint-disable-line */,
			version: 2,
			platform: 'web'
		})
	};

	let data = {
		img_urls: [imgString] /* eslint-disable-line */
	};

	try {
		data = await asyncRetry(
			async (bail) => {
				const response = await axios.request({
					method: 'POST',
					url: DEFAULT_URL,
					data: obj,
					headers: {
						'Content-Type': 'application/json',
						Origin: 'https://h5.tu.qq.com',
						Referer: 'https://h5.tu.qq.com/',
						'User-Agent':
							'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
						'x-sign-value': signV1(obj),
						'x-sign-version': 'v1'
					},
					timeout: 30_000,
					...(useProxy ? { httpsAgent } : {})
				});

				const data = response?.data;

				if (!data) {
					throw new Error('Failed to resolve data. Try again later.');
				}

				if (data.msg === 'VOLUMN_LIMIT') {
					throw new Error('Rated limited by the API.');
				}

				if (data.msg === 'IMG_ILLEGAL') {
					bail(new Error('Your image contains pornographic, gore, and abusive material.'));
					return;
				}

				if (data.code === 1001) {
					bail(new Error('The image input did not match any criteria. Face need to be visible on the image.'));
					return;
				}

				if (data.code === -2100) {
					bail(new Error('Failed to resolve data. Try again later.'));
					return;
				}

				if (data.code === 2119 || data.code === -2111) {
					bail(new Error('Seems the API does not like us. Report this error so we will fix it ASAP.'));
					return;
				}

				if (!data.extra) {
					throw new Error('Failed to resolve data. Try again later.');
				}

				return JSON.parse(data.extra);
			},
			{
				...options
			}
		);
	} catch (error) {
		throw new Error(typeof error === 'string' ? error : error.message);
	}
	const result = data.img_urls[1] || data.img_urls[0];

	return options.enhance
		? waifu2xV2(
				await cropImage(
					await imageToBuffer(result, options.proxy?.image ? httpsAgent : undefined, options),
					options.crop === 'SINGLE' ? 'SINGLE' : options.crop === 'COMPARED' ? 'COMPARED' : undefined
				),
				`./src/media/temporary_files/${sender}`
			) /* eslint-disable-line */
		: await cropImage(
				await imageToBuffer(result, options.proxy?.image ? httpsAgent : undefined, options),
				options.crop === 'SINGLE' ? 'SINGLE' : options.crop === 'COMPARED' ? 'COMPARED' : undefined
			); /* eslint-disable-line */
};

/**
 * Generate a mesh gradient SVG buffer
 * @param {Object} options
 * @param {string[]} options.colors - Array of colors in HEX format
 * @param {number} [options.width=800] - Width of output
 * @param {number} [options.height=600] - Height of output
 * @returns {Buffer} SVG buffer
 */
export const createMeshGradient = ({ colors, width = 800, height = 600 }) => {
	let palette = colors;

	let defs = '';
	let rects = '';

	palette.forEach((color, i) => {
		const id = `grad${i}`;
		const cx = Math.random() * 100;
		const cy = Math.random() * 100;
		const r = 50 + Math.random() * 50;

		defs += `
      <radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="${r}%">
        <stop offset="0%" stop-color="${color}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
    `;

		rects += `<rect width="100%" height="100%" fill="url(#${id})"/>`;
	});

	const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>${defs}</defs>
      <rect width="100%" height="100%" fill="${palette[0]}"/>
      ${rects}
    </svg>
  `;

	return Buffer.from(svg);
};
