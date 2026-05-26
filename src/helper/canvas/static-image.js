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

export class StaticSticker {
	#width = 500;
	#height = 500;

	constructor({ width = 500, height = 500 } = {}) {
		this.#width = width;
		this.#height = height;
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

	#pickColor(colored) {
		if (colored?.length) {
			return colored[Math.floor(Math.random() * colored.length)];
		}

		const palette = stickerPalettes[Math.floor(Math.random() * stickerPalettes.length)];

		return palette[Math.floor(Math.random() * palette.length)];
	}

	#sanitizeText(text) {
		return text.trim().replace(new RegExp(emojiReg(), 'g'), '');
	}

	async render(text, colored = [], font = DEFAULT_STICKER_FONT) {
		const resolvedFont = this.#resolveFont(font);

		loggers.warning(`${color('Generating static sticker', 'pink')}`);

		const canvas = createCanvas(this.#width, this.#height);
		const ctx = canvas.getContext('2d');
		const fillColor = this.#pickColor(colored);
		const reassignColor = fillColor.startsWith('#') ? fillColor : `#${fillColor}`;

		ctx.fillStyle = reassignColor;

		fillText(canvas, this.#sanitizeText(text), {
			font: `82px ${resolvedFont}`,
			textAlign: 'center',
			verticalAlign: 'middle',
			sizeToFill: true
		});

		const webpBuffer = Buffer.from(canvas.toBuffer('image/webp'));
		const img = new WebPMux.Image();

		await img.load(webpBuffer);
		img.exif = buildExifBuffer('Made by Nanda', 'Aestherix Static Sticker using Canvas and WebP');

		const result = await img.save(null);

		loggers.info(`${color('Static sticker generated', 'pink')}`);

		return result;
	}
}


