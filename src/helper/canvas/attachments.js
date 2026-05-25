import Canvas from '@napi-rs/canvas';
import sharp from 'sharp';
import Wrap from 'canvas-text-wrapper';
import * as color from 'colorthief';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetch } from 'undici';

import { isURL } from '../../utils/modules/index.js';

const { createCanvas, GlobalFonts, loadImage } = Canvas;
const { CanvasTextWrapper } = Wrap;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const [signature, logo] = await Promise.all([
	loadImage('./src/media/assets/1_icon_github_signature.png'),
	loadImage('./src/media/assets/1_icon_github.png')
]);

GlobalFonts.registerFromPath(path.join(__dirname, '/../../media/fonts/Nina-Bold.otf'), 'nina-bold');
GlobalFonts.registerFromPath(path.join(__dirname, '/../../media/fonts/Abril-Text-Bold.otf'), 'AbrilText-Bold');
GlobalFonts.registerFromPath(path.join(__dirname, '/../../media/fonts/IBM.ttf'), 'ibm');

const COPYRIGHT_TEXT = '© 2022 nugraizy, HF Inc.';

export class Attachment {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.PALETTES = {
			BACKGROUND: '#282A36',
			GREEN: 'rgb(88,239,126)',
			PINK: 'rgb(219,63,128)',
			PURPLE: '#BD93F9',
			RED: '#FF5555'
		};
		this.canvas = null;
		this._colorPalettes = null;
		this._image = {};
		this._profile = {};
	}

	async init(image) {
		this.canvas = createCanvas(this.x, this.y);
		this.ctx = this.canvas.getContext('2d');

		if (typeof image === 'string' && isURL(image)) {
			const response = await fetch(image);

			image = await response.arrayBuffer();
		}

		this._colorPalettes = (await color.getPalette(image))[0].join(', ');
		this._image.buffer = image;
		const _profile = await loadImage(image);

		this._profile = {
			profile: _profile,
			buffer: image
		};

		return this;
	}

	async roundImage(image, roundedRadius) {
		const rounded = Buffer.from(
			`<svg><rect x="0" y="0" width="${this._profile.profile.width}" height="${this._profile.profile.height}" rx="${roundedRadius}" ry="${roundedRadius}"/></svg>`
		);
		const roundedCornerResizer = sharp(image)
			.composite([{ input: rounded, blend: 'dest-in' }])
			.png();

		return await loadImage(await roundedCornerResizer.toBuffer());
	}

	async palettes(str) {
		return await color.getPalette(str);
	}

	checkInitialization() {
		if (!this.canvas) {
			throw new Error('Need initialization. Call .init() first.');
		}
	}

	appendText(text, participant, groupName, x, y, opts) {
		this.checkInitialization();

		const defaultOpts = {
			textColor: 'white',
			groupNameColor: 'white',
			participantColor: 'white',
			fontSize: 82,
			fontName: 'nina-bold',
			shadow: false
		};

		const { participantColor, groupNameColor, textColor, fontSize, fontName, shadow } = {
			...defaultOpts,
			...opts
		};

		if (shadow) {
			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;
			this.ctx.shadowColor = participantColor;
			this.ctx.shadowBlur = 5;
		}

		this.ctx.fillStyle = participantColor;

		CanvasTextWrapper(this.canvas, `𓆩 ${participant} 𓆪`, {
			font: `${fontSize}px ${fontName}`,
			textAlign: 'center',
			verticalAlign: 'bottom',
			paddingX: x / 3,
			paddingY: y / 2
		});

		if (shadow) {
			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;
			this.ctx.shadowColor = textColor;
			this.ctx.shadowBlur = 5;
		}

		this.ctx.fillStyle = textColor;

		CanvasTextWrapper(this.canvas, text, {
			font: '30px AbrilText-Bold',
			textAlign: 'center',
			verticalAlign: 'bottom',
			paddingX: x / 5,
			paddingY: y / 2.84
		});

		if (shadow) {
			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;
			this.ctx.shadowColor = groupNameColor;
			this.ctx.shadowBlur = 5;
		}

		this.ctx.fillStyle = groupNameColor;

		CanvasTextWrapper(this.canvas, groupName, {
			font: '42px AbrilText-Bold',
			textAlign: 'center',
			verticalAlign: 'bottom',
			paddingX: x / 5,
			paddingY: y / 8.7
		});

		return this;
	}

	async appendImage(opts) {
		this.checkInitialization();

		const defaultOpts = { roundedRadius: false };

		const { roundedRadius } = { ...defaultOpts, ...opts };
		let filename = this._image.buffer;

		let imageBuffer;
		let buffer;

		if (filename === './src/media/blank.png') {
			imageBuffer = await loadImage(filename);
			buffer = await fs.readFile(filename);
		} else {
			if (this._profile.profile.width !== this._profile.profile.height) {
				filename = await sharp(await this._profile.buffer)
					.resize(640, 640)
					.toBuffer();
				buffer = filename;
				this._image.buffer = filename;
				imageBuffer = await loadImage(this._image.buffer);
				this._profile.profile.width = imageBuffer.width;
				this._profile.profile.height = imageBuffer.height;
			} else {
				buffer = filename;
				imageBuffer = await loadImage(filename);
			}
		}

		this._image.loaded = imageBuffer;

		let w;
		let h;
		let x;
		let y;

		const changeDimen = (w0, h0, s0, y0) => {
			w = w0;
			h = h0;
			x = s0;
			y = y0;
		};

		if (filename === './src/media/blank.png') {
			changeDimen(
				this.canvas.width / 2 - this._image.loaded.width / 2 + 5,
				this.canvas.height / 2 - this._image.loaded.height / 2 - 80,
				this._image.loaded.width / 1.04,
				this._image.loaded.height / 1.04
			);
		} else {
			changeDimen(
				this.canvas.width / 2 - this._image.loaded.width / 3 + 110,
				this.canvas.height / 2 - this._image.loaded.height / 3 + 15,
				this._image.loaded.width / 2.99,
				this._image.loaded.height / 2.99
			);
		}

		if (roundedRadius) {
			if (typeof roundedRadius !== 'number') {
				throw new Error(`Expected integer radius. Got: ${roundedRadius} ( ${typeof roundedRadius} )`);
			}

			this._image.loaded = await this.roundImage(buffer, roundedRadius);
		}

		this.ctx.shadowOffsetX = 1;
		this.ctx.shadowOffsetY = 1;
		this.ctx.shadowColor = `rgb(${this._colorPalettes})`;
		this.ctx.shadowBlur = 30;

		this.ctx.drawImage(this._image.loaded, w, h, x, y);

		return this;
	}

	fillBackground(fillColor) {
		this.checkInitialization();

		const color = fillColor || this.PALETTES.BACKGROUND;

		this.ctx.fillStyle = color;
		this.ctx.fillRect(0, 0, this.x, this.y);
		this.ctx.strokeStyle = `rgb(${this._colorPalettes})`;
		this.ctx.lineWidth = 5;
		this.ctx.shadowOffsetX = 1;
		this.ctx.shadowOffsetY = 1;
		this.ctx.shadowColor = `rgb(${this._colorPalettes})`;
		this.ctx.shadowBlur = 5;
		this.ctx.strokeRect(0, 0, this.x, this.y);

		return this;
	}

	async putAssets() {
		this.checkInitialization();

		const r = 1.4;
		const cw = 60;
		const ch = 60;

		const raw = sharp('./src/media/assets/cross-mark.png');

		const cross1Raw = await raw.rotate(~~(Math.random() * 180), { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
		const cross2Raw = await raw.rotate(~~(Math.random() * 180), { background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();

		const [cross1, cross2] = await Promise.all([loadImage(cross1Raw), loadImage(cross2Raw)]);

		this.ctx.shadowOffsetX = 0;
		this.ctx.shadowOffsetY = 0;

		this.ctx.save();
		this.ctx.shadowBlur = 2;
		this.ctx.shadowColor = 'white';

		this.ctx.drawImage(logo, 15, this.canvas.height - 38, 20, 20);
		this.ctx.drawImage(
			signature,
			this.canvas.width - 70,
			this.canvas.height - 38,
			signature.width / 19,
			signature.height / 19
		);
		this.ctx.restore();

		this.ctx.beginPath();
		this.ctx.shadowBlur = 8;

		for (let x = 20; x < this.canvas.width; x += cw) {
			for (let y = 20; y < this.canvas.height; y += ch) {
				const color = this.PALETTES[['GREEN', 'PURPLE', 'PINK', 'RED'][Math.floor(Math.random() * 4)]];

				this.ctx.strokeStyle = color;
				this.ctx.shadowColor = color;
				this.ctx.fillStyle = color;
				this.ctx.beginPath();
				this.ctx.arc(x - r / 2, y - r / 2, r, 0, 2 * Math.PI);
				this.ctx.fill();
				this.ctx.lineWidth = 1.6;
				this.ctx.stroke();
				this.ctx.closePath();
			}
		}

		this.ctx.save();
		this.ctx.shadowColor = this.PALETTES.PINK;

		this.ctx.drawImage(cross1, this.canvas.width / 1.2, this.canvas.height - 175, cross1.width / 8, cross1.height / 8);
		this.ctx.drawImage(cross2, 100, this.canvas.height - 380, cross2.width / 5, cross2.height / 5);
		this.ctx.restore();

		return this;
	}

	async placeCopyright(watermark = COPYRIGHT_TEXT) {
		this.checkInitialization();

		this.ctx.shadowBlur = 5;
		this.ctx.shadowOffsetX = 1;
		this.ctx.shadowOffsetY = 1;

		this.ctx.shadowColor = 'white';
		this.ctx.fillStyle = 'white';
		this.ctx.font = '14px ibm';

		this.ctx.fillText(watermark, 140, this.canvas.height - 18);

		return this;
	}

	toBuffer() {
		this.checkInitialization();
		return this.canvas.toBuffer('image/png');
	}
}
