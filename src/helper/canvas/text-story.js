import Canvas from '@napi-rs/canvas';

import { fillText } from './utils/fill-text.js';
import { registerFonts } from './utils/helpers.js';

const { createCanvas } = Canvas;

registerFonts();

function argbToRgba(num) {
	num >>>= 0;

	const b = num & 0xff;
	const g = (num & 0xff00) >>> 8;
	const r = (num & 0xff0000) >>> 16;
	const a = ((num & 0xff000000) >>> 24) / 255;

	return `rgba(${r},${g},${b},${a})`;
}

export class TextStory {
	#width = 540;
	#height = 1170;

	constructor({ width = 540, height = 1170 } = {}) {
		this.#width = width;
		this.#height = height;
	}

	async render(text, backgroundColor) {
		const canvas = createCanvas(this.#width, this.#height);
		const ctx = canvas.getContext('2d');

		ctx.fillStyle = argbToRgba(backgroundColor);
		ctx.fillRect(0, 0, this.#width, this.#height);

		ctx.fillStyle = argbToRgba(4_294_967_295);

		fillText(canvas, text, {
			font: '58px coolvetica',
			textAlign: 'center',
			verticalAlign: 'middle',
			sizeToFill: true
		});

		return Buffer.from(canvas.toBuffer('image/png'));
	}
}


