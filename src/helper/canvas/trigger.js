import Canvas from '@napi-rs/canvas';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import WebPMux from 'node-webpmux';

import configuration from '../config/connect.js';
import { buildExifBuffer } from '../../utils/misc/create-exif.js';
import { color, loggers } from '../../utils/modules/index.js';

const { createCanvas, loadImage } = Canvas;

const WIDTH = 640;
const HEIGHT = 640 + 54;
const BR = 30 * 2.8;
const LR = 20 * 2.8;
const FRAME_COUNT = 9;

const TRIGGERED = await readFile('./src/media/triggered.png');
const base = await loadImage(TRIGGERED);

function renderFrames(img) {
	const canvas = createCanvas(WIDTH, HEIGHT);
	const ctx = canvas.getContext('2d');
	const frames = [];

	for (let i = 0; i < FRAME_COUNT; i++) {
		ctx.clearRect(0, 0, WIDTH, HEIGHT);
		ctx.drawImage(
			img,
			Math.floor(Math.random() * BR) - BR,
			Math.floor(Math.random() * BR) - BR,
			WIDTH + BR,
			HEIGHT - 54 + BR
		);

		ctx.fillStyle = '#FF000033';
		ctx.fillRect(0, 0, WIDTH, HEIGHT);
		ctx.drawImage(
			base,
			Math.floor(Math.random() * LR) - LR,
			HEIGHT - 54 + Math.floor(Math.random() * LR) - LR,
			WIDTH + LR,
			54 + LR
		);

		frames.push(Buffer.from(canvas.toBuffer('image/webp')));
	}

	return frames;
}

async function framesToAnimatedWebp(frameBuffers) {
	const frames = [];

	for (const buf of frameBuffers) {
		frames.push(await WebPMux.Image.generateFrame({ buffer: buf, delay: 50, x: 0, y: 0, blend: false, dispose: true }));
	}

	const exif = buildExifBuffer(configuration.packname, configuration.author);

	return WebPMux.Image.save(null, {
		frames,
		width: WIDTH,
		height: HEIGHT,
		loops: 0,
		exif: { raw: exif }
	});
}

function framesToMp4(frameBuffers) {
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

export const trigger = async (image, sender, opt) => {
	loggers.warning(`${color('Generating Triggered Image', 'pink')} for ${color(sender, 'lilac')}`);

	const img = await loadImage(image);
	const frames = renderFrames(img);

	if (opt.output === 'sticker') {
		return framesToAnimatedWebp(frames);
	}

	return framesToMp4(frames);
};
