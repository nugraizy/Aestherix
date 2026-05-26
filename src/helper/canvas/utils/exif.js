import WebPMux from 'node-webpmux';

import { buildExifBuffer } from '../../utils/misc/create-exif.js';

export async function applyExif(webpBuffer, { packname, author }) {
	const img = new WebPMux.Image();

	await img.load(webpBuffer);
	img.exif = buildExifBuffer(packname, author);

	return img.save(null);
}
