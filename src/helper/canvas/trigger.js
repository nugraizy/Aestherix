import Canvas from '@napi-rs/canvas';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import WebPMux from 'node-webpmux';

import configuration from '../config/connect.js';
import { buildExifBuffer } from '../../utils/misc/create-exif.js';
import { color, loggers } from '../../utils/modules/index.js';

const { createCanvas, loadImage } = Canvas;

const WIDTH = 640;
const HEIGHT = 694;
const BR = 84;
const LR = 56;
const FRAME_COUNT = 9;

const TRIGGERED = await readFile('./src/media/triggered.png');
const triggerBase = await loadImage(TRIGGERED);

export class TriggerEffect {
	#width = WIDTH;
	#height = HEIGHT;

	#renderFrames(img) {
		const canvas = createCanvas(this.#width, this.#height);
		const ctx = canvas.getContext('2d');
		const frames = [];

		for (let i = 0; i < FRAME_COUNT; i++) {
			ctx.clearRect(0, 0, this.#width, this.#height);
			ctx.drawImage(
				img,
				Math.floor(Math.random() * BR) - BR,
				Math.floor(Math.random() * BR) - BR,
				this.#width + BR,
				this.#height - 54 + BR
			);

			ctx.fillStyle = '#FF000033';
			ctx.fillRect(0, 0, this.#width, this.#height);
			ctx.drawImage(
				triggerBase,
				Math.floor(Math.random() * LR) - LR,
				this.#height - 54 + Math.floor(Math.random() * LR) - LR,
				this.#width + LR,
				54 + LR
			);

			frames.push(Buffer.from(canvas.toBuffer('image/webp')));
		}

		return frames;
	}

	async #toAnimatedWebp(frameBuffers) {
		const frames = [];

		for (const buf of frameBuffers) {
			frames.push(await WebPMux.Image.generateFrame({ buffer: buf, delay: 50, x: 0, y: 0, blend: false, dispose: true }));
		}

		const exif = buildExifBuffer(configuration.packname, configuration.author);

		return WebPMux.Image.save(null, {
			frames,
			width: this.#width,
			height: this.#height,
			loops: 0,
			exif: { raw: exif }
		});
	}

	#toMp4(frameBuffers) {
		return new Promise((resolve, reject) => {
			const ffmpeg = spawn('ffmpeg', [
				'-framerate', '20',
				'-f', 'image2pipe',
				'-vcodec', 'webp',
				'-i', 'pipe:0',
				'-pix_fmt', 'yuv420p',
				'-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
				'-movflags', 'frag_keyframe+empty_moov',
				'-f', 'mp4',
				'pipe:1'
			], { stdio: ['pipe', 'pipe', 'ignore'] });

			const chunks = [];

			ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
			ffmpeg.on('close', (code) => {
				if (code !== 0) {
					return reject(new Error(`ffmpeg exited with code ${code}`));
				}

				resolve(Buffer.concat(chunks));
			});
			ffmpeg.on('error', reject);

			for (const frame of frameBuffers) {
				ffmpeg.stdin.write(frame);
			}

			ffmpeg.stdin.end();
		});
	}

	async render(image, { output = 'sticker' } = {}) {
		loggers.warning(`${color('Generating trigger effect', 'pink')}`);

		const img = await loadImage(image);
		const frames = this.#renderFrames(img);

		if (output === 'sticker') {
			return this.#toAnimatedWebp(frames);
		}

		return this.#toMp4(frames);
	}
}


