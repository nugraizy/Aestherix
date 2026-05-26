import asyncRetry from 'async-retry';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import httpsProxyAgent from 'https-proxy-agent';
import { Writable } from 'node:stream';
import PDFDocument from 'pdfkit';
import petting from 'pet-pet-gif';
import sharp from 'sharp';
import socksProxyAgent from 'socks-proxy-agent';

import configuration from '../../helper/config/connect.js';
import { color, fetchBUFFER, isURL, loggers } from '../modules/index.js';
import { cropImage, imageToBuffer, signV1, streamFile } from './utils/index.js';
import { gif2mp4 } from './video.js';

const _api = (path, version) => `https://api.alcaamado.es/api/${version}/waifu2x${path}`;
const _apiV2 = 'https://api.deepai.org/api/torch-srgan';

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
				headers: { ...form.getHeaders(), 'X-Api-Key': apiKey },
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
				`⚠️ ${color('Failed to Remove image background', 'red')} for ${color(sender, 'lilac')}\nRemove Background Token Used : ${apiKey}`
			);
			reject(error);
		}
	});

export const waifu2x = (input, sender) =>
	new Promise(async (resolve, reject) => {
		let output;

		if (Buffer.isBuffer(input)) {
			output = `./src/media/temporary_files/${sender}.png`;
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
					'Use-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36',
					...form.getHeaders()
				}
			});

			try {
				await asyncRetry(
					async () => {
						const { data: { finished } } = await axios.get(_api('/get', 'v2'), {
							params: { hash, type: 'png' },
							responseType: 'arraybuffer'
						});

						if (finished) {return;}
					},
					{ retries: 10, factor: 1 }
				);
			} catch (err) {
				loggers.error(color('File processing failed:', 'red'), err);
			}

			const { data } = await axios.get(_api('/get', 'v2'), {
				params: { hash, type: 'png' },
				responseType: 'arraybuffer'
			});

			loggers.info(`${color('Image has been succesfully enhanced', 'pink')} for ${color(sender, 'lilac')}`);

			if (await fs.pathExists(input)) {await fs.unlink(input);}

			if (await fs.pathExists(input)) {await fs.unlink(input);}

			resolve(new Buffer.from(data, 'base64'));
		} catch (err) {
			loggers.error(`${color('Failed to Enhance image', 'red')} for ${color(sender, 'lilac')}`);

			if (await fs.pathExists(input)) {await fs.unlink(input);}

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
			const reqOptions = { withCredentials: true };

			form.append('image', input);
			reqOptions.headers = form.getHeaders();
			const { data } = await axiosInstance.post(_apiV2, form, reqOptions);

			if (!data.output_url) {
				reject(new Error('Cannot get the output result.'));
			}

			await fs.unlink(filename);
			resolve(await fetchBUFFER(data.output_url));
		} catch (err) {
			loggers.error(color('File processing failed:', 'red'), err);
		}
	});

const DEFAULT_URL = 'https://ai.tu.qq.com/trpc.shadow_cv.ai_processor_cgi.AIProcessorCgi/Process';
const defaultOpts = { retries: 10, factor: 1 };

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
		extra: JSON.stringify({ face_rects: [], version: 2, platform: 'web' })
	};

	let data = { img_urls: [imgString] };

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
						'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
						'x-sign-value': signV1(obj),
						'x-sign-version': 'v1'
					},
					timeout: 30_000,
					...(useProxy ? { httpsAgent } : {})
				});

				const data = response?.data;

				if (!data) {throw new Error('Failed to resolve data. Try again later.');}

				if (data.msg === 'VOLUMN_LIMIT') {throw new Error('Rated limited by the API.');}

				if (data.msg === 'IMG_ILLEGAL') { bail(new Error('Your image contains pornographic, gore, and abusive material.')); return; }

				if (data.code === 1001) { bail(new Error('The image input did not match any criteria. Face need to be visible on the image.')); return; }

				if (data.code === -2100) { bail(new Error('Failed to resolve data. Try again later.')); return; }

				if (data.code === 2119 || data.code === -2111) { bail(new Error('Seems the API does not like us. Report this error so we will fix it ASAP.')); return; }

				if (!data.extra) {throw new Error('Failed to resolve data. Try again later.');}

				return JSON.parse(data.extra);
			},
			{ ...options }
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
			)
		: await cropImage(
				await imageToBuffer(result, options.proxy?.image ? httpsAgent : undefined, options),
				options.crop === 'SINGLE' ? 'SINGLE' : options.crop === 'COMPARED' ? 'COMPARED' : undefined
			);
};

export const pet = (input, sender, opts = {}, client) =>
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
				const sticker = await client.prepareSticker(file, 'stickerAnimated', {
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

export const imageToPdf = (images) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!Array.isArray(images)) {images = [images];}

			const buffers = [];
			const size = [595.28, 841.89];
			const doc = new PDFDocument({ margin: 0, size, autoFirstPage: false });
			const stream = new Writable({
				write(chunk, encoding, callback) {
					buffers.push(chunk);
					callback();
				}
			});

			stream.on('finish', () => resolve(Buffer.concat(buffers)));
			stream.on('error', (err) => reject(err));
			doc.pipe(stream);

			images = (
				await Promise.all(
					images.map((v) => {
						if (Buffer.isBuffer(v)) {return { data: v };}

						if (isURL(v)) {return axios.get(v, { responseType: 'arraybuffer' });}

						return { data: fs.readFile(v) };
					})
				)
			).map((v) => v.data);

			images = await Promise.all(
				images.map(async (buffer) => {
					try {
						const meta = await sharp(buffer).metadata();
						let nextBuffer = buffer;

						if (meta?.format === 'webp') {
							nextBuffer = await sharp(buffer).jpeg({ quality: 80 }).toBuffer();
						}

						return { buffer: nextBuffer, width: meta?.width || 0, height: meta?.height || 0 };
					} catch {
						return { buffer, width: 0, height: 0 };
					}
				})
			);

			for (let i = 0; i < images.length; i++) {
				const entry = images[i];
				const pageSize = entry.width && entry.height ? [entry.width, entry.height] : size;

				doc.addPage({ size: pageSize });
				doc.image(entry.buffer, 0, 0, { width: pageSize[0], height: pageSize[1] });
			}

			doc.end();
		} catch (error) {
			reject(error);
		}
	});


