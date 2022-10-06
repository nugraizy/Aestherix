import Canvas from 'canvas';
import Wrap from 'canvas-text-wrapper';
import { exec } from 'child_process';
import emojiReg from 'emoji-regex';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import moment from 'moment-timezone';
import path from 'path';

import { __dirname } from '../../index.js';
import { createExif } from '../../Utils/Misc/index.js';
import { scheme } from '../Misc/Palettes/colors.js';
import { color, ERRLOG, INFOLOG } from '../Modules/functions.js';

const { createCanvas, registerFont } = Canvas;
const { CanvasTextWrapper } = Wrap;

const saveImages = (buffer, sequence) => {
	const fileName = path.join(__dirname, `./Temporary Files/Animated Images-${sequence}.webp`);

	writeFileSync(fileName, buffer);

	return fileName;
};

const createSequence = async (images, sender) =>
	new Promise(async (resolve, reject) => {
		createExif('Made by Nanda', 'Void Animated Sticker using Canvas and WebP');

		const time = moment().format('HH:mm:ss DD/MM');

		const pathExif = path.join(__dirname, 'Temporary Files/data.exif');
		const pathResults = path.join(__dirname, `Temporary Files/Animated Images-${Date.now()}`);

		exec(`img2webp -loop 1 ${images.map((v) => `"${v}"`).join(' ')} -o "${pathResults}.webp"`, (er) => {
			if (er) {
				ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);

				reject(er);
			}

			exec(`webpmux -set exif "${pathExif}" "${pathResults}.webp" -o "${pathResults}-done.webp"`, (err) => {
				if (err) {
					ERRLOG(`[${color(time, 'cyan')}]`, `${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, '#ff71ce')}`);

					reject(err);
				}

				const buffers = readFileSync(`${pathResults}-done.webp`);

				unlinkSync(`${pathResults}-done.webp`);
				unlinkSync(`${pathResults}.webp`);

				for (const paths of images) {
					unlinkSync(paths);
				}

				resolve({
					buffers,
				});
			});
		});
	});

const createCanvasTemplates = (fonts) => {
	if (fonts == 'chevin') {
		registerFont('./Media Files/Fonts/Chevin Bold.ttf', { family: 'chevin' });
	} else if (fonts == 'texgy') {
		registerFont('./Media Files/Fonts/texgyreadventor-bold.otf', { family: 'texgy' });
	} else if (fonts == 'sanspro') {
		registerFont('./Media Files/Fonts/SourceSansPro-Italic.ttf', { family: 'sanspro' });
	} else if (fonts == 'calm') {
		registerFont('./Media Files/Fonts/KeepCalm-Medium.ttf', { family: 'calm' });
	}

	const canvas = createCanvas(360, 360);
	const ctx = canvas.getContext('2d');

	return { ctx, canvas };
};

const loadColorsPalette = async (color) => {
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
		scheme().map((v) => v.replace('#', '')), // for more randomize
	];

	return [].concat(...Array(1).fill(color ?? defaultColors[Math.floor(Math.random() * defaultColors.length)]));
};

export const attp = (sender, texts, colored, fonts) =>
	new Promise(async (resolve) => {
		const time = moment().format('HH:mm:ss DD/MM');

		fonts = fonts !== undefined ? fonts.toLowerCase() : 'chevin';
		colored = colored.length == 0 ? null : colored;

		INFOLOG(`[${color(time, 'cyan')}]`, `${color('Making Animated Image', '#01cdfe')} for ${color(sender, '#ff71ce')}`);

		let i = 0;
		let { ctx, canvas } = createCanvasTemplates(fonts);
		const colors = await loadColorsPalette(colored);
		const bufferContainer = [];

		for (const colori of colors) {
			const reassignColor = colori.startsWith('#') ? colori : `#${colori}`;

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = reassignColor;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.shadowColor = reassignColor;
			ctx.shadowBlur = 2;

			CanvasTextWrapper(canvas, texts.trim().replace(new RegExp(emojiReg(), 'g'), ''), {
				font: `56px ${fonts}`,
				textAlign: 'center',
				verticalAlign: 'middle',
				sizeToFill: true /* paddingX: 20 */,
			});

			const buffer = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
			const saved = saveImages(new Buffer.from(buffer, 'base64'), i);

			bufferContainer.push(saved);
			i++;
		}

		createSequence(bufferContainer, sender).then(({ buffers }) => {
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Animated Image is Done', '#01cdfe')} for ${color(sender, '#ff71ce')}`);

			resolve(buffers);
		});
	});
