import Canvas from '@napi-rs/canvas';

import { color, loggers } from '../../utils/modules/index.js';
import configuration from '../config/connect.js';
import { registerFonts } from './utils/helpers.js';

const { createCanvas, loadImage } = Canvas;

registerFonts();

export class MemeGenerator {
	#maxWidth = 480;
	#maxLines = 2;

	#drawText(ctx, x, y, text, fontSize, isBottom = false) {
		const lineHeightRatio = 1.5 * (isBottom ? -1 : 1);

		ctx.lineWidth = 2;
		ctx.strokeStyle = 'black';
		ctx.fillStyle = 'white';
		ctx.textAlign = 'center';
		ctx.font = `bold ${fontSize}pt impact`;

		const lineHeight = lineHeightRatio * fontSize;
		const words = text.toUpperCase().split(' ');
		let lines = [];
		let line = '';

		for (const word of words) {
			const testLine = line ? `${line} ${word}` : word;

			if (ctx.measureText(testLine).width > this.#maxWidth) {
				lines = isBottom ? [line, ...lines] : [...lines, line];
				line = word;
			} else {
				line = testLine;
			}
		}

		lines = isBottom ? [line, ...lines] : [...lines, line];

		if (lines.length > this.#maxLines) {
			this.#drawText(ctx, x, y, text, fontSize - 5, isBottom);
			return;
		}

		for (let i = 0; i < lines.length; i++) {
			ctx.strokeText(lines[i], x, y + lineHeight * i);
			ctx.fillText(lines[i], x, y + lineHeight * i);
		}
	}

	async render(client, input, topText = '', bottomText = '', type = 'image', width = 500) {
		if (!topText && !bottomText) {
			return { error: 'No Texts Provided' };
		}

		loggers.warning(`${color('Generating meme', 'pink')}`);

		const image = await loadImage(input);
		const height = (image.height / image.width) * width;
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		ctx.drawImage(image, 0, 0, width, height);

		if (topText) {
			ctx.textBaseline = 'top';
			this.#drawText(ctx, width / 2, 10, topText, 46);
		}

		if (bottomText) {
			ctx.textBaseline = 'bottom';
			this.#drawText(ctx, width / 2, height - 5, bottomText, 46, true);
		}

		if (type === 'sticker') {
			const buffer = client.prepareSticker(canvas.toBuffer('image/webp'), 'imageMessage', {
				author: configuration.author,
				packname: configuration.packname
			});

			loggers.info(`${color('Meme generated', 'pink')}`);

			return buffer;
		}

		return canvas.toBuffer('image/png');
	}
}


