import Canvas from '@napi-rs/canvas';
import sharp from 'sharp';
import dayjs from 'dayjs';
import path from 'path';
import color from 'colorthief';
import chroma from 'chroma-js';

const { createCanvas, loadImage, GlobalFonts } = Canvas;
GlobalFonts.registerFromPath(path.join('.', 'media_files/fonts/JetBrainsMono-Light.ttf'), 'JetBrainsMono');

const roundedRectData = (w, h, tlr, trr, brr, blr) =>
	`M 0 ${tlr} A ${tlr} ${tlr}  0 0 1 ${tlr}  0 L ${w - trr} 0 A ${trr} ${trr} 0 0 1 ${w} ${trr} L ${w} ${
		h - brr
	} A ${brr} ${brr} 0 0 1 ${w - brr} ${h} L ${blr} ${h} A ${blr} ${blr} 0 0 1 0 ${h - blr} Z`;

export const prettifyScreenshot = async (file) => {
	let buffer = file;
	const image = sharp(buffer);

	const imageMetadata = await image.metadata();

	const heightTops = Math.log2(imageMetadata.height) * 5;

	const opts = {
		round: 10,
		widthCanvas: imageMetadata.width * 1.1,
		heightCanvas: imageMetadata.height * 1.2 + heightTops,
	};

	let rounded = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, 0, 0, opts.round, opts.round)}"/></svg>`,
	);

	const stats = await color.getPalette(buffer);

	let tops = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width, heightTops, opts.round, opts.round, 0, 0)}" fill="#282a36"
		/></svg>`,
	);

	const canvas = createCanvas(opts.widthCanvas, opts.heightCanvas);
	const ctx = canvas.getContext('2d');

	if (!('background' in imageMetadata)) {
		const topsPadding = await sharp(tops).toBuffer();
		const roundedCornerResizer = await image
			.composite([{ input: rounded, blend: 'dest-in' }])
			.png()
			.toBuffer();

		const pathStars = new Buffer.from(`<svg viewBox="0 0 256 256" width="${heightTops}" height="${heightTops}">
			<defs>
			  <linearGradient id="starGrad">
				<stop offset="0%" stop-color="#ff79c6"/>
				<stop offset="50%" stop-color="#bd93f9"/>
				<stop offset="100%" stop-color="#ff79c6"/>
			  </linearGradient>
			</defs>
			<path fill="url(#starGrad)" d="M228.69141,116.72266,164.875,93.51562a3.986,3.986,0,0,1-2.3916-2.3916L139.27734,27.30859a12.00008,12.00008,0,0,0-22.55468,0L93.51562,91.125a3.986,3.986,0,0,1-2.3916,2.3916L27.30859,116.72266a12.00008,12.00008,0,0,0,0,22.55468l63.81641,23.207a3.986,3.986,0,0,1,2.3916,2.3916l23.20606,63.81543a12.00008,12.00008,0,0,0,22.55468,0L162.4834,164.876l.001-.001a3.986,3.986,0,0,1,2.3916-2.3916l63.81543-23.20606a12.00008,12.00008,0,0,0,0-22.55468ZM225.957,131.75977l-63.81445,23.20507a11.967,11.967,0,0,0-7.17676,7.17676L131.75977,225.957a4.001,4.001,0,0,1-7.51954,0l-23.20507-63.81445a11.96452,11.96452,0,0,0-7.17676-7.17676L30.043,131.75977a4.001,4.001,0,0,1,0-7.51954l63.81445-23.20507a11.96452,11.96452,0,0,0,7.17676-7.17676l23.206-63.81543a4.001,4.001,0,0,1,7.51954,0l23.20507,63.81445a11.96452,11.96452,0,0,0,7.17676,7.17676l63.81543,23.206a4.001,4.001,0,0,1,0,7.51954Z" />  
		  </svg>`);

		const pathStarsRotated =
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

		const starsBufferRotated = await sharp(pathStarsRotated).toBuffer();
		const starsBufferUnrotated = await sharp(pathStars).toBuffer();

		const tempCanvas = createCanvas(imageMetadata.width, imageMetadata.height + heightTops);
		const tempCtx = tempCanvas.getContext('2d');

		tempCtx.drawImage(await loadImage(topsPadding), 0, 0, tempCanvas.width, heightTops);
		tempCtx.drawImage(await loadImage(roundedCornerResizer), 0, heightTops, tempCanvas.width, tempCanvas.height - heightTops);

		const starsImageRotated = await loadImage(starsBufferRotated);
		const starsImageUnrotated = await loadImage(starsBufferUnrotated);

		const scaleSymbol = 0.5;

		const dWHMultiply = (num) => heightTops / 2 - (num * scaleSymbol) / 2;
		const dWHSymbol = (num) => num * scaleSymbol;

		tempCtx.drawImage(
			starsImageRotated,
			dWHMultiply(starsImageRotated.width),
			dWHMultiply(starsImageRotated.height),
			dWHSymbol(starsImageRotated.width),
			dWHSymbol(starsImageRotated.height),
		);

		tempCtx.drawImage(
			starsImageUnrotated,
			dWHSymbol(starsImageUnrotated.width) + dWHMultiply(starsImageUnrotated.width),
			dWHMultiply(starsImageUnrotated.height),
			dWHSymbol(starsImageUnrotated.width),
			dWHSymbol(starsImageUnrotated.height),
		);

		tempCtx.drawImage(
			starsImageRotated,
			dWHSymbol(starsImageRotated.width) * 2 + dWHMultiply(starsImageRotated.width),
			dWHMultiply(starsImageRotated.height),
			dWHSymbol(starsImageRotated.width),
			dWHSymbol(starsImageRotated.height),
		);

		tempCtx.drawImage(
			starsImageRotated,
			tempCanvas.width - dWHSymbol(starsImageRotated.width) - dWHMultiply(starsImageRotated.width),
			dWHMultiply(starsImageRotated.height),
			dWHSymbol(starsImageRotated.width),
			dWHSymbol(starsImageRotated.height),
		);

		tempCtx.drawImage(
			starsImageUnrotated,
			tempCanvas.width - dWHSymbol(starsImageUnrotated.width) * 2 - dWHMultiply(starsImageUnrotated.height),
			dWHMultiply(starsImageUnrotated.height),
			dWHSymbol(starsImageUnrotated.width),
			dWHSymbol(starsImageUnrotated.height),
		);

		tempCtx.drawImage(
			starsImageRotated,
			tempCanvas.width - dWHSymbol(starsImageUnrotated.width) * 3 - dWHMultiply(starsImageUnrotated.height),
			dWHMultiply(starsImageRotated.height),
			dWHSymbol(starsImageUnrotated.width),
			dWHSymbol(starsImageUnrotated.height),
		);

		let combine = tempCanvas.toBuffer('image/png');

		const background = chroma(stats[0][0], stats[0][1], stats[0][2]).darken(0.6);

		ctx.fillStyle = `rgb(${background._rgb._unclipped[0]}, ${background._rgb._unclipped[1]}, ${background._rgb._unclipped[2]})`;
		ctx.fillRect(0, 0, opts.widthCanvas, opts.heightCanvas);

		const time = dayjs().format('ddd DD.MMM.YYYY HH:mmA');

		const watermark = 'Prettify Screenshot by Hidden Finder';
		ctx.fillStyle = '#fff';
		ctx.font = `1px JetBrainsMono`;
		const longestText = time.length > watermark.length ? time : watermark;
		const fontSize = canvas.width / 1.55 / ctx.measureText(longestText).width;

		ctx.font = `${fontSize - 1}px JetBrainsMono`;

		let measured = ctx.measureText(watermark).width;

		combine = await loadImage(combine);

		const scale = 0.8;
		const x = (canvas.width - combine.width * scale) / 2;
		const y = (canvas.height - combine.height * scale) / 2;

		ctx.fillText(watermark, canvas.width / 2 - measured / 2, canvas.height - (canvas.height - combine.height) / 2.4);

		measured = ctx.measureText(time).width;

		ctx.fillText(time, canvas.width / 2 - measured / 2, y / 1.8);

		ctx.shadowBlur = 70;
		ctx.shadowColor = 'black';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 20;

		ctx.drawImage(combine, x, y, combine.width * scale, combine.height * scale);

		combine = null;
		buffer = null;
		tops = null;
		rounded = null;

		return canvas.toBuffer('image/png');
	}

	buffer = null;
	return { error: 'Failed to Prettify your image. Try other image that does not has transparent background.' };
};
