import axios from 'axios';
import { isWABusinessPlatform } from 'baileys';
import dayjs from 'dayjs';
import fs from 'fs';
import heicConvert from 'heic-convert';
import { Vibrant } from 'node-vibrant/node';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import {
	listPinterestProfilePictures,
	setPinterestProfilePictureColorPalette,
	upsertPinterestProfilePictures
} from '../../helper/database/adapters/pinterest-profile-pictures.js';
import prisma from '../../helper/database/prisma.js';
import { color, loggers } from '../../utils/modules/index.js';
import { pinterest } from '../../utils/pinterest/index.js';

const PROFILE_PICTURE_UPDATE_INTERVAL_MS = 120_000;
const PROFILE_PICTURE_NO_CROP = 'no_crop';
const BOOKMARK_END_FLAG = '-end-';
const PROFILE_PICTURE_HISTORY_LIMIT = 900;

const getSafeHttpUrl = (value) => {
	const normalized = String(value || '').trim();

	return /^https?:\/\//i.test(normalized) ? normalized : '';
};

const toImageVariant = (variant, fallbackUrl) => {
	const variantUrl = getSafeHttpUrl(variant?.url) || getSafeHttpUrl(variant) || fallbackUrl;

	if (!variantUrl) {
		return null;
	}

	return typeof variant === 'object' && variant ? { ...variant, url: variantUrl } : { url: variantUrl };
};

const getImageVariantsFromMap = (images) => {
	if (!images || typeof images !== 'object') {
		return [];
	}

	return Object.entries(images)
		.map(([key, value]) => {
			const url = getSafeHttpUrl(value?.url || value);

			if (!url) {
				return null;
			}

			return {
				url,
				width: Number(value?.width || String(key).match(/(\d+)x/i)?.[1] || 0),
				height: Number(value?.height || String(key).match(/x(\d+)/i)?.[1] || 0)
			};
		})
		.filter(Boolean);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, '../../.tmp/profile-colors');

const ensureTempDir = () => {
	if (!fs.existsSync(TEMP_DIR)) {
		fs.mkdirSync(TEMP_DIR, { recursive: true });
	}
};

const rgbToHex = (rgb) => {
	const toHex = (n) =>
		Math.round(Number(n) || 0)
			.toString(16)
			.padStart(2, '0');

	return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
};

async function convertToJpeg(buffer, ext) {
	if (ext === 'heic') {
		const jpegBuffer = await heicConvert({
			buffer,
			format: 'JPEG',
			quality: 90
		});

		return jpegBuffer;
	}

	return sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
}

async function getColorPalette(imageUrl) {
	ensureTempDir();

	let imagePath = null;

	try {
		const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

		if (!response?.data) {
			return null;
		}

		const buffer = Buffer.from(response.data);
		const hash = imageUrl.split('').reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
		const filename = `${Math.abs(hash)}`;
		const ext = imageUrl.split('.').pop()?.toLowerCase().split('?')[0] || '';

		imagePath = path.join(TEMP_DIR, `${filename}.jpg`);

		const jpegBuffer = await convertToJpeg(buffer, ext);

		await fs.promises.writeFile(imagePath, jpegBuffer);

		const palette = await Vibrant.from(imagePath).quality(10).getPalette();
		const swatches = ['Vibrant', 'LightVibrant', 'DarkVibrant', 'Muted', 'LightMuted', 'DarkMuted']
			.map((name) => palette[name])
			.filter((swatch) => Array.isArray(swatch?.rgb));

		if (!swatches.length) {
			return null;
		}

		return swatches.map((swatch) =>
			rgbToHex({
				r: Math.round(Number(swatch.rgb[0] || 0)),
				g: Math.round(Number(swatch.rgb[1] || 0)),
				b: Math.round(Number(swatch.rgb[2] || 0))
			})
		);
	} catch {
		return null;
	} finally {
		if (imagePath && fs.existsSync(imagePath)) {
			try {
				fs.unlinkSync(imagePath);
			} catch {
				// Ignore cleanup errors
			}
		}
	}
}

