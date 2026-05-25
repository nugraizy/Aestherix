import Canvas from '@napi-rs/canvas';
import emojiReg from 'emoji-regex';
import path from 'path';
import { fileURLToPath } from 'url';
import WebPMux from 'node-webpmux';

import { color, loggers } from '../../utils/modules/index.js';
import { scheme } from '../misc/palettes/colors.js';
import { fillText } from './fill-text.js';

const { createCanvas, GlobalFonts } = Canvas;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/Chevin Bold.ttf'), 'chevin');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/texgyreadventor-bold.otf'), 'texgy');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/SourceSansPro-Italic.ttf'), 'sanspro');
GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/KeepCalm-Medium.ttf'), 'calm');

const STICKER_PACK_ID = 'com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2';
const GOOGLE_LINK = 'https://play.google.com/store/apps/details?id=com.marsconstd.stickermakerforwhatsapp';
const APPLE_LINK = 'https://itunes.apple.com/app/sticker-maker-studio/id1443326857';

function buildExifBuffer(packname, author) {
	const json = {
		'sticker-pack-id': STICKER_PACK_ID,
		'sticker-pack-name': packname,
		'sticker-pack-publisher': author,
		'android-app-store-link': GOOGLE_LINK,
		'ios-app-store-link': APPLE_LINK
	};

	let { length } = JSON.stringify(json);
	const header = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
	const code = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00];

	if (length > 256) {
		length -= 256;
		code.unshift(0x01);
	} else {
		code.unshift(0x00);
	}

	const lenHex = length < 16 ? `0${length.toString(16)}` : length.toString(16);

	return Buffer.concat([header, Buffer.from(lenHex, 'hex'), Buffer.from(code), Buffer.from(JSON.stringify(json))]);
}

function loadColorsPalette(colored) {
	const defaultColors = [
		['047af6', '7401df', '202532', '32fa00', 'ff00d5'],
		['4db1c3', '046084', '35b07e', 'f0a7aa', 'e74758'],
		['ffffff', 'f7a9ef', 'f881ec', 'f751e6', 'c400b0'],
		['ffaf39', 'ee7e1b', 'ef421b', 'cf214b', 'bf1679'],
		['86ff5d', '34e361', '14d285', '0ebb9b', '0c9ea9'],
		['e0f4ff', 'cbecff', 'afe2ff', 'afd5ff', 'afc8ff'],
		['d2dbde', '8debff', '84b7ff', 'b8b8b8', '08e1ff'],
		['ffef2b', '2f4af4', 'ee1c62', '33ee87', '6cfcff'],
		['6500ff', 'ffe04e', '8b00ff', 'bd93ed', '7400ff'],
		scheme().map((v) => v.replace('#', ''))
	];

	if (colored) {
		return colored[Math.floor(Math.random() * colored.length)];
	}

	const palette = defaultColors[Math.floor(Math.random() * defaultColors.length)];

	return palette[Math.floor(Math.random() * palette.length)];
}

export const ttp = async (sender, texts, colored, fonts) => {
	fonts = fonts !== undefined ? fonts.toLowerCase() : 'chevin';
	colored = colored.length ? colored : null;

	loggers.warning(`${color('Making Static Image', 'pink')} for ${color(sender, 'lilac')}`);

	const canvas = createCanvas(500, 500);
	const ctx = canvas.getContext('2d');
	const colors = loadColorsPalette(colored);
	const reassignColor = colors.startsWith('#') ? colors : `#${colors}`;

	ctx.fillStyle = reassignColor;

	fillText(canvas, texts.trim().replace(new RegExp(emojiReg(), 'g'), ''), {
		font: `82px ${fonts}`,
		textAlign: 'center',
		verticalAlign: 'middle',
		sizeToFill: true
	});

	const webpBuffer = Buffer.from(canvas.toBuffer('image/webp'));

	const img = new WebPMux.Image();

	await img.load(webpBuffer);
	img.exif = buildExifBuffer('Made by Nanda', 'Aestherix Static Sticker using Canvas and WebP');

	const result = await img.save(null);

	loggers.info(`${color('Static Image is generated', 'pink')} for ${color(sender, 'lilac')}`);

	return result;
};
