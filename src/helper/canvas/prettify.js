import prism from 'prismjs';
import Canvas from '@napi-rs/canvas';
import { parse } from 'parse5';
import path from 'path';
import prettier from 'prettier';
import sharp from 'sharp';
import color from 'colorthief';
import chroma from 'chroma-js';

import { colors, roundedRectData } from './utils.js';

const { createCanvas, loadImage, GlobalFonts } = Canvas;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/JetBrainsMono-Light.ttf'), 'JetBrainsMono');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/zh-cn.ttf'), 'ZHCN');

export class Prettify {
	#buffer = null;

	constructor() {
		this.Carbon = this.CarbonNow;
		this.Screenshot = this.ScreenshotNow;
	}

	/**
	 * Carbonise the code
	 * @param {string} code
	 * @param {{palette: 'dracula' | 'synthwave84', glow?: boolean}} options
	 * @returns {Promise<{toBuffer: () => Buffer}>}
	 */
	async CarbonNow(code, options) {
		return this.#screenshotNow(this.#carbonNow(code, options).toBuffer(), true);
	}

	/**
	 * Prettify the picture
	 * @param {Buffer} buffer
	 * @returns {Promise<{toBuffer: () => Buffer}>}
	 */
	async ScreenshotNow(buffer) {
		return this.#screenshotNow(buffer, false);
	}

	get defaultCarbonOptions() {
		return {
			palette: 'dracula',
			glow: false
		};
	}

	async #screenshotNow(buffer, isCarbon, baseBorderThicknessPercentage = 0.1) {
		this.#buffer = buffer;

		const { image, imageMetadata } = await this.#loadImage();
		const stats = await color.getPalette(this.#buffer);

		const minDimension = Math.min(imageMetadata.width, imageMetadata.height);
		const borderThickness = Math.max(5, minDimension * baseBorderThicknessPercentage);

		const config = {
			round: 10,
			scaleSymbol: 0.5,
			scaleImage: 0.8,
			background: chroma(stats[0][0], stats[0][1], stats[0][2]).darken(0.6),
			widthCanvas: imageMetadata.width + 2 * borderThickness,
			heightCanvas: imageMetadata.height + 2 * borderThickness
		};

		const rounded = new Buffer.from(
			`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, config.round)}"/></svg>`
		);

		const { canvas, ctx } = this.#createCanvas(config.widthCanvas, config.heightCanvas);
		const dWHMultiply = (num) => num * config.scaleSymbol + 10;
		const dWHSymbol = (num) => num * config.scaleSymbol - 10;

		if (!('background' in imageMetadata)) {
			let roundedCornerResized = await image
				.composite([{ input: rounded, blend: 'dest-in' }])
				.png()
				.toBuffer();

			const { canvas: tempCanvas, ctx: tempCtx } = this.#createCanvas(imageMetadata.width, imageMetadata.height);

			const [roundedCornerResizedImage, close, minimize, maximize] = await Promise.all([
				loadImage(roundedCornerResized),
				...((isCarbon && [
					loadImage('./src/media/assets/close.png'),
					loadImage('./src/media/assets/minimize.png'),
					loadImage('./src/media/assets/maximize.png')
				]) ||
					[])
			]);

			tempCtx.drawImage(roundedCornerResizedImage, 0, 0, tempCanvas.width, tempCanvas.height);

			if (isCarbon) {
				const space = 10;

				tempCtx.drawImage(
					close,
					dWHMultiply(close.width),
					dWHMultiply(close.height),
					dWHSymbol(close.width),
					dWHSymbol(close.height)
				);

				tempCtx.drawImage(
					minimize,
					dWHSymbol(minimize.width) + dWHMultiply(minimize.width) + space,
					dWHMultiply(minimize.height),
					dWHSymbol(minimize.width),
					dWHSymbol(minimize.height)
				);

				tempCtx.drawImage(
					maximize,
					dWHSymbol(maximize.width) * 2 + dWHMultiply(maximize.width) + space * 2,
					dWHMultiply(maximize.height),
					dWHSymbol(maximize.width),
					dWHSymbol(maximize.height)
				);
			}

			let combinedImage = tempCanvas.toBuffer('image/png');

			ctx.fillStyle = `rgb(${config.background._rgb._unclipped[0]}, ${config.background._rgb._unclipped[1]}, ${config.background._rgb._unclipped[2]})`;
			ctx.fillRect(0, 0, config.widthCanvas, config.heightCanvas);

			combinedImage = await loadImage(combinedImage);

			const scaleFactor = Math.min(
				(config.widthCanvas - 2 * borderThickness) / combinedImage.width,
				(config.heightCanvas - 2 * borderThickness) / combinedImage.height
			);

			const scaledWidth = combinedImage.width * scaleFactor;
			const scaledHeight = combinedImage.height * scaleFactor;

			const x = (config.widthCanvas - scaledWidth) / 2;
			const y = (config.heightCanvas - scaledHeight) / 2;

			ctx.shadowBlur = 70;
			ctx.shadowColor = 'black';
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;

			ctx.drawImage(combinedImage, x, y, scaledWidth, scaledHeight);
		} else {
			return { error: 'Requirement of the image not found. `Image` should not had transparent.' };
		}

		const toBuffer = () => canvas.toBuffer('image/png');

		return { toBuffer };
	}

