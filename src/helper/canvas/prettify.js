import prism from 'prismjs';
import Canvas from '@napi-rs/canvas';
import { parse } from 'parse5';
import path from 'path';
import prettier from 'prettier';
import sharp from 'sharp';
import dayjs from 'dayjs';
import color from 'colorthief';
import chroma from 'chroma-js';

const { createCanvas, loadImage, GlobalFonts } = Canvas;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/JetBrainsMono-Light.ttf'), 'JetBrainsMono');
GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/zh-cn.ttf'), 'ZHCN');

const roundedRectData = (w, h, tlr, trr, brr, blr) =>
	`M 0 ${tlr} A ${tlr} ${tlr}  0 0 1 ${tlr}  0 L ${w - trr} 0 A ${trr} ${trr} 0 0 1 ${w} ${trr} L ${w} ${
		h - brr
	} A ${brr} ${brr} 0 0 1 ${w - brr} ${h} L ${blr} ${h} A ${blr} ${blr} 0 0 1 0 ${h - blr} Z`;

const colors = {
	dracula: {
		_default: '#f8f8f2',
		'': '#bd93f9',
		'function-variable function': '#50fa7b',
		comment: '#6272a4',
		constant: '#bd93f9',
		'string-property property': '#f1fa8c',
		string: '#f1fa8c',
		variable: '#ff79c6',
		'template-punctuation string': '#f1fa8c',
		'interpolation-punctuation punctuation': '#ff79c6',
		interpolation: '#f8f8f2',
		parameter: '#50fa7b',
		function: '#50fa7b',
		punctuation: {
			opacity: 0.7,
			color: '#f8f8f2'
		},
		'regex-flags': '#ff79c6',
		'regex-delimiter': '#ff5555',
		'regex-source language-regex': '#50fa7b',
		'class-name': '#8be9fd',
		number: '#ff79c6',
		boolean: 'white',
		operator: '#ff79c6',
		keyword: '#ff79c6'
	}
};

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
				: imageMetadata.height + Math.log(imageMetadata.height) * 5
		};

		let rounded = new Buffer.from(
			`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, 0, 0, config.round, config.round)}"/></svg>`
		);
		let tops = new Buffer.from(
			`<svg><path d="${roundedRectData(imageMetadata.width, heightTops, config.round, config.round, 0, 0)}" fill="#282a36"
			/></svg>`
		);
		let pathStars = new Buffer.from(`<svg viewBox="0 0 256 256" width="${heightTops}" height="${heightTops}">
			<defs>
			  <linearGradient id="starGrad">
				<stop offset="0%" stop-color="#ff79c6"/>
				<stop offset="50%" stop-color="#bd93f9"/>
				<stop offset="100%" stop-color="#ff79c6"/>
			  </linearGradient>
			</defs>
			<path fill="url(#starGrad)" d="M228.69141,116.72266,164.875,93.51562a3.986,3.986,0,0,1-2.3916-2.3916L139.27734,27.30859a12.00008,12.00008,0,0,0-22.55468,0L93.51562,91.125a3.986,3.986,0,0,1-2.3916,2.3916L27.30859,116.72266a12.00008,12.00008,0,0,0,0,22.55468l63.81641,23.207a3.986,3.986,0,0,1,2.3916,2.3916l23.20606,63.81543a12.00008,12.00008,0,0,0,22.55468,0L162.4834,164.876l.001-.001a3.986,3.986,0,0,1,2.3916-2.3916l63.81543-23.20606a12.00008,12.00008,0,0,0,0-22.55468ZM225.957,131.75977l-63.81445,23.20507a11.967,11.967,0,0,0-7.17676,7.17676L131.75977,225.957a4.001,4.001,0,0,1-7.51954,0l-23.20507-63.81445a11.96452,11.96452,0,0,0-7.17676-7.17676L30.043,131.75977a4.001,4.001,0,0,1,0-7.51954l63.81445-23.20507a11.96452,11.96452,0,0,0,7.17676-7.17676l23.206-63.81543a4.001,4.001,0,0,1,7.51954,0l23.20507,63.81445a11.96452,11.96452,0,0,0,7.17676,7.17676l63.81543,23.206a4.001,4.001,0,0,1,0,7.51954Z" />  
		  </svg>`);

		let pathStarsRotated =
			new Buffer.from(`<svg viewBox="0 0 256 256" width="${heightTops}" height="${heightTops}" transform="rotate(45, ${
				heightTops / 2
			}, ${heightTops / 2})">
			<defs>
			  <linearGradient id="starGrad">
			  <stop offset="0%" stop-color="#ff79c6"/>
			  <stop offset="50%" stop-color="#bd93f9"/>
			  <stop offset="100%" stop-color="#ff79c6"/>
			  </linearGradient>
			</defs>
			<g id="SVGRepo_bgCarrier" stroke-width="0"/>
			<g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"/>
			<g id="SVGRepo_iconCarrier">
			<path fill="url(#starGrad)" d="M240.58984,128a15.84794,15.84794,0,0,1-10.53125,15.03711l-63.81543,23.206-23.206,63.81543a16.001,16.001,0,0,1-30.07422,0L89.75684,166.24316l-63.81543-23.206a16.001,16.001,0,0,1,0-30.07422L89.75684,89.75684l23.20605-63.81543a16.001,16.001,0,0,1,30.07422,0l23.206,63.81543,63.81543,23.20605A15.84794,15.84794,0,0,1,240.58984,128Z" /> </g>
		  </svg>`);

		const { canvas, ctx } = this.#createCanvas(config.widthCanvas, config.heightCanvas);
		const dWHMultiply = (num) => heightTops / 2 - (num * config.scaleSymbol) / 2;
		const dWHSymbol = (num) => num * config.scaleSymbol;

		if (!('background' in imageMetadata)) {
			let topsPadding = await sharp(tops).toBuffer();
			let roundedCornerResized = await image
				.composite([{ input: rounded, blend: 'dest-in' }])
				.png()
				.toBuffer();

			let { assetRotated, assetNonRotated } = await this.#loadAssets(pathStarsRotated, pathStars);

			const { canvas: tempCanvas, ctx: tempCtx } = this.#createCanvas(imageMetadata.width, imageMetadata.height + heightTops);

			const [topsPaddingImage, roundedCornerResizedImage, assetRotatedImage, assetNonRotatedImage] = await Promise.all([
				loadImage(topsPadding),
				loadImage(roundedCornerResized),
				loadImage(assetRotated),
				loadImage(assetNonRotated)
			]);

			tempCtx.drawImage(topsPaddingImage, 0, 0, tempCanvas.width, heightTops);
			tempCtx.drawImage(roundedCornerResizedImage, 0, heightTops, tempCanvas.width, tempCanvas.height - heightTops);
			tempCtx.drawImage(
				assetRotatedImage,
				dWHMultiply(assetRotatedImage.width),
				dWHMultiply(assetRotatedImage.height),
				dWHSymbol(assetRotatedImage.width),
				dWHSymbol(assetRotatedImage.height)
			);

			tempCtx.drawImage(
				assetNonRotatedImage,
				dWHSymbol(assetNonRotatedImage.width) + dWHMultiply(assetNonRotatedImage.width),
				dWHMultiply(assetNonRotatedImage.height),
				dWHSymbol(assetNonRotatedImage.width),
				dWHSymbol(assetNonRotatedImage.height)
			);

			tempCtx.drawImage(
				assetRotatedImage,
				dWHSymbol(assetRotatedImage.width) * 2 + dWHMultiply(assetRotatedImage.width),
				dWHMultiply(assetRotatedImage.height),
				dWHSymbol(assetRotatedImage.width),
				dWHSymbol(assetRotatedImage.height)
			);

			tempCtx.drawImage(
				assetRotatedImage,
				tempCanvas.width - dWHSymbol(assetRotatedImage.width) - dWHMultiply(assetRotatedImage.width),
				dWHMultiply(assetRotatedImage.height),
				dWHSymbol(assetRotatedImage.width),
				dWHSymbol(assetRotatedImage.height)
			);

			tempCtx.drawImage(
				assetNonRotatedImage,
				tempCanvas.width - dWHSymbol(assetNonRotatedImage.width) * 2 - dWHMultiply(assetNonRotatedImage.height),
				dWHMultiply(assetNonRotatedImage.height),
				dWHSymbol(assetNonRotatedImage.width),
				dWHSymbol(assetNonRotatedImage.height)
			);

			tempCtx.drawImage(
				assetRotatedImage,
				tempCanvas.width - dWHSymbol(assetRotatedImage.width) * 3 - dWHMultiply(assetRotatedImage.height),
				dWHMultiply(assetRotatedImage.height),
				dWHSymbol(assetRotatedImage.width),
				dWHSymbol(assetRotatedImage.height)
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

			assetRotated = null;
			assetNonRotated = null;
			combinedImage = null;
		} else {
			rounded = null;
			tops = null;
			pathStars = null;
			pathStarsRotated = null;
			return { error: 'Requirement of the image not found. `Image` should not had transparent.' };
		}

		rounded = null;
		tops = null;
		pathStars = null;
		pathStarsRotated = null;

		const toBuffer = () => canvas.toBuffer('image/png');

		return { toBuffer };
	}

	async #loadImage() {
		const image = sharp(this.#buffer);

		const imageMetadata = await image.metadata();

		return { image, imageMetadata };
	}

	async #loadAssets(...asset) {
		const buffers = await Promise.all([sharp(asset[0]).toBuffer(), sharp(asset[1]).toBuffer()]);

		return { assetRotated: buffers[0], assetNonRotated: buffers[1] };
	}

	#carbonNow(code, options) {
		const opts = Object.assign(this.defaultCarbonOptions, options);
		const formatCode = prettier.format(code, {
			printWidth: 80,
			singleQuote: true,
			trailingComma: 'all',
			parser: 'babel',
			useTabs: false
		});
		const palette = colors[opts.palette];
		const el = this.#highlightCode(formatCode);
		const parsed = parse(el).childNodes[0].childNodes[1].childNodes;

		const { ctx: tempCtx } = this.#createCanvas();

		tempCtx.font = '30px JetBrains';
		const width = this.#calculateWidth(tempCtx, formatCode) + 200;
		let height = 60;

		const { ctx: tempCtx2 } = this.#createCanvas();

		const x = 30;
		const y = 30;
		const lineHeight = tempCtx2.measureText(formatCode.split('\n')[0]).emHeightDescent + 1;
		const fontSize = parseInt(tempCtx2.font.match(/\d+/)[0]) || 30;

		height += this.#calculateHeight(y, lineHeight, fontSize, parsed);

		const { canvas, ctx } = this.#createCanvas(width, height);

		ctx.font = '30px JetBrainsMono';
		ctx.fillStyle = '#282a36';

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

	#highlightCode(code) {
		return prism.highlight(code, prism.languages.javascript, 'js').replace(/\n/g, '<br>');
	}

	#calculateWidth(ctx, code) {
		let width = 0;

		code.split('\n').forEach((text) => {
			const lenWidth = ctx.measureText(text).width;

			if (lenWidth >= width) {
				width = lenWidth + 100;
			}
		});

		return width;
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

		return height;
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
