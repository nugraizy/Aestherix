import {
	downloadContentFromMessage,
	downloadMediaMessage as downloadMessage,
	fetchLatestBaileysVersion,
	generateWAMessage,
	generateWAMessageFromContent,
	isJidGroup,
	jidDecode,
	jidNormalizedUser,
	makeWASocket,
	toBuffer
} from 'baileys';
import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs-extra';
import webpmux from 'node-webpmux';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { TextEncoder } from 'node:util';
import P from 'pino';
import sharp from 'sharp';
import { fetch } from 'undici';

import configuration from '../helper/config/connect.js';
import { getAllContacts } from '../helper/database/adapters/user.js';
import prisma from '../helper/database/prisma.js';
import { S_WHATSAPP_NET, ZERO } from '../helper/misc/wa_data/index.js';
import { Cache } from '../helper/modules/cache.js';
import { gif2mp4 } from '../utils/index.js';
import { fetchBUFFER, isURL } from '../utils/modules/index.js';
import { Auth } from './auth.js';
import { TEMP_DIR } from './constants.js';
import { Context } from './context.js';
import { Logger } from './logger.js';
import { Store } from './store.js';

export class ClientSocket extends EventEmitter {
	static #hasWebpmux = null;
	static #cachedExifPath = null;
	static #cachedExifMeta = null;

	#auth;
	#store;
	#socket = null;
	#options;
	#state = 'disconnected';
	#startedAt = null;
	#logger = null;

