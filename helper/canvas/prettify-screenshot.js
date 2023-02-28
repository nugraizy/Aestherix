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

	const opts = {
		round: 40,
		widthCanvas: imageMetadata.width * 2,
		heightCanvas: imageMetadata.height + 1113,
		width: (multiple) => imageMetadata.width * multiple,
		height: (multiple) => imageMetadata.height * multiple,
	};

	if (opts.heightCanvas < 500 || opts.widthCanvas < 500) {
		return { error: 'Image too small. Please use better resolution. Width >= 500 & Height >= 500' };
	}

	let rounded = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width, imageMetadata.height, 0, 0, opts.round, opts.round)}"/></svg>`,
	);

	const stats = await color.getPalette(buffer);

	let tops = new Buffer.from(
		`<svg><path d="${roundedRectData(imageMetadata.width * 1.6, 150, opts.round, opts.round, 0, 0)}" fill="${
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

		ctx.drawImage(
			await loadImage(topsPadding),
			canvas.width / 2 - opts.width(1.6) / 2,
			canvas.height / 2 - opts.height(1.6) / 2 - 150,
			imageMetadata.width * 1.6,
			150,
		);

		ctx.drawImage(
			await loadImage(roundedCornerResizer),
			canvas.width / 2 - opts.width(1.6) / 2,
			canvas.height / 2 - opts.height(1.6) / 2,
			opts.width(1.6),
			opts.height(1.6),
		);

		let combine = canvas.toBuffer('image/png');

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

		ctx.fillText(
			watermark,
			canvas.width / 2 - measured / 2,
			opts.height(imageMetadata.width === imageMetadata.height ? 1.6 : 1.9) + 340,
		);

		measured = ctx.measureText(time).width;

		ctx.fillText(time, canvas.width / 2 - measured / 2, 170);

		ctx.shadowBlur = 70;
		ctx.shadowColor = 'black';
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 20;

		ctx.drawImage(
			await loadImage(combine),
			canvas.width / 2 - (imageMetadata.width * 2.2) / 2,
			canvas.height / 2 - (imageMetadata.height * 2.2) / 2,
			imageMetadata.width * 2.2,
			imageMetadata.height + 1113,
		);

		combine = null;
		buffer = null;
		tops = null;
		rounded = null;

		return canvas.toBuffer('image/png');
	}

	buffer = null;
	return { error: 'Failed to Prettify your image. Try other image that does not has transparent background.' };
};