	async #loadImage() {
		const image = sharp(this.#buffer);

		const imageMetadata = await image.metadata();

		return { image, imageMetadata };
	}

	#carbonNow(code, options) {
		const tabWidth = 3;
		const opts = Object.assign(this.defaultCarbonOptions, options);
		const formatCode = prettier.format(code, {
			printWidth: 80,
			singleQuote: true,
			trailingComma: 'all',
			parser: 'babel',
			useTabs: !!tabWidth,
			tabWidth
		});

		const palette = colors[opts.palette];
		const el = this.#highlightCode(formatCode, tabWidth);
		const parsed = parse(el).childNodes[0].childNodes[1].childNodes;

		const { ctx: tempCtx } = this.#createCanvas();

		tempCtx.font = '30px JetBrains';
		const width = this.#calculateWidth(tempCtx, formatCode, tabWidth) + 70;
		let height = 60;

		const { ctx: tempCtx2 } = this.#createCanvas();

		const x = 60;
		const y = 130;
		const lineHeight = tempCtx2.measureText(formatCode.split('\n')[0]).emHeightDescent + 2.4;
		const fontSize = parseInt(tempCtx2.font.match(/\d+/)[0]) || 30;

		height += this.#calculateHeight(y, lineHeight, fontSize, parsed);

		const { canvas, ctx } = this.#createCanvas(width, height);

		ctx.font = '30px JetBrainsMono';
		ctx.fillStyle = palette.background;

		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.save();

		ctx.textBaseline = 'top';
		ctx.textAlign = 'right';

		if (opts.glow) {
			ctx.shadowBlur = typeof opts.glow === 'boolean' ? 5 : opts.glow;
		}

		this.#fillText(ctx, x, y, fontSize, lineHeight, parsed, palette, opts);

		const toBuffer = () => canvas.toBuffer('image/png');

		return { toBuffer };
	}

	#createCanvas(width = 200, height = 200) {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		return { canvas, ctx };
	}

	#getClassToken(el) {
		if (!el.attrs) {
			return '';
		}

		const classNames = el.attrs.find((attr) => attr.name === 'class');

		return classNames?.value ? classNames.value.split(' ').slice(1).join(' ') : '';
	}

	#highlightCode(code, tabWidth) {
		return prism.highlight(code, prism.languages.javascript, 'js').replace(/\n/g, '<br>').replace(/\t/g, ' '.repeat(tabWidth));
	}

	#calculateWidth(ctx, code, tabWidth) {
		let maxWidth = 0;

		const spaceWidth = ctx.measureText(' ').width;

		code.split(/(?<!["'`])\n(?!["'`])/).forEach((line) => {
			let lineWidth = 0;

			for (let char of line) {
				if (char === '\t') {
					lineWidth += spaceWidth * tabWidth;
				} else {
					lineWidth += ctx.measureText(char).width;
				}
			}

			if (lineWidth > maxWidth) {
				maxWidth = lineWidth;
			}
		});

		const padding = 600;

		return maxWidth + padding;
	}

	#calculateHeight(y, fontSize, lineHeight, parentNode) {
		let index = 0;
		let height = 0;
		const loop = (parsed) => {
			parsed.forEach((element) => {
				if (element.nodeName === 'br') {
					index++;

					return;
				}

				if (element.childNodes) {
					loop(element.childNodes);
				}

				if (element.nodeName !== '#text') {
					return;
				}

				height = y + index * fontSize * lineHeight;
			});
		};

		loop(parentNode);

		return height + 50;
	}

	#fillText(ctx, x, y, fontSize, lineHeight, parentNode, colors, opts) {
		let multiply = 0;
		let index = 0;

		const loop = (parsed) => {
			parsed.forEach((element) => {
				if (element.nodeName === 'br') {
					multiply = 0;
					index++;

					return;
				}

				if (element.childNodes) {
					loop(element.childNodes);
				}

				if (element.nodeName !== '#text') {
					return;
				}

				const text = element.value || '';
				const className = this.#getClassToken(element.parentNode);
				const color = colors[className] || colors._default || '#000';
				const textWidth = ctx.measureText(text).width;

				multiply += textWidth;
				ctx.globalAlpha = 1;

				if (typeof color === 'object') {
					ctx.fillStyle = color.color;
					ctx.globalAlpha = color.opacity;
				} else {
					ctx.fillStyle = color;
				}

				if (opts.glow) {
					ctx.shadowColor = color?.color || color;
				}

				ctx.fillText(text, x + multiply, y + index * fontSize * lineHeight);
			});
		};

		loop(parentNode);
	}
}