const normalizePinterestPictureRecord = (record) => {
	const variants = getImageVariantsFromMap(record?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(record?.original?.url) ||
		getSafeHttpUrl(record?.url) ||
		getSafeHttpUrl(record?.original) ||
		getSafeHttpUrl(record?.image_url) ||
		getSafeHttpUrl(record?.image) ||
		getSafeHttpUrl(record?.images?.orig?.url) ||
		sortedByArea[0]?.url ||
		getSafeHttpUrl(record);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(record?.original, originalUrl);
	const thumbnail = toImageVariant(
		record?.thumbnail,
		getSafeHttpUrl(record?.thumbnail?.url) ||
			getSafeHttpUrl(record?.previewUrl) ||
			getSafeHttpUrl(record?.thumbnail) ||
			getSafeHttpUrl(record?.images?.['474x']?.url) ||
			getSafeHttpUrl(record?.images?.['236x']?.url) ||
			sortedByArea.at(-1)?.url ||
			originalUrl
	) ||
		toImageVariant(record?.preview, originalUrl) || { url: originalUrl };

	return { original, thumbnail };
};

export const hydrateProfilePictureHistory = async (config) => {
	try {
		const entries = await listPinterestProfilePictures(prisma, { limit: PROFILE_PICTURE_HISTORY_LIMIT });

		config.pinterest.images.clear();

		for (const entry of entries) {
			const timestamp = String(entry?.timestamp || '').trim();
			const normalized = normalizePinterestPictureRecord(entry);

			if (timestamp && normalized) {
				config.pinterest.images.set(timestamp, normalized);
			}
		}
	} catch (error) {
		loggers.warning(color('Failed loading pinterest profile pictures:', 'red'), color(error.message, 'white'));
	}
};

const persistProfilePictureHistory = async (config) => {
	const entriesIter = config.pinterest.images?.entries?.();
	const entries = (entriesIter ? Array.from(entriesIter) : [])
		.map(([timestamp, value]) => {
			const normalized = normalizePinterestPictureRecord(value);

			if (!normalized) {
				return null;
			}

			return { timestamp: String(timestamp || ''), url: normalized.original.url, thumbnail: normalized.thumbnail.url };
		})
		.filter((entry) => entry && entry.timestamp && /^https?:\/\//i.test(entry.url))
		.slice(-PROFILE_PICTURE_HISTORY_LIMIT);

	await upsertPinterestProfilePictures(prisma, entries);
};

export const startProfilePictureService = async (client, config) => {
	let images = [];
	let bookmarks = null;
	let currentPinterestId = null;

	await hydrateProfilePictureHistory(config);

	const fetchImages = async (pinterestId) => {
		const response = pinterestId ? await pinterest.getSimilarPin(pinterestId, bookmarks) : await pinterest.getHomefeed();

		images = response?.images || response || [];

		if (response?.bookmarks) {
			if (response.bookmarks === BOOKMARK_END_FLAG) {
				bookmarks = null;
				currentPinterestId = null;
				return;
			}

			bookmarks = response.bookmarks;
		} else {
			bookmarks = null;
		}
	};

	const backfillPalettes = async () => {
		const entries = await listPinterestProfilePictures(prisma, { limit: 50 });
		const missing = entries.filter((e) => !e.colorPalette?.length && e.url).slice(0, 3);

		for (const entry of missing) {
			const hexes = await getColorPalette(entry.url).catch(() => null);

			if (hexes?.length) {
				await setPinterestProfilePictureColorPalette(prisma, entry.timestamp, hexes).catch(() => {});
			}
		}
	};

	let isUpdating = false;

	const runUpdate = async () => {
		if (isUpdating) {
			return;
		}

		isUpdating = true;

		try {
			const pinterestId = config.pinterest.id;

			if (images.length === 0 && !currentPinterestId) {
				await fetchImages(pinterestId);
				currentPinterestId = pinterestId || null;
			}

			if (pinterestId !== currentPinterestId) {
				images = [];
				bookmarks = null;
				await fetchImages(pinterestId);
				currentPinterestId = pinterestId || null;
			}

			if (images.length === 0) {
				await fetchImages(pinterestId);
			}

			if (images.length === 0) {
				return;
			}

			const nextImage = images.shift();
			const normalizedImage = normalizePinterestPictureRecord(nextImage);

			if (!normalizedImage) {
				return;
			}

			const { data: image } = await axios.get(normalizedImage.original.url, { responseType: 'arraybuffer' });
			const date = dayjs.tz().format('YYYY/MM/DD HH:mm:ss');

			config.pinterest.images.set(date, normalizedImage);
			await persistProfilePictureHistory(config);
			await client.updateProfilePicture(client.user.id, image, PROFILE_PICTURE_NO_CROP);
			client.socket?.ev?.emit('profile-picture.sync', { image, date });

			getColorPalette(normalizedImage.original.url)
				.then((hexes) => {
					if (hexes?.length) {
						void setPinterestProfilePictureColorPalette(prisma, date, hexes).catch(() => {});
					}
				})
				.catch(() => {});

			if (isWABusinessPlatform(client.auth.state.creds.platform)) {
				await client.updateCoverPhoto(await sharp(image).blur(10).png().toBuffer());
			}

			await backfillPalettes();
		} catch (error) {
			const ignorable = [
				'not-acceptable',
				'internal-server-error',
				'bad-request',
				'fetch failed',
				'Connection Closed',
				'source: bad seek',
				'403'
			];

			if (!ignorable.some((msg) => error?.message.includes(msg))) {
				loggers.error('Profile picture update failed:', error?.message);
			}
		} finally {
			isUpdating = false;
		}
	};

	setInterval(() => void runUpdate(), PROFILE_PICTURE_UPDATE_INTERVAL_MS);
};
