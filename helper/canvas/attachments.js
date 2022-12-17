import Canvas from 'canvas';
import sharp from 'sharp';
import jimp from 'jimp';
import Wrap from 'canvas-text-wrapper';
import * as color from 'colorthief';

const { createCanvas, registerFont, loadImage } = Canvas;
const { CanvasTextWrapper } = Wrap;

const copyright = '© 2022 nugraizy, HF Inc.';

export class Attachment {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.PALETTES = {
			BACKGROUND: '#282A36',
			GREEN: 'rgb(88,239,126)',
			PINK: 'rgb(219,63,128)',
			PURPLE: '#BD93F9',
			RED: '#FF5555',
		};
		this.canvas = null;
		this._colorPalettes = null;
		this._image = null;

		this.appendText = (text, participant, groupName, x, y, opts) => {
			if (!this.canvas) {
				const err = 'Need initialization. Call .init() first.';

				throw new Error(err);
			}

			const defaultOpts = {
				textColor: 'white',
				groupName: 'white',
				participantColor: 'white',
				fontSize: 82,
				fontName: 'nina-bold',
				shadow: false,
			};

			Object.assign(defaultOpts, opts);

			const { participantColor, groupNameColor, textColor, fontSize, fontName, shadow } = defaultOpts;

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
				paddingY: y / 2,
			});

			if (shadow) {
				this.ctx.shadowOffsetX = 1;
				this.ctx.shadowOffsetY = 1;
				this.ctx.shadowColor = textColor;
				this.ctx.shadowBlur = 5;
			}

			this.ctx.fillStyle = textColor;

			CanvasTextWrapper(this.canvas, text, {
				font: '30px abril-text-bold',
				textAlign: 'center',
				verticalAlign: 'bottom',
				paddingX: x / 5,
				paddingY: y / 2.84,
			});

			if (shadow) {
				this.ctx.shadowOffsetX = 1;
				this.ctx.shadowOffsetY = 1;
				this.ctx.shadowColor = groupNameColor;
				this.ctx.shadowBlur = 5;
			}

			this.ctx.fillStyle = groupNameColor;

			CanvasTextWrapper(this.canvas, groupName, {
				font: '42px abril-text-bold',
				textAlign: 'center',
				verticalAlign: 'bottom',
				paddingX: x / 5,
				paddingY: y / 8.7,
			});

			return this;
		};

		this.appendImage = async (opts) => {
			if (!this.canvas) {
				const err = 'Need initialization. Call .init() first.';

				throw new Error(err);
			}

			const defaultOpts = { roundedRadius: false };

			Object.assign(defaultOpts, opts);

			const { roundedRadius } = defaultOpts;
			const filename = this._image;

			this._image = await loadImage(this._image);

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

			if (filename == './media_files/blank.png') {
				changeDimen(
					this.canvas.width / 2 - this._image.width / 2 + 5,
					this.canvas.height / 2 - this._image.height / 2 - 80,
					this._image.width / 1.04,
					this._image.height / 1.04,
				);
			} else {
				changeDimen(
					this.canvas.width / 2 - this._image.width / 3 + 110,
					this.canvas.height / 2 - this._image.height / 3 + 15,
					this._image.width / 2.99,
					this._image.height / 2.99,
				);
			}

			if (roundedRadius) {
				if (typeof roundedRadius !== 'number') {
					throw new Error(`Expected integer radius. Got: ${roundedRadius} ( ${typeof roundedRadius} )`);
				}

				this._image = await this.roundImage(this._image, filename, roundedRadius);
			}

			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;
			this.ctx.shadowColor = `rgb(${this._colorPalettes})`;
			this.ctx.shadowBlur = 30;

			this.ctx.drawImage(this._image, w, h, x, y);

			return this;
		};

		this.fillBackground = (color) => {
			if (!this.canvas) {
				const err = 'Need initialization. Call .init() first.';

				throw new Error(err);
			}

			this.ctx.fillStyle = color || this.PALETTES.BACKGROUND;
			this.ctx.fillRect(0, 0, this.x, this.y);
			this.ctx.strokeStyle = `rgb(${this._colorPalettes})`;
			this.ctx.lineWidth = 5;
			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;
			this.ctx.shadowColor = `rgb(${this._colorPalettes})`;
			this.ctx.shadowBlur = 5;
			this.ctx.strokeRect(0, 0, this.x, this.y);

			return this;
		};

		this.putAssets = async () => {
			if (!this.canvas) {
				const err = 'Need initialization. Call .init() first.';

				throw new Error(err);
			}

			let r = 1.4;
			let cw = 60;
			let ch = 60;

			const raw = await jimp.read('./media_files/assets/cross-mark.png');

			const cross1Raw = await raw.rotate(Math.floor(Math.random() * 180)).getBufferAsync(jimp.MIME_PNG);
			const cross2Raw = await raw.rotate(Math.floor(Math.random() * 180)).getBufferAsync(jimp.MIME_PNG);

			const [signature, logo, [cross1, cross2]] = [
				await loadImage('./media_files/assets/1_icon_github_signature.png'),
				await loadImage('./media_files/assets/1_icon_github.png'),
				[await loadImage(cross1Raw), await loadImage(cross2Raw)],
			];

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
				signature.height / 19,
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
		};

		this.placeCopyright = async (watermark = copyright) => {
			if (!this.canvas) {
				const err = 'Need initialization. Call .init() first.';

				throw new Error(err);
			}

			this.ctx.shadowBlur = 5;
			this.ctx.shadowOffsetX = 1;
			this.ctx.shadowOffsetY = 1;

			this.ctx.shadowColor = 'white';
			this.ctx.fillStyle = 'white';
			this.ctx.font = '14px ibm';

			this.ctx.fillText(watermark, 140, this.canvas.height - 18);

			return this;
		};

		this.init = async (image) => {
			this.registerFonts();

			this.canvas = createCanvas(this.x, this.y);
			this.ctx = this.canvas.getContext('2d');

			this._colorPalettes = (await color.getPalette(image))[0].join(', ');
			this._image = image;

			return this;
		};

		this.toBuffer = () => this.canvas.toBuffer();
	}

	registerFonts() {
		registerFont('./media_files/fonts/Nina-Bold.otf', { family: 'nina-bold' });
		registerFont('./media_files/fonts/Abril-Text-Bold.otf', { family: 'abril-text-bold' });
		registerFont('./media_files/fonts/IBM.ttf', { family: 'ibm' });
	}

	async roundImage(image, file, roundedRadius) {
		const rounded = new Buffer.from(
			`<svg><rect x="0" y="0" width="${image.width}" height="${image.height}" rx="${roundedRadius}" ry="${roundedRadius}"/></svg>`,
		);
		const roundedCornerResizer = sharp(file)
			.composite([{ input: rounded, blend: 'dest-in' }])
			.png();

		image = await loadImage(await roundedCornerResizer.toBuffer());
		return image;
	}

	async palettes(str) {
		return await color.getPalette(str);
	}
}
