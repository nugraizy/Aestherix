import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import { Writable } from 'node:stream';
import PDFDocument from 'pdfkit';
import petting from 'pet-pet-gif';
import sharp from 'sharp';

import configuration from '../../helper/config/connect.js';
import { color, isURL, loggers } from '../modules/index.js';
import { streamFile } from './utils/index.js';
import { gif2mp4 } from './video.js';

export const removeBg = (input, sender) =>
	new Promise(async (resolve, reject) => {
		const apiKeys = (process.env.REMOVEBG_KEY || '').split('\n').filter(Boolean);

		if (!apiKeys.length) {
			reject(new Error('REMOVEBG_KEY environment variable is not set'));
			return;
		}

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

			stream.on('finish', () => resolve(Buffer.concat(buffers)));
			stream.on('error', (err) => reject(err));
			doc.pipe(stream);

			images = (
				await Promise.all(
					images.map((v) => {
						if (Buffer.isBuffer(v)) {
							return { data: v };
						}

						if (isURL(v)) {
							return axios.get(v, { responseType: 'arraybuffer' });
						}

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
