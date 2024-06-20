import Canvas from '@napi-rs/canvas';
import path from 'path';

import configuration from '../config/connect.js';
import { color, INFOLOG } from '../../utils/modules/index.js';

const { createCanvas, loadImage, GlobalFonts } = Canvas;

GlobalFonts.registerFromPath(path.join('.', 'src/media/fonts/impact.ttf'), 'impact');
GlobalFonts.registerFromPath(path.join('.', 'src/media/fonts/SourceSansPro-Light.ttf'), 'source');

const drawText = (ctx, x, y, texts, fontSize, isBottom = false) => {
	const lineHeightRatio = 1.5 * (isBottom ? -1 : 1);
	const maxWidth = 480;
	const maxLines = 2;

	ctx.lineWidth = 2;
	ctx.strokeStyle = 'black';
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.font = `bold ${fontSize}pt impact`;

	const lineHeight = lineHeightRatio * fontSize;
	let lines = [];
	let line = '';

	const words = texts.toUpperCase().split(' ');

	words.forEach((word) => {
		const testLine = line ? `${line} ${word}` : word;
		const metrics = ctx.measureText(testLine);
		const testWidth = metrics.width;

		if (testWidth > maxWidth) {
			lines = isBottom ? [line, ...lines] : [...lines, line];
			line = word;
		} else {
			line = testLine;
		}
	});
	lines = isBottom ? [line, ...lines] : [...lines, line];

	if (lines.length > maxLines) {
		drawText(ctx, x, y, texts, fontSize - 5, isBottom);
	} else {
		lines.forEach((l, i) => {
			ctx.strokeText(l, x, y + lineHeight * i);
			ctx.fillText(l, x, y + lineHeight * i);
		});
	}
};

export const memeGenerator = (client, sender, input, topTexts = '', bottomTexts = '', type = 'image', width = 500) =>
	new Promise(async (resolve) => {
		if (topTexts === '' && bottomTexts === '') {
			return resolve({ error: 'No Texts Provided' });
		}

		const images = await loadImage(input);

		const { canvas, height } = (() => {
			const tempCanvasHeight = (images.height / images.width) * width;
			const tempCanvas = createCanvas(width, tempCanvasHeight);
			const tempCtx = tempCanvas.getContext('2d');

			tempCtx.clearRect(0, 0, width, tempCanvasHeight);
			tempCtx.drawImage(images, 0, 0, width, tempCanvasHeight);
			return { canvas: tempCanvas, height: tempCanvasHeight };
		})();

		const x = width / 2;
		const y = 10;
		const fontSizeTop = 23 * 2;
		const fontSizeBottom = 23 * 2;
		const ctx = canvas.getContext('2d');

		if (topTexts) {
			ctx.textBaseline = 'top';
			drawText(ctx, x, y, topTexts, fontSizeTop);
		}

		if (bottomTexts) {
			ctx.textBaseline = 'bottom';
			drawText(ctx, x, height - y / 2, bottomTexts, fontSizeBottom, true);
		}

		if (type === 'sticker') {
			const buffer = client.prepareSticker(canvas.toBuffer('image/webp'), undefined, undefined, {
				author: configuration.author,
				packname: configuration.packname
			});

			INFOLOG(`${color('Meme Generator is Done', '#FF99C8')} for ${color(sender, '#E4C1F9')}`);
			resolve(buffer);
		} else {
			resolve(canvas.toBuffer('image/png'));
		}
	});
