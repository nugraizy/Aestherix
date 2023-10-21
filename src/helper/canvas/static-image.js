import Canvas from '@napi-rs/canvas';
import Wrap from 'canvas-text-wrapper';
import { exec } from 'child_process';
import emojiReg from 'emoji-regex';
import fs, { readFileSync, unlinkSync } from 'fs';
import path from 'path';

import { createExif } from '../../utils/misc/index.js';
import { scheme } from '../misc/palettes/colors.js';
import { color, ERRLOG, INFOLOG } from '../../utils/modules/index.js';

const { createCanvas, GlobalFonts } = Canvas;
const { CanvasTextWrapper } = Wrap;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/Chevin Bold.ttf'), 'chevin');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/texgyreadventor-bold.otf'), 'texgy');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/SourceSansPro-Italic.ttf'), 'sanspro');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/KeepCalm-Medium.ttf'), 'calm');

const random = (input) => input[Math.floor(Math.random() * input.length)];

const saveImages = async (buffer) => {
	const paths = `src/media/temporary_files/static_images-${Date.now()}.webp`;
	const fileName = path.join(__dirname, paths);

	await fs.promises.writeFile(fileName, buffer);
	return fileName;
};

const insertExif = async (paths, sender) =>
	new Promise(async (resolve, reject) => {
		const pathExif = path.join(__dirname, 'src/media/temporary_files/data.exif');
		const pathResults = paths;

		exec(`webpmux -set exif "${pathExif}" "${pathResults}" -o "${pathResults}-done.webp"`, (err) => {
			if (err) {
				ERRLOG(`⚠️ ${color('Failed to Convert Media to Sticker', '#FF5555')} for ${color(sender, '#ff71ce')}`);

				reject(err);
			}

			const buffers = readFileSync(`${pathResults}-done.webp`);

			unlinkSync(`${pathResults}-done.webp`);
			unlinkSync(`${pathResults}`);

			resolve({
				buffers
			});
		});
	});

const createCanvasTemplates = () => {
	const canvas = createCanvas(500, 500);
	const ctx = canvas.getContext('2d');

	return { ctx, canvas };
};

const loadColorsPalette = (color = null) => {
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

	if (color) {
		return random(color);
	}

	return random([].concat(...Array(3).fill(defaultColors[Math.floor(Math.random() * defaultColors.length)])));
};

export const ttp = (sender, texts, colors, fonts) =>
	new Promise(async (resolve, reject) => {
		createExif('Made by Nanda', 'Void Static Sticker using Canvas and WebP');

		fonts = fonts !== undefined ? fonts.toLowerCase() : 'chevin';
		colors = colors.length === 0 ? null : colors;

		INFOLOG(`${color('Making Static Image', 'cyan')} for ${color(sender, '#ff71ce')}`);

		let { ctx, canvas } = createCanvasTemplates();
		const colori = loadColorsPalette(colors);
		const reassignColor = colori.startsWith('#') ? colori : `#${colori}`;

		ctx.fillStyle = reassignColor;
		ctx.shadowOffsetX = 1;
		ctx.shadowOffsetY = 1;
		ctx.shadowColor = reassignColor;
		ctx.shadowBlur = 2;

		CanvasTextWrapper(canvas, texts.trim().replace(new RegExp(emojiReg(), 'g'), ''), {
			font: `82px ${fonts}`,
			textAlign: 'center',
			verticalAlign: 'middle',
			sizeToFill: true
		});

		const buffer = canvas.toBuffer('image/webp');

		saveImages(new Buffer.from(buffer, 'base64'), sender)
			.then((saved) => {
				insertExif(saved, sender)
					.then(({ buffers }) => {
						INFOLOG(`${color('Static Image is Done', 'cyan')} for ${color(sender, '#ff71ce')}`);

						resolve(buffers);
					})
					.catch(reject);
			})
			.catch(reject);
	});
