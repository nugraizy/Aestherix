import Canvas from '@napi-rs/canvas';
import Wrap from 'canvas-text-wrapper';
import { exec } from 'child_process';
import emojiReg from 'emoji-regex';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';

import { createExif } from '../../utils/misc/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { scheme } from '../misc/palettes/colors.js';

const { createCanvas, GlobalFonts } = Canvas;
const { CanvasTextWrapper } = Wrap;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Chevin Bold.ttf'), 'chevin');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/texgyreadventor-bold.otf'), 'texgy');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/SourceSansPro-Italic.ttf'), 'sanspro');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/KeepCalm-Medium.ttf'), 'calm');

const saveImages = (buffer, sequence) => {
	const fileName = path.join(__dirname, `src/media/temporary_files/animated_images-${sequence}.webp`);

	writeFileSync(fileName, buffer);
	return fileName;
};

const createSequence = async (images, sender) => {
	const pathExif = path.join(__dirname, 'src/media/temporary_files/data.exif');
	const pathResults = path.join(__dirname, `src/media/temporary_files/animated_images-${Date.now()}`);

	return new Promise(async (resolve, reject) => {
		exec(`img2webp -loop 1 ${images.map((v) => `"${v}"`).join(' ')} -o "${pathResults}.webp"`, (er) => {
			if (er) {
				loggers.error(`${color('Failed to Convert Media to Sticker', '#FF5555')} for ${color(sender, '#E4C1F9')}`);
				reject(er);
			}

			exec(`webpmux -set exif "${pathExif}" "${pathResults}.webp" -o "${pathResults}-done.webp"`, (err) => {
				if (err) {
					loggers.error(`${color('Failed to Convert Media to Sticker', '#FF5555')} for ${color(sender, '#E4C1F9')}`);
					reject(err);
				}

				const buffers = readFileSync(`${pathResults}-done.webp`);

				unlinkSync(`${pathResults}-done.webp`);
				unlinkSync(`${pathResults}.webp`);

				for (const paths of images) {
					unlinkSync(paths);
				}

				resolve({
					buffers
				});
			});
		});
	});
};

const createCanvasTemplates = () => {
	const canvas = createCanvas(500, 500);
	const ctx = canvas.getContext('2d');

	return { ctx, canvas };
};

const loadColorsPalette = (color) => {
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
		scheme().map((v) => v.replace('#', '')) // for more randomize
	];

	return [].concat(...Array(1).fill(color ?? defaultColors[Math.floor(Math.random() * defaultColors.length)]));
};

export const attp = (sender, texts, colored, fonts) =>
	new Promise(async (resolve) => {
		createExif('Made by Nanda', 'Aestherix Animated Sticker using Canvas and WebP');

		fonts = fonts !== undefined ? fonts.toLowerCase() : 'chevin';
		colored = colored.length ? colored : null;

		loggers.warning(`${color('Generating Animated Image', '#FF99C8')} for ${color(sender, '#E4C1F9')}`);

		let i = 0;
		let { ctx, canvas } = createCanvasTemplates();
		const colors = loadColorsPalette(colored);
		const bufferContainer = [];

		const regex = new RegExp(emojiReg(), 'g');

		texts = texts.trim().replace(regex, '');

		for (const colori of colors) {
			const reassignColor = colori.startsWith('#') ? colori : `#${colori}`;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = reassignColor;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.shadowColor = reassignColor;
			ctx.shadowBlur = 2;

			CanvasTextWrapper(canvas, texts, {
				font: `82px ${fonts}`,
				textAlign: 'center',
				verticalAlign: 'middle',
				sizeToFill: true
			});

			const buffer = canvas.toBuffer('image/webp');
			const saved = saveImages(new Buffer.from(buffer, 'base64'), i);

			bufferContainer.push(saved);
			i++;
		}

		createSequence(bufferContainer, sender).then(({ buffers }) => {
			loggers.info(`${color('Animated Image is generated', '#FF99C8')} for ${color(sender, '#E4C1F9')}`);

			resolve(buffers);
		});
	});
