import Canvas from '@napi-rs/canvas';
import sharp from 'sharp';
import dayjs from 'dayjs';
import path from 'path';
import color from 'colorthief';
import chroma from 'chroma-js';

const { createCanvas, loadImage, GlobalFonts } = Canvas;
GlobalFonts.registerFromPath(path.join('.', 'media_files/fonts/JetBrainsMono-Light.ttf'), 'JetBrainsMono');

const roundedRectData = (w, h, tlr, trr, brr, blr) =>
	'M 0 ' +
	tlr +
	' A ' +
	tlr +
	' ' +
	tlr +
	' 0 0 1 ' +
	tlr +
	' 0' +
	' L ' +
	(w - trr) +
	' 0' +
	' A ' +
	trr +
	' ' +
	trr +
	' 0 0 1 ' +
	w +
	' ' +
	trr +
	' L ' +
	w +
	' ' +
	(h - brr) +
	' A ' +
	brr +
	' ' +
	brr +
	' 0 0 1 ' +
	(w - brr) +
	' ' +
	h +
	' L ' +
	blr +
	' ' +
	h +
	' A ' +
	blr +
	' ' +
	blr +
	' 0 0 1 0 ' +
	(h - blr) +
	' Z';

export const prettifyScreenshot = async (file) => {
	let buffer = file;
	const image = sharp(buffer);

	const imageMetadata = await image.metadata();

	const widthTops = imageMetadata.height / 12;

	const opts = {
		round: 10,
		widthCanvas: imageMetadata.width * 1.1,
		heightCanvas: imageMetadata.height * 1.2 + widthTops,
	};

	let rounded = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, 0, 0, opts.round, opts.round)}"/></svg>`,
	);

	const stats = await color.getPalette(buffer);

	let tops = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width, widthTops, opts.round, opts.round, 0, 0)}" fill="${
			stats ? `rgb(${stats[0][0]}, ${stats[0][1]}, ${stats[0][2]})` : '#ffff'
		}"
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

		const tempCanvas = createCanvas(imageMetadata.width, imageMetadata.height + widthTops);
		const tempCtx = tempCanvas.getContext('2d');

		tempCtx.drawImage(await loadImage(topsPadding), 0, 0, tempCanvas.width, widthTops);
		tempCtx.drawImage(await loadImage(roundedCornerResizer), 0, widthTops, tempCanvas.width, tempCanvas.height - widthTops);

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
