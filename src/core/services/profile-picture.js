import axios from 'axios';
import { isWABusinessPlatform } from 'baileys';
import dayjs from 'dayjs';
import sharp from 'sharp';

import { listPinterestProfilePictures, upsertPinterestProfilePictures } from '../../helper/database/adapters/pinterest-profile-pictures.js';
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

const normalizePinterestPictureRecord = (record) => {
	const variants = getImageVariantsFromMap(record?.images);
	const sortedByArea = [...variants].sort((a, b) => b.width * b.height - a.width * a.height);

	const originalUrl =
		getSafeHttpUrl(record?.original?.url) || getSafeHttpUrl(record?.url) || getSafeHttpUrl(record?.original) ||
		getSafeHttpUrl(record?.image_url) || getSafeHttpUrl(record?.image) || getSafeHttpUrl(record?.images?.orig?.url) ||
		sortedByArea[0]?.url || getSafeHttpUrl(record);

	if (!originalUrl) {
		return null;
	}

	const original = toImageVariant(record?.original, originalUrl);
	const thumbnail = toImageVariant(
		record?.thumbnail,
		getSafeHttpUrl(record?.thumbnail?.url) || getSafeHttpUrl(record?.previewUrl) || getSafeHttpUrl(record?.thumbnail) ||
		getSafeHttpUrl(record?.images?.['474x']?.url) || getSafeHttpUrl(record?.images?.['236x']?.url) ||
		sortedByArea.at(-1)?.url || originalUrl
	) || toImageVariant(record?.preview, originalUrl) || { url: originalUrl };

	return { original, thumbnail };
};

export const hydrateProfilePictureHistory = async (config) => {
	try {
		const entries = await listPinterestProfilePictures(prisma, { limit: PROFILE_PICTURE_HISTORY_LIMIT });

		config.pinterestImages.clear();

		for (const entry of entries) {
			const timestamp = String(entry?.timestamp || '').trim();
			const normalized = normalizePinterestPictureRecord(entry);

			if (timestamp && normalized) {
				config.pinterestImages.set(timestamp, normalized);
			}
		}
	} catch (error) {
		loggers.warning(color('Failed loading pinterest profile pictures:', 'red'), color(error.message, 'white'));
	}
};

const persistProfilePictureHistory = async (config) => {
	const entries = (Array.isArray(config.pinterestImages?.entries?.()) ? config.pinterestImages.entries() : [])
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

	let isUpdating = false;

	const runUpdate = async () => {
		if (isUpdating) {
			return;
		}

		isUpdating = true;

		try {
			const pinterestId = config.pinterestId;

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

			config.pinterestImages.set(date, normalizedImage);
			await persistProfilePictureHistory(config);
			await client.updateProfilePicture(global.instance, image, PROFILE_PICTURE_NO_CROP);

			if (isWABusinessPlatform(client.auth.state.creds.platform)) {
				await client.updateCoverPhoto(await sharp(image).blur(10).png().toBuffer());
			}
		} catch (error) {
			const ignorable = ['not-acceptable', 'internal-server-error', 'bad-request', 'fetch failed', 'Connection Closed', 'source: bad seek', '403'];

			if (!ignorable.some((msg) => error.message.includes(msg))) {
				loggers.error('Profile picture update failed:', error.message);
			}
		} finally {
			isUpdating = false;
		}
	};

	setInterval(() => void runUpdate(), PROFILE_PICTURE_UPDATE_INTERVAL_MS);
};
