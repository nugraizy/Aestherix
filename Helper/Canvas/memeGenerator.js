/* global Buffer */
import Canvas from 'canvas';
import Wrap from 'canvas-text-wrapper';
import { exec } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import sizeOf from 'image-size';
import moment from 'moment-timezone';
import path from 'path';

import { __dirname } from '../../index.js';
import { createExif } from '../../Utils/Misc/index.js';
import { color, ERRLOG, INFOLOG } from '../Modules/functions.js';

const { createCanvas, registerFont, loadImage } = Canvas;
const { CanvasTextWrapper } = Wrap;

const saveImages = async (buffer, sequence) => {
	const paths = `Temporary Files/Meme Generator-${sequence}.png`;
	const fileName = path.join(__dirname, paths);

	writeFileSync(fileName, buffer);

	return fileName;
};

const insertExif = async (paths, sender) =>
	new Promise(async (resolve, reject) => {
		const time = moment().format('HH:mm:ss DD/MM');

		const pathExif = path.join(__dirname, 'Temporary Files/data.exif');
		const pathResults = path.join(__dirname, `Temporary Files/Meme Generator-${Date.now()}`);

		createExif('Made by Nanda', 'Void Meme Generator using Canvas and WebP');

		exec(
			`ffmpeg -i "${paths}" -vcodec libwebp -vf "scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=30" -lossless 0 -an -vsync 0 -s 512:512 "${pathResults}.webp"`,
			(er) => {
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
					unlinkSync(paths);

					resolve({
						buffers,
					});
				});
			},
		);
	});

export const memeGenerator = (sender, input, topTexts = '', bottomTexts = '', type = 'image', WATERMARK) =>
	new Promise(async (resolve, reject) => {
		try {
			if (topTexts == '' && bottomTexts == '') {
				return resolve({ error: 'No Texts Provided' });
			}

			const time = moment().format('HH:mm:ss DD/MM');

			const { width, height } = sizeOf(input);

			topTexts = topTexts.substring(0, 40);
			bottomTexts = bottomTexts.substring(0, 40);

			registerFont('./Media Files/Fonts/impact.ttf', { family: 'impact' });
			registerFont('./Media Files/Fonts/SourceSansPro-Light.ttf', { family: 'source' });

			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			const images = await loadImage(input);

			ctx.drawImage(images, 0, 0, canvas.width, canvas.height);
			ctx.fill();

			const MULTIPLE = 1.5;

			ctx.fillStyle = '#FFFFFF';
			ctx.strokeStyle = '#000000';
			ctx.lineWidth = 5;

			let fontSize = String(height).length <= 3 ? String(height).substring(0, 2) : String(height).substring(0, 3);

			fontSize = 2 * Math.round((parseInt(fontSize) * MULTIPLE) / 2);

			CanvasTextWrapper(canvas, topTexts, { font: `${fontSize}px impact`, textAlign: 'center', verticalAlign: 'top', paddingY: 20, maxFontSizeToFill: 42, strokeText: true });
			CanvasTextWrapper(canvas, bottomTexts, { font: `${fontSize}px impact`, textAlign: 'center', verticalAlign: 'bottom', paddingY: 20, maxFontSizeToFill: 42, strokeText: true });

			ctx.fillStyle = '#000000';
			ctx.strokeStyle = '#FFFFFF';
			ctx.lineWidth = 1;

			CanvasTextWrapper(canvas, WATERMARK, {
				font: '18px source',
				verticalAlign: 'middle',
				textAlign: 'left',
				paddingX: 20,
				maxFontSizeToFill: 42,
				strokeText: true,
			});

			if (type == 'sticker') {
				saveImages(new Buffer.from(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''), 'base64'), sender)
					.then((saved) => {
						insertExif(saved, sender)
							.then(({ buffers }) => {
								INFOLOG(`[${color(time, 'cyan')}]`, `${color('Meme Generator is Done', '#01cdfe')} for ${color(sender, '#ff71ce')}`);
								unlinkSync(input);

								resolve(buffers);
							})
							.catch(reject);
					})
					.catch(reject);
			} else {
				unlinkSync(input);

				resolve(new Buffer.from(canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''), 'base64'));
			}
		} catch (err) {
			unlinkSync(input);

			reject({ name: 'Not Supported.', message: 'Can not convert a .png image without fixed dimension. Try other image.' });
		}
	});
