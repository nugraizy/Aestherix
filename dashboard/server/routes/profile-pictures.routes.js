import { Router } from 'express';
import path from 'path';
import { z } from 'zod';

import { noStoreJson } from '../middleware/no-store.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
	PROFILE_PICTURE_HISTORY_LIMIT,
	PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT,
	PROFILE_PICTURES_COLOR_TOLERANCE_MAX
} from '../services/profile-pictures.service.js';
import { ROOMS } from '../socket/rooms.js';

const downloadProfilePictureQuery = z.object({
	url: z.string().url(),
	timestamp: z.string().optional()
});

const deleteProfilePictureBody = z.object({
	timestamp: z.string().min(1),
	url: z.string().url()
});

function extensionFromMime(mimeType) {
	const normalized = String(mimeType || '')
		.toLowerCase()
		.split(';')[0]
		.trim();

	if (normalized === 'image/jpeg') {
		return 'jpg';
	}

	if (normalized === 'image/png') {
		return 'png';
	}

	if (normalized === 'image/webp') {
		return 'webp';
	}

	if (normalized === 'image/gif') {
		return 'gif';
	}

	if (normalized === 'image/bmp') {
		return 'bmp';
	}

	if (normalized === 'image/avif') {
		return 'avif';
	}

	if (normalized === 'image/svg+xml') {
		return 'svg';
	}

	return '';
}

function extensionFromUrl(urlValue) {
	try {
		const parsed = new URL(String(urlValue || ''));
		const ext = path
			.extname(parsed.pathname || '')
			.replace('.', '')
			.toLowerCase();

		return /^[a-z0-9]{2,5}$/i.test(ext) ? ext : '';
	} catch {
		return '';
	}
}

function sanitizeDownloadFilename(rawValue) {
	const safe = String(rawValue || '')
		.trim()
		.replace(/[^a-z0-9._-]+/gi, '_')
		.replace(/_+/g, '_')
		.slice(0, 120);

	return safe || 'album-image';
}

function buildProfilePictureFilename({ timestamp = '', imageUrl = '', mimeType = '' } = {}) {
	const base = sanitizeDownloadFilename(timestamp ? `album-${timestamp}` : `album-${Date.now()}`);
	const extension = extensionFromMime(mimeType) || extensionFromUrl(imageUrl) || 'jpg';

	return `${base}.${extension}`;
}

function isBlockedDownloadHost(hostname) {
	const safeHost = String(hostname || '')
		.trim()
		.toLowerCase();

	if (!safeHost) {
		return true;
	}

	if (safeHost === 'localhost' || safeHost === '127.0.0.1' || safeHost === '::1') {
		return true;
	}

	return false;
}

export function createProfilePicturesRouter({ services }) {
	const { audit, profilePictures, socket, middleware } = services;
	const router = Router();

	router.get('/profile-pictures', middleware.requireDashboardAuth, noStoreJson, async (req, res) => {
		const rawLimit = req.query?.limit;
		const limit = rawLimit === undefined ? PROFILE_PICTURE_HISTORY_LIMIT : Number(rawLimit);
		const colorHex = String(req.query?.color || '').trim();
		const tolerance = Math.max(
			0,
			Math.min(PROFILE_PICTURES_COLOR_TOLERANCE_MAX, Number(req.query?.tolerance || PROFILE_PICTURES_COLOR_TOLERANCE_DEFAULT))
		);

		let pictures = await profilePictures.list({ limit });

		if (colorHex) {
			pictures = await profilePictures.filterByColor(pictures, { colorHex, tolerance });
		}

		res.json({
			count: pictures.length,
			pictures,
			filter: colorHex ? { color: colorHex, tolerance } : null
		});
	});

	router.get(
		'/profile-pictures/download',
		middleware.requireDashboardAuth,
		validate({ query: downloadProfilePictureQuery }),
		async (req, res) => {
			const imageUrl = String(req.query?.url || '').trim();
			const timestamp = String(req.query?.timestamp || '').trim();

			let parsedUrl;

			try {
				parsedUrl = new URL(imageUrl);
			} catch {
				return res.status(400).json({ ok: false, message: 'Invalid image URL.' });
			}

			if (!/^https?:$/i.test(parsedUrl.protocol) || isBlockedDownloadHost(parsedUrl.hostname)) {
				return res.status(400).json({ ok: false, message: 'Image URL is not allowed.' });
			}

			let upstream;

			try {
				upstream = await fetch(parsedUrl.toString(), { redirect: 'follow' });
			} catch {
				return res.status(502).json({ ok: false, message: 'Failed fetching image source.' });
			}

			if (!upstream.ok) {
				return res.status(502).json({ ok: false, message: 'Image source is unavailable.' });
			}

			const mimeType = String(upstream.headers.get('content-type') || 'application/octet-stream');
			const filename = buildProfilePictureFilename({
				timestamp,
				imageUrl: parsedUrl.toString(),
				mimeType
			});
			const encodedFilename = encodeURIComponent(filename);
			const bytes = Buffer.from(await upstream.arrayBuffer());

			res.setHeader('Content-Type', mimeType);
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
			res.setHeader('Cache-Control', 'no-store');
			res.setHeader('X-Content-Type-Options', 'nosniff');

			res.send(bytes);
		}
	);

	router.delete(
		'/profile-pictures',
		middleware.requireOwnerAuth,
		validate({ body: deleteProfilePictureBody }),
		async (req, res) => {
			const session = req.dashboardSession;
			const payload = {
				timestamp: String(req.body?.timestamp || '').trim(),
				url: String(req.body?.url || '').trim()
			};

			const result = await profilePictures.delete(payload);

			if (!result.ok) {
				audit.push({
					action: 'profile_picture.delete',
					session,
					target: payload.timestamp || payload.url || 'profile-picture',
					status: 'failed',
					message: result.message || 'Failed deleting profile picture.'
				});

				return res.status(404).json({
					ok: false,
					message: result.message || 'Profile picture not found.'
				});
			}

			socket?.io?.emit?.(ROOMS.PROFILE_PICTURES, {
				picture: null,
				deleted: payload
			});

			audit.push({
				action: 'profile_picture.delete',
				session,
				target: payload.timestamp || payload.url || 'profile-picture',
				message: 'Owner deleted a profile picture from albums.'
			});

			res.json({ ok: true, deletedCount: result.deletedCount });
		}
	);

	return router;
}
