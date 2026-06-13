const STICKER_PACK_ID = 'com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2';
const GOOGLE_LINK = 'https://play.google.com/store/apps/details?id=com.marsconstd.stickermakerforwhatsapp';
const APPLE_LINK = 'https://itunes.apple.com/app/sticker-maker-studio/id1443326857';

export const buildExifBuffer = (packname, author) => {
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
	const lenBuf = Buffer.alloc(2);

	lenBuf.writeUInt16LE(length, 0);

	return Buffer.concat([header, lenBuf, Buffer.from(code), Buffer.from(JSON.stringify(json))]);
};

export const createExif = buildExifBuffer;
