import Canvas from '@napi-rs/canvas';
import emojiReg from 'emoji-regex';
import path from 'path';
import { fileURLToPath } from 'url';
import WebPMux from 'node-webpmux';

import { color, loggers } from '../../utils/modules/index.js';
import { buildExifBuffer } from '../../utils/misc/create-exif.js';
import { scheme } from '../misc/palettes/colors.js';
import { fillText } from './fill-text.js';

const { createCanvas, GlobalFonts } = Canvas;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/Chevin Bold.ttf'), 'chevin');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/texgyreadventor-bold.otf'), 'texgy');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/SourceSansPro-Italic.ttf'), 'sanspro');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/KeepCalm-Medium.ttf'), 'calm');

function loadColorsPalette(colored) {
	const defaultColors = [
		['047af6', '7401df', '202532', '32fa00', 'ff00d5'],
		['4db1c3', '046084', '35b07e', 'f0a7aa', 'e74758'],
		['ffffff', 'f7a9ef', 'f881ec', 'f751e6', 'c400b0'],
		['ffaf39', 'ee7e1b', 'ef421b', 'cf214b', 'bf1679'],
		['86ff5d', '34e361', '14d285', '0ebb9b', '0c9ea9'],
		['e0f4ff', 'cbecff', 'afe2ff', 'afd5ff', 'afc8ff'],
		['d2dbde', '8debff', '84b7ff', 'b8b8b8', '08e1ff'],
		['ffef2b', '2f4af4', 'ee1c62', '33ee87', '6cfcff'],
		['6500ff', 'ffe04e', '8b00ff', 'bd93ed', '7400ff'],
		scheme().map((v) => v.replace('#', ''))
	];

	return [].concat(...Array(1).fill(colored ?? defaultColors[Math.floor(Math.random() * defaultColors.length)]));
}

export const attp = async (sender, texts, colored, fonts) => {
	fonts = fonts !== undefined ? fonts.toLowerCase() : 'chevin';
	colored = colored.length ? colored : null;

	loggers.warning(`${color('Generating Animated Image', 'pink')} for ${color(sender, 'lilac')}`);

	const canvas = createCanvas(500, 500);
	const ctx = canvas.getContext('2d');
	const colors = loadColorsPalette(colored);
	const regex = new RegExp(emojiReg(), 'g');

	texts = texts.trim().replace(regex, '');

	const frameBuffers = [];

	for (const colori of colors) {
		const reassignColor = colori.startsWith('#') ? colori : `#${colori}`;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = reassignColor;

		fillText(canvas, texts, {
			font: `82px ${fonts}`,
			textAlign: 'center',
			verticalAlign: 'middle',
			sizeToFill: true
		});

		frameBuffers.push(Buffer.from(canvas.toBuffer('image/webp')));
	}

	const frames = [];

	for (const buf of frameBuffers) {
		frames.push(await WebPMux.Image.generateFrame({ buffer: buf, delay: 150, x: 0, y: 0, blend: false, dispose: true }));
	}

	const exif = buildExifBuffer('Made by Nanda', 'Aestherix Animated Sticker using Canvas and WebP');

	const result = await WebPMux.Image.save(null, {
		frames,
		width: 500,
		height: 500,
		loops: 0,
		exif: { raw: exif }
	});

	loggers.info(`${color('Animated Image is generated', 'pink')} for ${color(sender, 'lilac')}`);

	return result;
};
