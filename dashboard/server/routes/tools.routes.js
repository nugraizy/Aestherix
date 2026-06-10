import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';

import { validate } from '../middleware/validation.middleware.js';

const convertUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 100 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const allowed = ['image/', 'video/', 'audio/'];

		if (allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
			cb(null, true);
			return;
		}

		cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: image, video, audio.`));
	}
});

const panelStateBody = z.object({
	state: z.enum(['enabled', 'disabled', 'maintenance'])
});

const panelIdParams = z.object({
	id: z.string().min(1)
});

export function createToolsRouter({ services }) {
	const { tools, comics, middleware } = services;
	const router = Router();

	router.get('/tools/panels', middleware.requireDashboardAuth, async (_req, res) => {
		const panels = await tools.listPanels();

		res.json({ panels });
	});

	router.patch(
		'/tools/panels/:id',
		middleware.requireSuperOwnerAuth,
		validate({ params: panelIdParams, body: panelStateBody }),
		async (req, res) => {
			const result = await tools.setPanelState(req.params.id, req.body.state);

			if (!result.ok) {
				return res.status(400).json(result);
			}

			services.socket?.emit('dashboard:tools', { panels: await tools.listPanels() });

			res.json(result);
		}
	);

	router.post('/tools/download', middleware.requireDashboardAuth, async (req, res) => {
		const url = String(req.body?.url || '').trim();

		if (!url || !url.startsWith('http')) {
			return res.status(400).json({ ok: false, message: 'Invalid URL.' });
		}

		try {
			const result = await tools.download(url);

			res.json(result);
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Download failed.' });
		}
	});

	router.post('/tools/merge', middleware.requireDashboardAuth, async (req, res) => {
		const { video, audio, title } = req.body || {};

		if (!video || !audio) {
			return res.status(400).json({ ok: false, message: 'Provide video and audio URLs.' });
		}

		const { execSync } = await import('child_process');
		const { randomBytes } = await import('crypto');
		const fs = await import('fs/promises');
		const path = await import('path');

		const tmpDir = path.join(process.cwd(), 'tmp');
		const id = randomBytes(8).toString('hex');
		const tmpVideo = path.join(tmpDir, `merge-${id}-video.mp4`);
		const tmpAudio = path.join(tmpDir, `merge-${id}-audio.m4a`);
		const tmpOutput = path.join(tmpDir, `merge-${id}-output.mp4`);

		try {
			const headers = {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				Referer: 'https://www.bilibili.tv/'
			};

			const [videoRes, audioRes] = await Promise.all([fetch(video, { headers }), fetch(audio, { headers })]);

			if (!videoRes.ok) {
				throw new Error(`Failed to download video stream (${videoRes.status})`);
			}

			if (!audioRes.ok) {
				throw new Error(`Failed to download audio stream (${audioRes.status})`);
			}

			await Promise.all([
				fs.writeFile(tmpVideo, Buffer.from(await videoRes.arrayBuffer())),
				fs.writeFile(tmpAudio, Buffer.from(await audioRes.arrayBuffer()))
			]);

			execSync(`ffmpeg -y -i "${tmpVideo}" -i "${tmpAudio}" -c:v copy -c:a copy "${tmpOutput}"`, { timeout: 120000 });

			const stat = await fs.stat(tmpOutput);
			const filename = `${(title || 'video').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;

			res.setHeader('Content-Type', 'video/mp4');
			res.setHeader('Content-Length', stat.size);
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

			const { createReadStream } = await import('fs');
			const stream = createReadStream(tmpOutput);

			stream.pipe(res);
			stream.on('end', () => {
				fs.unlink(tmpVideo).catch(() => {});
				fs.unlink(tmpAudio).catch(() => {});
				fs.unlink(tmpOutput).catch(() => {});
			});
			stream.on('error', () => {
				fs.unlink(tmpVideo).catch(() => {});
				fs.unlink(tmpAudio).catch(() => {});
				fs.unlink(tmpOutput).catch(() => {});
			});
		} catch (error) {
			await fs.unlink(tmpVideo).catch(() => {});
			await fs.unlink(tmpAudio).catch(() => {});
			await fs.unlink(tmpOutput).catch(() => {});

			if (!res.headersSent) {
				res.status(500).json({ ok: false, message: error?.message || 'Merge failed.' });
			}
		}
	});

	router.post('/tools/download-zip', middleware.requireDashboardAuth, async (req, res) => {
		const urls = req.body?.urls;

		if (!Array.isArray(urls) || !urls.length) {
			return res.status(400).json({ ok: false, message: 'Provide at least 1 URL.' });
		}

		try {
			const archiver = (await import('archiver')).default;
			const archive = archiver('zip', { zlib: { level: 5 } });

			res.setHeader('Content-Type', 'application/zip');
			res.setHeader('Content-Disposition', `attachment; filename="download-${Date.now()}.zip"`);
			archive.pipe(res);

			for (let i = 0; i < urls.length; i++) {
				const url = String(urls[i] || '').trim();

				if (!url.startsWith('http')) {
					continue;
				}

				const response = await fetch(url, {
					headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
				});

				if (!response.ok) {
					continue;
				}

				const contentType = response.headers.get('content-type') || '';
				const ext = contentType.includes('audio')
					? 'mp3'
					: contentType.includes('video')
						? 'mp4'
						: contentType.includes('image/png')
							? 'png'
							: contentType.includes('image/gif')
								? 'gif'
								: contentType.includes('image/webp')
									? 'webp'
									: contentType.includes('image')
										? 'jpg'
										: 'bin';

				const buffer = Buffer.from(await response.arrayBuffer());

				archive.append(buffer, { name: `media-${i + 1}.${ext}` });
			}

			await archive.finalize();
		} catch (error) {
			if (!res.headersSent) {
				res.status(500).json({ ok: false, message: error?.message || 'Zip failed.' });
			}
		}
	});

	router.get('/tools/proxy', middleware.requireDashboardAuth, async (req, res) => {
		const url = String(req.query?.url || '').trim();

		if (!url || !url.startsWith('http')) {
			return res.status(400).json({ ok: false, message: 'Invalid URL.' });
		}

		try {
			const proxyHeaders = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

			if (url.includes('deviantart.com/download') && process.env.DEVIANTART_COOKIE) {
				proxyHeaders.Cookie = process.env.DEVIANTART_COOKIE;
			}

			if (url.includes('bilibili')) {
				proxyHeaders.Referer = 'https://www.bilibili.tv/';
			}

			if (url.includes('tiktokcdn.com') || url.includes('tiktok.com')) {
				proxyHeaders.Referer = 'https://www.tiktok.com/';
			}

			const response = await fetch(url, { headers: proxyHeaders });

			if (!response.ok) {
				return res.status(response.status).end();
			}

			const contentType = response.headers.get('content-type') || '';
			let buffer = Buffer.from(await response.arrayBuffer());

			let finalContentType = contentType;

			if (contentType.includes('heic') || contentType.includes('heif') || url.includes('tiktokcdn.com/tos-')) {
				try {
					const heic = (await import('heic-convert')).default;

					buffer = Buffer.from(await heic({ buffer, format: 'JPEG', quality: 90 }));
					finalContentType = 'image/jpeg';
				} catch {
					// If conversion fails, serve as-is
				}
			}

			if (finalContentType) {
				res.setHeader('Content-Type', finalContentType);
			}

			const ext = finalContentType?.includes('audio')
				? '.mp3'
				: finalContentType?.includes('video')
					? '.mp4'
					: finalContentType?.includes('png')
						? '.png'
						: finalContentType?.includes('gif')
							? '.gif'
							: finalContentType?.includes('webp')
								? '.webp'
								: finalContentType?.includes('image')
									? '.jpg'
									: '';
			const pathPart = new URL(url).pathname.split('/').pop()?.split('?')[0] || '';
			const filename = pathPart && pathPart.includes('.') ? pathPart : `media-${Date.now()}${ext}`;

			res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
			res.setHeader('Cache-Control', 'public, max-age=3600');

			res.send(buffer);
		} catch {
			res.status(502).end();
		}
	});

	router.get('/tools/comics/sources', middleware.requireDashboardAuth, (_req, res) => {
		res.json({ sources: comics.getSources() });
	});

	let enkaClient = null;
	let enkaClasses = null;

	async function getEnkaClient() {
		if (enkaClient) {
			return enkaClient;
		}

		const mod = await import('enka-network-api');

		enkaClient = new mod.EnkaClient({ showFetchCacheLog: false });
		enkaClasses = { TextAssets: mod.TextAssets, DynamicTextAssets: mod.DynamicTextAssets, EnkaClient: mod.EnkaClient };
		enkaClient.cachedAssetsManager.cacheDirectoryPath = './cache';
		enkaClient.cachedAssetsManager.cacheDirectorySetup();

		if (!(await enkaClient.cachedAssetsManager.checkForUpdates(true))) {
			await enkaClient.cachedAssetsManager.fetchAllContents();
		}

		return enkaClient;
	}

	function convertGenshinObject(obj) {
		if (typeof obj !== 'object' || obj === null || obj === undefined) {
			return obj;
		}

		if (!enkaClasses) {
			return obj;
		}

		const entries = Object.entries(obj)
			.filter(([key, value]) => !key.startsWith('_') && !(value instanceof enkaClasses.EnkaClient))
			.map(([key, value]) => [key, convertGenshinObject(value)]);

		if (obj instanceof enkaClasses.TextAssets) {
			entries.push(['text', obj instanceof enkaClasses.DynamicTextAssets ? obj.getNullableReplacedText() : obj.getNullable()]);
		}

		return Object.fromEntries(entries);
	}

	const genshinCache = new Map();
	const GENSHIN_CACHE_TTL = 10 * 60 * 1000;

	router.get('/tools/genshin/characters', middleware.requireDashboardAuth, async (req, res) => {
		const uid = String(req.query?.uid || '').trim();

		if (!/^\d{9,10}$/.test(uid)) {
			return res.status(400).json({ ok: false, message: 'Invalid UID format. Must be 9-10 digits.' });
		}

		try {
			const cached = genshinCache.get(uid);

			if (cached && Date.now() - cached.timestamp < GENSHIN_CACHE_TTL) {
				return res.json({ user: cached.user, characters: cached.characters });
			}

			const enka = await getEnkaClient();
			const userInfo = await enka.fetchUser(Number(uid));
			const jsonData = convertGenshinObject(userInfo);

			const { parseGenshinUser, parseCharactersData } = await import('../../../src/helper/canvas/genshin-parser.js');
			const user = parseGenshinUser(jsonData);
			const characters = parseCharactersData(jsonData.characters);

			genshinCache.set(uid, { user, characters, timestamp: Date.now() });

			res.json({ user, characters });
		} catch (error) {
			res.status(500).json({
				ok: false,
				message: error?.message || 'Failed to fetch data. Make sure the UID is correct and your showcase is public.'
			});
		}
	});

	router.get('/tools/genshin/card', middleware.requireDashboardAuth, async (req, res) => {
		const uid = String(req.query?.uid || '').trim();
		const charName = String(req.query?.char || '').trim();
		const useRadar = String(req.query?.radar || '') === '1';

		if (!/^\d{9,10}$/.test(uid)) {
			return res.status(400).json({ ok: false, message: 'Invalid UID format.' });
		}

		if (!charName) {
			return res.status(400).json({ ok: false, message: 'Provide character name.' });
		}

		try {
			let cached = genshinCache.get(uid);

			if (!cached || Date.now() - cached.timestamp >= GENSHIN_CACHE_TTL) {
				const enka = await getEnkaClient();
				const userInfo = await enka.fetchUser(Number(uid));
				const jsonData = convertGenshinObject(userInfo);

				const { parseGenshinUser, parseCharactersData } = await import('../../../src/helper/canvas/genshin-parser.js');
				const user = parseGenshinUser(jsonData);
				const characters = parseCharactersData(jsonData.characters);

				genshinCache.set(uid, { user, characters, timestamp: Date.now() });
				cached = { user, characters };
			}

			const found = cached.characters.find((c) => c.name.toLowerCase().includes(charName.toLowerCase()));

			if (!found) {
				const available = cached.characters.map((c) => c.name).join(', ');

				return res.status(404).json({ ok: false, message: `Character "${charName}" not found.`, available });
			}

			const { GenshinCard } = await import('../../../src/helper/canvas/card-render.js');
			const card = new GenshinCard(found, cached.user, { statsChart: useRadar ? 'radar' : 'list' });
			const result = await card.render();

			res.setHeader('Content-Type', 'image/svg+xml');
			res.send(result.svg);
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to generate card.' });
		}
	});

	router.get('/tools/genshin/card/png', middleware.requireDashboardAuth, async (req, res) => {
		const uid = String(req.query?.uid || '').trim();
		const charName = String(req.query?.char || '').trim();
		const useRadar = String(req.query?.radar || '') === '1';

		if (!/^\d{9,10}$/.test(uid)) {
			return res.status(400).json({ ok: false, message: 'Invalid UID format.' });
		}

		if (!charName) {
			return res.status(400).json({ ok: false, message: 'Provide character name.' });
		}

		try {
			let cached = genshinCache.get(uid);

			if (!cached || Date.now() - cached.timestamp >= GENSHIN_CACHE_TTL) {
				const enka = await getEnkaClient();
				const userInfo = await enka.fetchUser(Number(uid));
				const jsonData = convertGenshinObject(userInfo);

				const { parseGenshinUser, parseCharactersData } = await import('../../../src/helper/canvas/genshin-parser.js');
				const user = parseGenshinUser(jsonData);
				const characters = parseCharactersData(jsonData.characters);

				genshinCache.set(uid, { user, characters, timestamp: Date.now() });
				cached = { user, characters };
			}

			const found = cached.characters.find((c) => c.name.toLowerCase().includes(charName.toLowerCase()));

			if (!found) {
				const available = cached.characters.map((c) => c.name).join(', ');

				return res.status(404).json({ ok: false, message: `Character "${charName}" not found.`, available });
			}

			const { GenshinCard } = await import('../../../src/helper/canvas/card-render.js');
			const card = new GenshinCard(found, cached.user, { statsChart: useRadar ? 'radar' : 'list' });
			const result = await card.render();
			const buffer = await result.toBuffer();

			res.setHeader('Content-Type', 'image/png');
			res.setHeader('Content-Disposition', `inline; filename="genshin-${uid}-${found.name}.png"`);
			res.send(buffer);
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to generate card.' });
		}
	});

	router.get('/tools/comics/filters', middleware.requireDashboardAuth, async (req, res) => {
		const source = String(req.query?.source || '').trim();

		if (!source) {
			return res.status(400).json({ ok: false, message: 'Provide source.' });
		}

		try {
			res.json({ filters: await comics.getFilters(source) });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to load filters.' });
		}
	});

	router.get('/tools/comics/home', middleware.requireDashboardAuth, async (req, res) => {
		const source = String(req.query?.source || '').trim();
		const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
		let selected = {};

		try {
			selected = req.query?.filters ? JSON.parse(String(req.query.filters)) : {};
		} catch {
			selected = {};
		}

		if (!source) {
			return res.status(400).json({ ok: false, message: 'Provide source.' });
		}

		try {
			const { items, hasNext } = await comics.getHome(source, page, selected);

			res.json({ results: items, hasNext });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to load home.' });
		}
	});

	router.get('/tools/comics/search', middleware.requireDashboardAuth, async (req, res) => {
		const source = String(req.query?.source || '').trim();
		const query = String(req.query?.q || '').trim();

		if (!source || !query) {
			return res.status(400).json({ ok: false, message: 'Provide source and query.' });
		}

		try {
			res.json({ results: await comics.search(source, query) });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Search failed.' });
		}
	});

	router.get('/tools/comics/detail', middleware.requireDashboardAuth, async (req, res) => {
		const source = String(req.query?.source || '').trim();
		const id = String(req.query?.id || '').trim();

		if (!source || !id) {
			return res.status(400).json({ ok: false, message: 'Provide source and id.' });
		}

		try {
			res.json(await comics.getDetail(source, id, { refresh: String(req.query?.refresh || '') === '1' }));
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to fetch detail.' });
		}
	});

	router.get('/tools/comics/pages', middleware.requireDashboardAuth, async (req, res) => {
		const source = String(req.query?.source || '').trim();
		const ref = String(req.query?.ref || '').trim();

		if (!source || !ref) {
			return res.status(400).json({ ok: false, message: 'Provide source and chapter ref.' });
		}

		try {
			res.json({ pages: await comics.getPages(source, ref) });
		} catch (error) {
			res.status(500).json({ ok: false, message: error?.message || 'Failed to fetch pages.' });
		}
	});

	router.get('/tools/comics/image', middleware.requireDashboardAuth, async (req, res) => {
		const token = req.query?.token ? String(req.query.token) : '';
		const source = String(req.query?.source || '').trim();
		const url = String(req.query?.url || '').trim();

		try {
			if (token) {
				const cached = comics.getImageByToken(token);

				if (!cached) {
					return res.status(404).end();
				}

				res.setHeader('Content-Type', cached.contentType);
				res.setHeader('Cache-Control', 'public, max-age=3600');

				return res.send(cached.buffer);
			}

			if (!url.startsWith('http')) {
				return res.status(400).end();
			}

			const { buffer, contentType } = await comics.fetchImage(source, url);

			res.setHeader('Content-Type', contentType);
			res.setHeader('Cache-Control', 'public, max-age=3600');
			res.send(buffer);
		} catch {
			res.status(502).end();
		}
	});

	router.post('/tools/comics/pdf', middleware.requireDashboardAuth, async (req, res) => {
		const { source, refs, title } = req.body || {};

		if (!source || !Array.isArray(refs) || !refs.length) {
			return res.status(400).json({ ok: false, message: 'Provide source and chapter refs.' });
		}

		try {
			const buffer = await comics.buildPdf(source, refs);
			const filename = `${String(title || 'comic').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
			res.send(buffer);
		} catch (error) {
			if (!res.headersSent) {
				res.status(500).json({ ok: false, message: error?.message || 'PDF generation failed.' });
			}
		}
	});

	router.post('/tools/convert', middleware.requireDashboardAuth, convertUpload.single('file'), async (req, res) => {
		const file = req.file;

		if (!file) {
			return res.status(400).json({ ok: false, message: 'Upload a file.' });
		}

		const outputFormat = String(req.body?.outputFormat || '').toLowerCase().trim();

		if (!outputFormat) {
			return res.status(400).json({ ok: false, message: 'Provide outputFormat.' });
		}

		const ext = (file.originalname.split('.').pop() || '').toLowerCase();

		try {
			const result = await tools.convert(file.buffer, ext, outputFormat);

			if (!result.ok) {
				return res.status(400).json(result);
			}

			const baseName = file.originalname.replace(/\.[^.]+$/, '');
			const filename = `${baseName}.${result.extension}`;

			res.setHeader('Content-Type', result.contentType);
			res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
			res.send(result.buffer);
		} catch (error) {
			if (!res.headersSent) {
				res.status(500).json({ ok: false, message: error?.message || 'Conversion failed.' });
			}
		}
	});

	router.get('/tools/convert/options', middleware.requireDashboardAuth, (req, res) => {
		const format = String(req.query?.format || '').toLowerCase().trim();

		if (!format) {
			return res.status(400).json({ ok: false, message: 'Provide format.' });
		}

		const options = tools.getConversionOptions(format);

		res.json({ options });
	});

	return router;
}
