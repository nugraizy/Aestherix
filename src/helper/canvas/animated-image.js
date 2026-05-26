import Canvas from '@napi-rs/canvas';
import emojiReg from 'emoji-regex';
import WebPMux from 'node-webpmux';

import { buildExifBuffer } from '../../utils/misc/create-exif.js';
import { color, loggers } from '../../utils/modules/index.js';
import { fillText } from './utils/fill-text.js';
import { DEFAULT_STICKER_FONT, stickerFonts, stickerPalettes } from './utils/themes.js';
import { registerFonts } from './utils/helpers.js';

const { createCanvas } = Canvas;

registerFonts();

export class AnimatedSticker {
	#width = 500;
	#height = 500;
	#frameDelay = 150;

	constructor({ width = 500, height = 500, frameDelay = 150 } = {}) {
		this.#width = width;
		this.#height = height;
		this.#frameDelay = frameDelay;
	}

	#resolveFont(font) {
		const normalized = font?.toLowerCase();

		if (normalized && stickerFonts.includes(normalized)) {
			return normalized;
		}

		if (font) {
			loggers.warning(`Font "${font}" not found. Available: ${stickerFonts.join(', ')}. Using "${DEFAULT_STICKER_FONT}".`);
		}

		return DEFAULT_STICKER_FONT;
	}

	#getColors(colored) {
		if (colored?.length) {
			return colored;
		}

		return [...stickerPalettes[Math.floor(Math.random() * stickerPalettes.length)]];
	}

	#sanitizeText(text) {
		return text.trim().replace(new RegExp(emojiReg(), 'g'), '');
	}

	async render(text, colored = [], font = DEFAULT_STICKER_FONT) {
		const resolvedFont = this.#resolveFont(font);

		loggers.warning(`${color('Generating animated sticker', 'pink')}`);

		const canvas = createCanvas(this.#width, this.#height);
		const ctx = canvas.getContext('2d');
		const colors = this.#getColors(colored);
		const sanitized = this.#sanitizeText(text);
		const frameBuffers = [];

		for (const colori of colors) {
			const fillColor = colori.startsWith('#') ? colori : `#${colori}`;

			ctx.clearRect(0, 0, this.#width, this.#height);
			ctx.fillStyle = fillColor;

			fillText(canvas, sanitized, {
				font: `82px ${resolvedFont}`,
				textAlign: 'center',
				verticalAlign: 'middle',
				sizeToFill: true
			});

			frameBuffers.push(Buffer.from(canvas.toBuffer('image/webp')));
		}

		const frames = [];

		for (const buf of frameBuffers) {
			frames.push(await WebPMux.Image.generateFrame({ buffer: buf, delay: this.#frameDelay, x: 0, y: 0, blend: false, dispose: true }));
		}

		const exif = buildExifBuffer('Made by Nanda', 'Aestherix Animated Sticker using Canvas and WebP');

		const result = await WebPMux.Image.save(null, {
			frames,
			width: this.#width,
			height: this.#height,
			loops: 0,
			exif: { raw: exif }
		});

		loggers.info(`${color('Animated sticker generated', 'pink')}`);

		return result;
	}
}


