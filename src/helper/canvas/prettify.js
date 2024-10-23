import prism from 'prismjs';
import Canvas from '@napi-rs/canvas';
import { parse } from 'parse5';
import path from 'path';
import prettier from 'prettier';
import sharp from 'sharp';
import dayjs from 'dayjs';
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

	CarbonNow(code, options) {
		return this.#screenshotNow(this.#carbonNow(code, options).toBuffer(), true);
	}

	ScreenshotNow(buffer, watermark) {
		return this.#screenshotNow(buffer, false, watermark);
	}

	get defaultCarbonOptions() {
		return {
			palette: 'dracula',
			shadow: false
		};
	}

	async #screenshotNow(buffer, isCarbon, watermark = 'Prettify Screenshot by Hidden Finder') {
		let time = dayjs().format('ddd DD.MMM.YYYY HH:mmA');

		if (isCarbon) {
			watermark = '';
			time = '';
		}

		this.#buffer = buffer;

		const { image, imageMetadata } = await this.#loadImage();
		const heightTops = Math.log2(imageMetadata.height) * 5;
		const stats = await color.getPalette(this.#buffer);

		const config = {
			round: 10,
			scaleSymbol: 0.5,
			scaleImage: 0.8,
			background: chroma(stats[0][0], stats[0][1], stats[0][2]).darken(0.6),
			widthCanvas: imageMetadata.width * (!isCarbon ? 1.1 : 1.01),
			heightCanvas: !isCarbon
				? imageMetadata.height * 1.2 + heightTops
				: (imageMetadata.height + Math.log(imageMetadata.height)) / 1.1
		};

		let rounded = new Buffer.from(
			`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, 0, 0, config.round, config.round)}"/></svg>`
		);
		let tops = new Buffer.from(
			`<svg><path d="${roundedRectData(imageMetadata.width, heightTops + 1, config.round, config.round, 0, 0)}" fill="#282a36"
			/></svg>`
		);

		const { canvas, ctx } = this.#createCanvas(config.widthCanvas, config.heightCanvas);
		const dWHMultiply = (num) => heightTops - num * config.scaleSymbol + 35;
		const dWHSymbol = (num) => num * config.scaleSymbol - 10;

		if (!('background' in imageMetadata)) {
			let topsPadding = await sharp(tops).toBuffer();
			let roundedCornerResized = await image
				.composite([{ input: rounded, blend: 'dest-in' }])
				.png()
				.toBuffer();

			const { canvas: tempCanvas, ctx: tempCtx } = this.#createCanvas(imageMetadata.width, imageMetadata.height + heightTops);

			const [topsPaddingImage, roundedCornerResizedImage, close, minimize, maximize] = await Promise.all([
				loadImage(topsPadding),
				loadImage(roundedCornerResized),
				loadImage('./src/media/assets/close.png'),
				loadImage('./src/media/assets/minimize.png'),
				loadImage('./src/media/assets/maximize.png')
			]);

			tempCtx.drawImage(topsPaddingImage, 0, 0, tempCanvas.width, heightTops + 10);
			tempCtx.drawImage(roundedCornerResizedImage, 0, heightTops, tempCanvas.width, tempCanvas.height - heightTops);

			tempCtx.drawImage(
				close,
				dWHMultiply(close.width),
				dWHMultiply(close.height),
				dWHSymbol(close.width),
				dWHSymbol(close.height)
			);

			tempCtx.drawImage(
				minimize,
				dWHSymbol(minimize.width) + dWHMultiply(minimize.width) + 5,
				dWHMultiply(minimize.height),
				dWHSymbol(minimize.width),
				dWHSymbol(minimize.height)
			);

			tempCtx.drawImage(
				maximize,
				dWHSymbol(maximize.width) * 2 + dWHMultiply(maximize.width) + 5 * 2,
				dWHMultiply(maximize.height),
				dWHSymbol(maximize.width),
				dWHSymbol(maximize.height)
			);

			let combinedImage = tempCanvas.toBuffer('image/png');

			ctx.fillStyle = `rgb(${config.background._rgb._unclipped[0]}, ${config.background._rgb._unclipped[1]}, ${config.background._rgb._unclipped[2]})`;
			ctx.fillRect(0, 0, config.widthCanvas, config.heightCanvas);

			let textWidth;
			let longestText;
			let fontSize;

			if (!isCarbon) {
				ctx.fillStyle = '#fff';
				ctx.font = '1px JetBrainsMono';

				longestText = time.length > watermark.length ? time : watermark;
				fontSize = canvas.width / 1.55 / ctx.measureText(longestText).width;

				ctx.font = `${fontSize - 1}px JetBrainsMono`;

				textWidth = ctx.measureText(watermark).width;
			}

			combinedImage = await loadImage(combinedImage);

			const x = (canvas.width - combinedImage.width * config.scaleImage) / 2;
			const y = (canvas.height - combinedImage.height * config.scaleImage) / 2;

			if (!isCarbon) {
				ctx.fillText(
					watermark,
					canvas.width / 2 - textWidth / 2,
					canvas.height - (canvas.height - combinedImage.height) / 2.4
				);

				textWidth = ctx.measureText(time).width;

				ctx.fillText(time, canvas.width / 2 - textWidth / 2, y / 1.8);
			}

			ctx.shadowBlur = 70;
			ctx.shadowColor = 'black';
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 20;

			ctx.drawImage(combinedImage, x, y, combinedImage.width * config.scaleImage, combinedImage.height * config.scaleImage);
			topsPadding = null;
			roundedCornerResized = null;
		} else {
			rounded = null;
			tops = null;
			return { error: 'Requirement of the image not found. `Image` should not had transparent.' };
		}

		rounded = null;
		tops = null;

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
			useTabs: tabWidth ? true : false,
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
		const y = 90;
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

		if (opts.shadow) {
			ctx.shadowBlur = typeof opts.shadow === 'boolean' ? 5 : opts.shadow;
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

				if (opts.shadow) {
					ctx.shadowColor = color?.color || color;
				}

				ctx.fillText(text, x + multiply, y + index * fontSize * lineHeight);
			});
		};

		loop(parentNode);
	}
}