	constructor(auth, options = {}) {
		super();

		if (!(auth instanceof Auth)) {
			throw new TypeError('ClientSocket: auth must be an Auth instance');
		}

		this.#auth = auth;
		this.#options = {
			role: 'primary',
			flags: {},
			logger: P({ level: 'fatal' }),
			browser: ['Mac OS', 'Chrome', 'Chrome 114.0.5735.198'],
			...options
		};
		this.#store = null;
	}

	get auth() {
		return this.#auth;
	}

	get sessionName() {
		return this.#auth.sessionName;
	}

	get store() {
		return this.#store;
	}

	get socket() {
		return this.#socket;
	}

	get state() {
		return this.#state;
	}

	get role() {
		return this.#options.role;
	}

	get options() {
		return this.#options;
	}

	get phone() {
		return this.#socket?.user?.id?.split(':')[0] ?? null;
	}

	get uptime() {
		if (!this.#startedAt) {
			return null;
		}

		const ms = Date.now() - this.#startedAt;
		const minutes = Math.floor(ms / 60000);

		if (minutes < 60) {
			return `${minutes}m`;
		}

		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;

		return `${hours}h ${remainingMinutes}m`;
	}

	get logger() {
		if (!this.#logger) {
			const badge = this.#options.role === 'primary' ? 'MAIN' : `SUB-${this.sessionName}`;

			this.#logger = new Logger();
			this.#logger.setSessionBadge(badge);
		}

		return this.#logger;
	}

	get needsPairing() {
		return Boolean(
			this.#options.flags.pairMode &&
			this.#socket &&
			!this.#socket.authState.creds.registered &&
			!this.#socket.authState.creds.me?.id
		);
	}

	async connect({ prisma: db, store } = {}) {
		if (this.#state === 'connected' || this.#state === 'connecting') {
			return this;
		}

		this.#state = 'connecting';

		await this.#auth.initialize({ logger: this.#options.logger });

		if (store) {
			this.#store = store instanceof Store ? store : null;
		} else if (db) {
			this.#store = new Store(db, this.sessionName, {
				logger: this.#options.logger,
				resetOnStart: this.#options.flags.resetOnStart
			});
			await this.#store.initialize();
		}

		let version;

		try {
			({ version } = await fetchLatestBaileysVersion());
		} catch {
			version = [2, 3000, 0];
		}

		const cachedGroupMetadata = this.#options.cachedGroupMetadata;

		this.#socket = makeWASocket({
			auth: this.#auth.state,
			logger: this.#options.logger,
			version,
			browser: this.#options.browser,
			printQRInTerminal: !this.#options.flags.pairMode,
			msgRetryCounterCache: new Cache(),
			markOnlineOnConnect: true,
			generateHighQualityLinkPreview: true,
			defaultQueryTimeoutMs: 0,
			mediaCache: new Cache(),
			userDevicesCache: new Cache(),
			cachedGroupMetadata: (jid) => {
				if (cachedGroupMetadata) {
					return cachedGroupMetadata(jid);
				}

				return isJidGroup(jid) ? this.#store?.groupMetadata?.[jid] : {};
			},
			emitOwnEvents: false,
			getMessage: async (key) => {
				const msg = await this.#store?.loadMessage(key.remoteJid, key.id);

				return msg?.message || undefined;
			}
		});

		if (this.#store) {
			this.#store.bind(this.#socket.ev);
		}

		this.#bindEvents();
		this.#startedAt = Date.now();
		this.#exposeSocketMethods();

		return this;
	}

	#exposeSocketMethods() {
		if (!this.#socket) {
			return;
		}

		const skip = new Set(['then', 'catch', 'finally', 'ev', 'ws', 'end']);

		for (const key of Object.keys(this.#socket)) {
			if (skip.has(key) || typeof this.#socket[key] !== 'function' || key in this) {
				continue;
			}

			this[key] = this.#socket[key].bind(this.#socket);
		}
	}

	async disconnect() {
		if (this.#socket) {
			this.#socket.end(undefined);
		}

		this.#state = 'disconnected';
		this.#startedAt = null;
		this.removeAllListeners();
	}

	async resetSession(db) {
		const name = this.sessionName ? this.sessionName.replace(/\//g, '__').replace(/:/g, '-') : '';

		if (!name) {
			return;
		}

		const prefix = `${name}-`;

		await db.session.deleteMany({ where: { sessionId: { startsWith: prefix } } });
	}

	generateMessageID() {
		return 'HFINDER' + randomBytes(18).toString('hex').toUpperCase();
	}

	async send(jid, message, options = {}) {
		if (!this.#socket) {
			throw new Error('ClientSocket: not connected');
		}

		options = {
			...options,
			...(isJidGroup(jid) && { useCachedGroupMetadata: true }),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.groups.metadata?.get(jid)?.ephemeralDuration ||
				configuration.users.info?.get(jid)?.ephemeralDuration ||
				0,
			ai: true
		};

		if (('image' in message || 'video' in message) && 'footer' in message) {
			if (message.caption) {
				message.caption = `${message?.caption}\n\n${message.footer}`?.trim();
			}
		}

		if ((message?.video || message?.image || message?.document || message?.audio)?.url) {
			const buffer = await fetchBUFFER((message.video || message.image || message.document || message.audio)?.url);

			if (message.video) {
				message.video = buffer;
			}

			if (message.image) {
				message.image = buffer;
			}

			if (message.document) {
				message.document = buffer;
			}

			if (message.audio) {
				message.audio = buffer;
			}
		}

		return this.#socket.sendMessage(jid, message, options);
	}

	async reply(jid, text, quoted) {
		return this.send(
			jid,
			{ text },
			{ quoted, ephemeralExpiration: configuration.users.info?.get(jid)?.ephemeralDuration || 0 }
		);
	}

	async relay(jid, message, options = {}) {
		if (!this.#socket) {
			throw new Error('ClientSocket: not connected');
		}

		options = {
			...options,
			...(isJidGroup(jid) && { useCachedGroupMetadata: true }),
			ephemeralExpiration:
				options?.groupMetadata?.ephemeralDuration ||
				configuration.groups.metadata?.get(jid)?.ephemeralDuration ||
				configuration.users.info?.get(jid)?.ephemeralDuration ||
				0,
			messageId: options.messageId || this.generateMessageID(),
			ai: true
		};

		return this.#socket.relayMessage(jid, message, options);
	}

	async prepareMedia(media, type, opts = {}) {
		const content = isURL(media) ? { url: media } : media;
		const typeMap = {
			imageMessage: { image: content },
			videoMessage: { video: content },
			audioMessage: { audio: content },
			documentMessage: { document: content, fileName: opts.fileName, mimetype: opts.mimetype },
			stickerMessage: { sticker: content },
			locationMessage: { ...media }
		};

		return generateWAMessage(ZERO, typeMap[type] || content, { ...opts, upload: this.#socket.waUploadToServer });
	}

	async applyExif(buffer, metadata) {
		const data = {
			'sticker-pack-id': metadata?.id || '',
			'sticker-pack-name': metadata?.packname || '',
			'sticker-pack-publisher': metadata?.author || ''
		};

		if (ClientSocket.#hasWebpmux === null) {
			try {
				execFileSync('webpmux', ['-version'], { stdio: 'ignore' });
				ClientSocket.#hasWebpmux = true;
			} catch {
				ClientSocket.#hasWebpmux = false;
			}
		}

		if (ClientSocket.#hasWebpmux) {
			return this.#applyExifBinary(buffer, data);
		}

		return this.#applyExifNode(buffer, data);
	}

	async #applyExifBinary(buffer, data) {
		const tmpDir = TEMP_DIR;

		await fs.ensureDir(tmpDir);

		const metaKey = JSON.stringify(data);

		if (!ClientSocket.#cachedExifPath || ClientSocket.#cachedExifMeta !== metaKey) {
			const exifPath = `${tmpDir}/data.exif`;
			const jsonBuf = Buffer.from(JSON.stringify(data), 'utf-8');
			const exif = Buffer.concat([
				Buffer.from([
					0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16,
					0x00, 0x00, 0x00
				]),
				jsonBuf
			]);

			exif.writeUIntLE(jsonBuf.length, 14, 4);
			await fs.writeFile(exifPath, exif);
			ClientSocket.#cachedExifPath = exifPath;
			ClientSocket.#cachedExifMeta = metaKey;
		}

		const id = randomBytes(4).toString('hex');
		const tmpIn = `${tmpDir}/exif-${id}-in.webp`;
		const tmpOut = `${tmpDir}/exif-${id}-out.webp`;

		try {
			if (
				buffer[0] === 0x52 &&
				buffer[1] === 0x49 &&
				buffer[2] === 0x46 &&
				buffer[3] === 0x46 &&
				buffer.readUInt32LE(4) === 0
			) {
				buffer = Buffer.from(buffer);
				buffer.writeUInt32LE(buffer.length - 8, 4);
			}

			await fs.writeFile(tmpIn, buffer);
			execFileSync('webpmux', ['-set', 'exif', ClientSocket.#cachedExifPath, tmpIn, '-o', tmpOut], { stdio: 'pipe' });

			return await fs.readFile(tmpOut);
		} finally {
			await fs.remove(tmpIn).catch(() => {});
			await fs.remove(tmpOut).catch(() => {});
		}
	}

	async #applyExifNode(buffer, data) {
		const jsonBuf = Buffer.from(JSON.stringify(data), 'utf-8');
		const exif = Buffer.concat([
			Buffer.from([
				0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00,
				0x00, 0x00
			]),
			jsonBuf
		]);

		exif.writeUIntLE(new TextEncoder().encode(JSON.stringify(data)).length, 14, 4);
		buffer =
			buffer instanceof webpmux.Image
				? buffer
				: await (async () => {
						const img = new webpmux.Image();

						await img.load(buffer);
						return img;
					})();
		buffer.exif = exif;
		return await buffer.save(null);
	}

	async prepareSticker(media, type, exif) {
		const isMediaURL = Buffer.isBuffer(media) ? false : isURL(media);

		media = isMediaURL ? Buffer.from(await (await fetch(media)).arrayBuffer()) : media;

		const bufferType =
			type === 'imageMessage'
				? 'image'
				: type === 'videoMessage'
					? 'video'
					: type === 'stickerAnimated'
						? 'sticker'
						: (await fileTypeFromBuffer(media)).mime.includes('video')
							? 'video'
							: 'image';

		if (bufferType === 'video') {
			const id = randomBytes(4).toString('hex');
			const tmpIn = `${TEMP_DIR}/${id}-in.bin`;
			const tmpOut = `${TEMP_DIR}/${id}-out.webp`;

			await fs.ensureDir(TEMP_DIR);
			await fs.writeFile(tmpIn, media);

			try {
				await new Promise((resolve, reject) => {
					const args = [
						'-i',
						tmpIn,
						'-vcodec',
						'libwebp',
						'-fs',
						'800k',
						'-r',
						'15',
						'-b:v',
						'500k',
						'-vf',
						'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
						'-t',
						'10',
						'-f',
						'webp',
						'-y',
						tmpOut
					];
					const ff = spawn('ffmpeg', args, { windowsHide: true });
					const stderrChunks = [];

					ff.stderr.on('data', (chunk) => stderrChunks.push(chunk));
					ff.on('error', reject);
					ff.on('close', (code) => {
						if (code !== 0) {
							reject(new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderrChunks).toString()}`));
							return;
						}

						resolve();
					});
				});

				media = await fs.readFile(tmpOut);
			} finally {
				await fs.remove(tmpIn).catch(() => {});
				await fs.remove(tmpOut).catch(() => {});
			}
		} else if (bufferType === 'sticker') {
			return await this.applyExif(media, exif);
		} else {
			media = await sharp(media, { animated: bufferType === 'video' })
				.resize(512, 512, { fit: sharp.fit.contain, background: { r: 0, g: 0, b: 0, alpha: 0 } })
				.webp()
				.toBuffer();
		}

		return await this.applyExif(media, exif);
	}

	async downloadMediaMessage(media, typeDownloadable = 'buffer') {
		return downloadMessage(media, typeDownloadable);
	}

	async downloadAndSaveMediaMessage(media, path, type) {
		const msg = await downloadContentFromMessage(media, type.replace(/Message/g, ''));
		const buffer = await toBuffer(msg);

		await fs.writeFile(path, buffer);
		return path;
	}

	async waitMessage(jid, message, quoted) {
		const { key } = await this.send(
			jid,
			{ text: message },
			{ quoted, ephemeralExpiration: configuration.users.info?.get(jid)?.ephemeralDuration || 0 }
		);
		const update = async (text) => {
			this.send(jid, { edit: key, text });
		};

		return { update };
	}

	async edit(jid, message, key) {
		await this.#socket.sendMessage(jid, { edit: key, text: message });
	}

	async generateProfilePicture(mediaUpload, type) {
		let bufferOrFilePath = Buffer.isBuffer(mediaUpload)
			? mediaUpload
			: isURL(mediaUpload)
				? await fetchBUFFER(mediaUpload)
				: mediaUpload;
		let image = sharp(bufferOrFilePath);
		const { width, height } = await image.metadata();
		let targetWidth = 640;
		let targetHeight = 640;

		if (type === 'no_crop') {
			const aspectRatio = width / height;

			if (width > height) {
				targetWidth = 300;
				targetHeight = Math.round(targetWidth / aspectRatio);
			} else if (width < height) {
				targetHeight = 700;
				targetWidth = Math.round(targetHeight * aspectRatio);
			}

			image = image.resize({ width: targetWidth, height: targetHeight }).jpeg();
		} else if (type === 'no_stretch') {
			const min = Math.min(width, height);

			image = image
				.extract({ left: 0, top: 0, width: min, height: min })
				.resize(640, 640, { fit: 'fill' })
				.jpeg({ quality: 50 });
		} else {
			image = image.resize({ width: targetWidth, height: targetHeight }).jpeg();
		}

		return { image: await image.toBuffer() };
	}

	async updateProfilePicture(jid, media, option) {
		if (!jid) {
			throw new Error('Illegal no-jid profile update');
		}

		let targetJid;

		if (jidNormalizedUser(jid) !== jidNormalizedUser(this.#socket.authState.creds.me.id)) {
			targetJid = jidNormalizedUser(jid);
		}

		const { image } = await this.generateProfilePicture(media, option);

		await this.#socket.query({
			tag: 'iq',
			attrs: { ...(targetJid ? { target: targetJid } : {}), to: S_WHATSAPP_NET, type: 'set', xmlns: 'w:profile:picture' },
			content: [{ tag: 'picture', attrs: { type: 'image' }, content: image }]
		});
	}

	async setStatus(status) {
		if (!status) {
			throw new Error('Status is empty');
		}

		return this.#socket.query({
			tag: 'iq',
			attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'status' },
			content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }]
		});
	}

	decodeJid(jid) {
		const { user, server } = jidDecode(jid);

		return user + '@' + server;
	}

	/**
	 * Resolve a phone-number / JID / LID to either canonical JID (`<n>@s.whatsapp.net`)
	 * or LID (`<n>@lid`). When the input is already in the target shape it is returned as-is.
	 *
	 * @param {string | number} input - bare digits, JID, or LID.
	 * @param {'jid' | 'lid'} [target='jid'] - desired output format.
	 * @returns {Promise<string | null>} resolved identifier or `null` if no mapping is known.
	 */
	async resolveJid(input, target = 'jid') {
		if (target !== 'jid' && target !== 'lid') {
			throw new TypeError(`resolveJid: target must be 'jid' or 'lid' (got "${target}")`);
		}

		const raw = String(input ?? '').trim();

		if (!raw) {
			return null;
		}

		let normalized;

		if (raw.endsWith('@lid')) {
			normalized = raw;
		} else if (raw.includes('@')) {
			normalized = jidNormalizedUser(raw);
		} else {
			const digits = raw.replace(/\D/g, '');

			if (!digits) {
				return null;
			}

			normalized = `${digits}${S_WHATSAPP_NET}`;
		}

		const isLid = normalized.endsWith('@lid');

		if (target === 'lid' && isLid) {
			return normalized;
		}

		if (target === 'jid' && !isLid) {
			return normalized;
		}

		const lidMapping = this.#socket?.signalRepository?.lidMapping;

		if (!lidMapping) {
			return null;
		}

		try {
			return target === 'lid' ? await lidMapping.getLIDForPN(normalized) : await lidMapping.getPNForLID(normalized);
		} catch {
			return null;
		}
	}

	clearType(type, mime = '') {
		if (type === 'imageMessage' || type === 'videoMessage') {
			return type.replace(/Message/, '');
		}

		if (type === 'documentMessage' || type === 'documentWithCaptionMessage' || type === 'stickerMessage') {
			return mime;
		}

		return type;
	}

	get jidNormalizedUser() {
		return jidNormalizedUser;
	}

	get user() {
		return this.#socket?.user;
	}

	get authState() {
		return this.#socket?.authState;
	}

	async updateGroup(jid, { action, participants = [], admins = [], force = false, message = null, text = '' } = {}) {
		const { getLocale } = await import('../helper/i18n/index.js');
		const locale = await getLocale(jid);
		const quoted = message ? { quoted: message } : {};

		if (action === 'add' || action === 'remove' || action === 'demote' || action === 'promote') {
			let validParticipants = participants.filter((p) => p != null);

			if (action === 'add') {
				const lidMapping = this.#socket?.signalRepository?.lidMapping;

				if (lidMapping) {
					const converted = [];

					for (const p of validParticipants) {
						if (p && p.endsWith('@lid')) {
							try {
								const pn = await lidMapping.getPNForLID(p);

								converted.push(pn || p);
							} catch {
								converted.push(p);
							}
						} else {
							converted.push(p);
						}
					}

					validParticipants = converted;
				}
			}

			return this.#updateGroupParticipants(jid, action, validParticipants, admins, { force, quoted, locale });
		}

		if (action === 'subject') {
			return [await this.#socket.groupUpdateSubject(jid, text)];
		}

		if (action === 'description') {
			return [await this.#socket.groupUpdateDescription(jid, text)];
		}

		if (action === 'retrieve') {
			return [await this.#socket.groupInviteCode(jid)];
		}

		if (action === 'revoke') {
			return [await this.#socket.groupRevokeInvite(jid)];
		}

		return [await this.#socket.groupSettingUpdate(jid, action)];
	}

	async groupRequestParticipantsList(jid) {
		return this.#socket.groupRequestParticipantsList(jid);
	}

	async groupRequestParticipantsUpdate(jid, participants, action) {
		return this.#socket.groupRequestParticipantsUpdate(jid, participants, action);
	}

	async groupToggleEphemeral(jid, duration) {
		return this.#socket.groupToggleEphemeral(jid, duration);
	}

	async groupMemberAddMode(jid, mode) {
		return this.#socket.groupMemberAddMode(jid, mode);
	}

	async #updateGroupParticipants(jid, action, participants, admins, { force, quoted, locale = 'en' }) {
		const responses = [];

		for (const participant of participants) {
			const skipReason = await this.#getParticipantSkipReason(action, participant, admins, force, locale);

			if (skipReason) {
				await this.send(jid, { text: skipReason, mentions: [participant] }, quoted);
				continue;
			}

			try {
				const response = await this.#socket.groupParticipantsUpdate(jid, [participant], action);

				if (action === 'add') {
					await this.#handleAddResponse(jid, participant, response, quoted, locale);
				}

				responses.push(response);
			} catch (e) {
				responses.push({ error: e.message, id: participant });

				if (e?.status === '400') {
					await this.send(
						jid,
						{ text: L.core.errors.invalidNumber.replace('{0}', participant.split('@')[0]), mentions: [participant] },
						quoted
					);
				}
			}
		}

		return responses;
	}

	async #getParticipantSkipReason(action, participant, admins, force, locale = 'en') {
		const { useLocale } = await import('../helper/i18n/index.js');
		const L = useLocale(locale, 'common');
		const tag = `@${participant.split('@')[0]}`;
		const isAdmin = admins.includes(participant);

		if (action === 'remove' && isAdmin && !force) {
			return L.errors.cannotRemoveAdmin.replace('{0}', tag);
		}

		if (action === 'promote' && isAdmin) {
			return L.errors.alreadyAdmin.replace('{0}', tag);
		}

		if (action === 'demote' && !isAdmin) {
			return L.errors.alreadyMember.replace('{0}', tag);
		}

		return null;
	}

	async #handleAddResponse(jid, participant, response, quoted, locale = 'en') {
		const { useLocale } = await import('../helper/i18n/index.js');
		const L = useLocale(locale, 'common');
		const status = response?.[0]?.status;

		if (status === '500') {
			await this.send(jid, { text: L.errors.groupFull }, quoted);
		} else if (status === '408') {
			await this.send(jid, { text: L.errors.justLeft.replace('{0}', participant) }, quoted);
		} else if (status === '403') {
			await this.#sendGroupInvite(jid, participant, response, quoted);
		} else if (status === '401') {
			await this.send(jid, { text: L.errors.blockedBot.replace('{0}', participant) }, quoted);
		}
	}

	async #sendGroupInvite(jid, participant, response, quoted) {
		const { getLocale, useLocale } = await import('../helper/i18n/index.js');
		const locale = await getLocale(jid);
		const L = useLocale(locale, 'common');

		await this.send(jid, { text: L.core.info.privacyInvite.replace('{0}', participant) }, quoted);

		const metadata = await this.#socket.groupMetadata(jid);
		let thumbnail;

		try {
			thumbnail = await fetchBUFFER(await this.#socket.profilePictureUrl(jid, 'preview'));
		} catch {
			thumbnail = undefined;
		}

		const inviteMsg = generateWAMessageFromContent(
			jid,
			{
			groupInviteMessage: {
					groupJid: jid,
					inviteCode: response?.[0]?.code,
					inviteExpiration: response?.[0]?.expiration,
					groupName: metadata.subject,
					caption: L.core.info.groupInviteCaption,
					jpegThumbnail: thumbnail
				}
			},
			{}
		);

		await this.#socket.relayMessage(participant, inviteMsg.message, { messageId: inviteMsg.key.id });
	}

	updateCoverPhoto(buffer) {
		return this.#socket.updateCoverPhoto(buffer);
	}

	async searchMessage(jid, query) {
		let i = 0;
		const containers = this.#store.loadMessages(jid);
		const keys = [];

		if (!containers.length) {
			return keys;
		}

		for (const messages of containers) {
			if (i === 20) {
				break;
			}

			const { message, body, isCmd } = await Context.from(structuredClone(messages), this, this.#store);

			if (body.includes(query) && !isCmd) {
				keys.push(message);
				i++;
			}
		}

		return keys;
	}

	async getStoryParticipants() {
		const node = await this.#socket.query({
			tag: 'iq',
			attrs: { id: this.generateMessageID(), to: '@s.whatsapp.net', xmlns: 'status', type: 'get' },
			content: [{ tag: 'privacy', attrs: {}, content: undefined }]
		});
		const mode = node.content[0].content.find((v) => v.attrs?.default === 'true').attrs.type;
		let jids = (await getAllContacts(prisma)).map((v) => v.id);

		if (mode === 'whitelist') {
			jids = node.content[0].content.find((v) => v.attrs?.type === 'whitelist').content.map((v) => v.attrs?.jid);
		} else if (mode === 'blacklist') {
			const blacklisted =
				node.content[0].content.find((v) => v.attrs?.type === 'blacklist').content?.map((v) => v.attrs?.jid) || [];

			if (blacklisted.length) {
				jids = jids.filter((v) => !blacklisted.includes(v));
			}
		}

		return jids;
	}

	get TemplateBuilder() {
		return createTemplateBuilder(this);
	}

	async requestPairingCode(phoneNumber, clientId = 'AESTHERX') {
		if (!this.#socket) {
			throw new Error('ClientSocket: not connected');
		}

		return this.#socket.requestPairingCode(phoneNumber, clientId);
	}

	get ev() {
		return this;
	}

	#bindEvents() {
		const forwardEvents = [
			'connection.update',
			'creds.update',
			'messages.upsert',
			'messages.update',
			'messages.delete',
			'message-receipt.update',
			'messages.reaction',
			'presence.update',
			'contacts.upsert',
			'contacts.update',
			'groups.upsert',
			'groups.update',
			'group-participants.update',
			'call',
			'labels.edit',
			'labels.association',
			'poll.update'
		];

		for (const event of forwardEvents) {
			this.#socket.ev.on(event, (data) => {
				this.emit(event, data);
			});
		}

		this.#socket.ev.on('connection.update', (update) => {
			if (update.connection === 'open') {
				this.#state = 'connected';
			} else if (update.connection === 'close') {
				this.#state = 'disconnected';
			}

			if (update.qr) {
				this.emit('qr', update.qr);
			}
		});

		this.#socket.ev.on('creds.update', () => {
			this.#auth.saveCreds().catch(() => {});
		});
	}
}

function createTemplateBuilder(client) {
	const button = {
		copy: (data) => ({
			name: 'cta_copy',
			buttonParamsJson: JSON.stringify({ display_text: data.display, copy_code: data.code })
		}),
		reply: (data) => ({ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: data.display, id: data.id }) }),
		url: (data) => ({
			name: 'cta_url',
			buttonParamsJson: JSON.stringify({ display_text: data.display, url: data.url, merchant_url: data.url })
		}),
		list: (data) => ({
			name: 'single_select',
			buttonParamsJson: JSON.stringify({ title: data.display, sections: data.sections })
		}),
		call: (data) => ({
			name: 'cta_call',
			buttonParamsJson: JSON.stringify({ display_text: data.display, phone_number: data.phoneNumber })
		}),
		setReminder: (data) => ({ name: 'cta_reminder', buttonParamsJson: JSON.stringify({ display_text: data.display }) }),
		cancelReminder: (data) => ({
			name: 'cta_cancel_reminder',
			buttonParamsJson: JSON.stringify({ display_text: data.display })
		}),
		address: (data) => ({ name: 'address_message', buttonParamsJson: JSON.stringify({ display_text: data.display }) }),
		location: (data) => ({ name: 'send_location', buttonParamsJson: JSON.stringify({ display_text: data.display }) }),
		webview: (data) => ({
			name: 'open_webview',
			buttonParamsJson: JSON.stringify({ title: data.title, link: { in_app_webview: data.inApp, url: data.url } })
		})
	};

	async function getMessageType(media) {
		const mime = (await fileTypeFromBuffer(media))?.mime || '';

		return { mime, messageType: mime.includes('gif') || mime.includes('video') ? 'videoMessage' : 'imageMessage' };
	}

	async function prepareGif(media, messageType) {
		const id = Date.now();
		const inputPath = `./tmp/input-${id}.gif`;
		const outputPath = `./tmp/output-${id}.mp4`;

		await fs.writeFile(inputPath, media);

		const { output } = await gif2mp4(inputPath, outputPath);
		const fileBuffer = await fs.readFile(output);
		const preparedMedia = await client.prepareMedia(fileBuffer, messageType);

		preparedMedia.message[messageType].gifPlayback = true;
		await fs.unlink(inputPath);
		await fs.unlink(outputPath);

		return preparedMedia;
	}

	async function prepareMessage(media) {
		if (Buffer.isBuffer(media)) {
			const { mime, messageType } = await getMessageType(media);
			const preparedMedia =
				mime === 'image/gif' ? await prepareGif(media, messageType) : await client.prepareMedia(media, messageType);

			return { [messageType]: preparedMedia.message[messageType], hasMediaAttachment: true };
		} else if (typeof media === 'string' && isURL(media)) {
			const buffer = Buffer.from(await (await fetch(media)).arrayBuffer(), 'base64');
			const { mime, messageType } = await getMessageType(buffer);
			const preparedMedia =
				mime === 'image/gif' ? await prepareGif(buffer, messageType) : await client.prepareMedia(buffer, messageType);

			return { [messageType]: preparedMedia.message[messageType], hasMediaAttachment: true };
		}

		const messageType = 'imageMessage';

		return {
			[messageType]: (await client.prepareMedia(Buffer.alloc(10), messageType)).message[messageType],
			hasMediaAttachment: true
		};
	}

	class Native {
		constructor() {
			this.button = button;
			this._destination = null;
			this._media = null;
			this._buttons = [];
			this._buildParams = {
				message: {
					messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
					interactiveMessage: {
						body: { text: '' },
						footer: { text: '' },
						header: { title: '' },
						nativeFlowMessage: { buttons: [], messageParamsJson: '' }
					}
				}
			};
		}

		destination(to) {
			this._destination = to;
			return this;
		}
		body(text) {
			this._buildParams.message.interactiveMessage.body.text = text;
			return this;
		}
		footer(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;
			return this;
		}
		header(text, media) {
			this._buildParams.message.interactiveMessage.header.title = text;
			this._media = media;
			return this;
		}
		buttons(...btns) {
			this._buttons = btns;
			return this;
		}

		mentions(mentions) {
			this._buildParams.message.interactiveMessage.contextInfo = {
				mentionedJid: mentions?.length > 0 ? mentions : []
			};

			return this;
		}

		async render() {
			this._media = !this._media ? { hasMediaAttachment: false } : await prepareMessage(this._media);
			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};
			this._buildParams.message.interactiveMessage.nativeFlowMessage.buttons = this._buttons;

			return generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{ viewOnceMessage: this._buildParams },
				{ messageId: client.generateMessageID() }
			);
		}

		async send() {
			this._media = !this._media ? { hasMediaAttachment: false } : await prepareMessage(this._media);
			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};
			this._buildParams.message.interactiveMessage.nativeFlowMessage.buttons = this._buttons;

			const {
				key: { id },
				message
			} = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{ viewOnceMessage: this._buildParams },
				{ messageId: client.generateMessageID() }
			);

			await client.relay(this._destination, message, { messageId: id });
		}
	}

	class Carousel {
		constructor() {
			this.button = button;
			this._destination = null;
			this._media = null;
			this._cards = [];
			this._buildParams = {
				message: {
					messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
					interactiveMessage: {
						body: { text: '' },
						footer: { text: '' },
						header: { title: '' },
						carouselMessage: { cards: [] }
					}
				}
			};
		}

		destination(to) {
			this._destination = to;
			return this;
		}
		body(text) {
			this._buildParams.message.interactiveMessage.body.text = text;
			return this;
		}
		footer(text) {
			this._buildParams.message.interactiveMessage.footer.text = text;
			return this;
		}
		header(text, media) {
			this._buildParams.message.interactiveMessage.header.title = text;
			this._media = media;
			return this;
		}

		mentions(mentions) {
			this._buildParams.message.interactiveMessage.contextInfo = {
				mentionedJid: mentions?.length > 0 ? mentions : []
			};

			return this;
		}

		cards(cards) {
			this._cards = cards.map(async ({ body: b, footer: f, title, header, buttons: btns }) => {
				const attachment = await prepareMessage(header || Buffer.alloc(10));

				return {
					body: { text: b || '' },
					footer: { text: f || '' },
					header: { title: title || '', ...attachment },
					nativeFlowMessage: { buttons: btns, messageParamsJson: '' }
				};
			});

			return this;
		}

		async send() {
			this._cards = await Promise.all(this._cards);
			this._media = !this._media ? { hasMediaAttachment: false } : await prepareMessage(this._media);
			this._buildParams.message.interactiveMessage.carouselMessage.cards = this._cards;
			this._buildParams.message.interactiveMessage.header = {
				...this._buildParams.message.interactiveMessage.header,
				...this._media
			};

			const {
				key: { id },
				message
			} = generateWAMessageFromContent(
				'0@s.whatsapp.net',
				{ viewOnceMessage: this._buildParams },
				{ messageId: client.generateMessageID() }
			);

			await client.relay(this._destination, message, { messageId: id });
		}
	}

	return { Native, Carousel };
}
