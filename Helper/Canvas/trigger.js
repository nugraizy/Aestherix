/* global client, botNum */
import Canvas from '@napi-rs/canvas';
import GIFEncoder from 'gifencoder';
import moment from 'moment-timezone';
import sharp from 'sharp';

import configuration from '../../connect.js';
import { color, ERRLOG, isURL } from '../../Helper/Modules/index.js';
import { gif2mp4 } from '../../Utils/Converter/index.js';

const { readFile, unlink, writeFile } = (await import('fs-extra')).default;
const { createCanvas, loadImage } = Canvas;
const { fit } = sharp;

const width = 640;
const height = 640 + 54;
const BR = 30 * 2.8;
const LR = 20 * 2.8;

const prepareCanvas = async (images) => {
	const TRIGGERED = await readFile('./Media Files/triggered.png');

	const base = await loadImage(TRIGGERED);
	const image = await loadImage(images);

	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');

	return {
		base,
		image,
		ctx,
	};
};

export const trigger = async (image, sender, opt) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format('HH:mm:ss DD/MM');

		try {
			let i = 0;

			const GIF = new GIFEncoder(width, height);

			GIF.start();
			GIF.setRepeat(0);
			GIF.setDelay(15);

			const { base, image: images, ctx } = await prepareCanvas(image);

			while (i < 9) {
				ctx.clearRect(0, 0, width, height);
				ctx.drawImage(images, Math.floor(Math.random() * BR) - BR, Math.floor(Math.random() * BR) - BR, width + BR, height - 54 + BR);

				ctx.fillStyle = '#FF000033';

				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(base, Math.floor(Math.random() * LR) - LR, height - 54 + Math.floor(Math.random() * LR) - LR, width + LR, 54 + LR);
				GIF.addFrame(ctx);
				i++;
			}

			GIF.finish();

			const buffer = GIF.out.getData();

			if (opt.output == 'sticker') {
				const file = await sharp(buffer, { animated: true })
					.resize(width, height - 54, {
						fit: fit.contain,
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.webp({ quality: 60 })
					.toBuffer();

				const results = await client[botNum].applyExif(file, { packname: configuration.packname, author: configuration.author });

				resolve(results);
			} else {
				await writeFile(`${opt.filename}.gif`, buffer);

				const { output } = await gif2mp4(`${opt.filename}.gif`, `${opt.filename}.mp4`, opt);

				resolve(await readFile(output));

				await unlink(`${opt.filename}.gif`);
				await unlink(`${opt.filename}.mp4`);
				await unlink(`${isURL(image) ? `./Temporary Files/${sender}` : image}`);
				await unlink(`${isURL(image) ? `./Temporary Files/${sender}` : image}.webp`);
			}
		} catch (err) {
			ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Trigger an image', 'red')} for ${color(sender, '#ff71ce')}`);

			reject(err);
		}
	});
