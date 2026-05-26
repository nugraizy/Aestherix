import Canvas from '@napi-rs/canvas';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

export { graphThemes, syntaxThemes } from './themes.js';

const { createCanvas, GlobalFonts, loadImage } = Canvas;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../../media/fonts');

let fontsRegistered = false;

export function registerFonts() {
	if (fontsRegistered) {
		return;
	}

	fontsRegistered = true;

	const fonts = [
		['Chevin Bold.ttf', 'chevin'],
		['texgyreadventor-bold.otf', 'texgy'],
		['SourceSansPro-Italic.ttf', 'sanspro'],
		['SourceSansPro-Regular.ttf', 'sans-regular'],
		['SourceSansPro-Light.ttf', 'source'],
		['KeepCalm-Medium.ttf', 'calm'],
		['HelveticaNeueMedium.otf', 'Helvetica'],
		['AtypText-Semibold.ttf', 'atyp'],
		['Galyon-Book.otf', 'galyon'],
		['Nina-Bold.otf', 'nina-bold'],
		['Abril-Text-Bold.otf', 'AbrilText-Bold'],
		['IBM.ttf', 'ibm'],
		['JetBrainsMono-Light.ttf', 'JetBrainsMono'],
		['zh-cn.ttf', 'ZHCN'],
		['impact.ttf', 'impact'],
		['coolvetica rg.otf', 'coolvetica']
	];

	for (const [file, name] of fonts) {
		GlobalFonts.registerFromPath(path.join(FONTS_DIR, file), name);
	}
}

export function createCanvasCtx(width, height) {
	const canvas = createCanvas(width, height);

	return { canvas, ctx: canvas.getContext('2d') };
}

export async function roundImage(buffer, width, height, radius) {
	const mask = Buffer.from(
		`<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`
	);

	return sharp(buffer)
		.resize(width, height)
		.composite([{ input: mask, blend: 'dest-in' }])
		.png()
		.toBuffer();
}

export const roundedRectData = (width, height, r) =>
	`M ${r} 0 H ${width - r} A ${r} ${r} 0 0 1 ${width} ${r} V ${height - r} A ${r} ${r} 0 0 1 ${width - r} ${height} H ${r} A ${r} ${r} 0 0 1 0 ${height - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;

export { createCanvas, GlobalFonts, loadImage };
