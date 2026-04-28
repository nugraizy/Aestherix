import Canvas from '@napi-rs/canvas';
import Wrap from 'canvas-text-wrapper';
import path from 'path';
import { fileURLToPath } from 'url';

const { createCanvas, GlobalFonts } = Canvas;
const { CanvasTextWrapper } = Wrap;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/coolvetica rg.otf'), 'coolvetica');

const ARGBtoRGBA = (num) => {
	num >>>= 0;

	const b = num & 0xff;
	const g = (num & 0xff00) >>> 8;
	const r = (num & 0xff0000) >>> 16;
	const a = ((num & 0xff000000) >>> 24) / 255;

	return `rgba(${[r, g, b, a].join(',')})`;
};

export const textStory = async (texts, color) => {
	const canvas = createCanvas(540, 1170);
	const ctx = canvas.getContext('2d');

	ctx.fillStyle = ARGBtoRGBA(color);

	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = ARGBtoRGBA(4_294_967_295);

	CanvasTextWrapper(canvas, texts, {
		font: '58px coolvetica',
		textAlign: 'center',
		verticalAlign: 'middle',
		paddingX: 20,
		paddingY: 20
	});

	return new Buffer.from(canvas.toBuffer('image/png'));
};

