// @ts-check
import { getContentType, getDevice, normalizeMessageContent } from 'baileys';
import fs from 'fs-extra';
import PhoneNumber from 'libphonenumber-js';
import configuration from '../helper/config/connect.js';
import { getBannedUsers } from '../helper/database/adapters/user.js';
import prisma from '../helper/database/prisma.js';
import { checkJSON, pushDefaultSettings, updateSettings } from '../helper/groups/settings/index.js';
import {
	extractBody,
	extractMentionedJid,
	extractMetadata,
	extractQuotedBody,
	extractTypeQuoted,
	firstKey,
	S_WHATSAPP_NET,
	toUserJid,
	typeMessage
} from '../helper/misc/wa_data/index.js';
import { Cache } from '../helper/modules/cache.js';

const TYPE_STICKER = ['imageMessage', 'videoMessage', 'stickerMessage', 'lottieStickerMessage'];
const SETTINGS_PATH = './src/helper/config/settings.json';
const lidMaps = new Cache();

function renameQuotedMessage(obj) {
	if (!obj || typeof obj !== 'object') {
		return obj;
	}

	const str = JSON.stringify(obj);

	return JSON.parse(str.replace(/"quotedMessage"/g, '"message"'));
}

function crawlProperty(obj, propName, visited = new Set()) {
	for (const key in obj) {
		if (key === propName) {
			return obj[key];
		}

		if (typeof obj[key] === 'object' && obj[key] !== null && !visited.has(obj[key])) {
			visited.add(obj[key]);
			const found = crawlProperty(obj[key], propName, visited);

			if (found !== undefined) {
				return found;
			}
		}
	}
}

export async function refreshPrefixCache(client) {
	const settings = await fs.readJSON(SETTINGS_PATH);
	const dataBanned = await getBannedUsers(prisma);
	const rawJid = client.user?.id;
	const myJid = rawJid ? client.decodeJid(rawJid) : '';
	const dataBlock = await client.fetchBlocklist().catch(() => []);

	configuration.bannedlist = dataBanned;
	configuration.blocklist = dataBlock;
	const cliPrefixFlag = configuration.flags?.prefix || '';
	const cliPrefixes = cliPrefixFlag
		? cliPrefixFlag
				.split(',')
				.map((p) => p.trim())
				.filter(Boolean)
		: [];
	let prefixMode = 'single';
	let prefixValues = [];

	if (cliPrefixFlag) {
		if (settings.prefix.multi) {
			prefixMode = 'multi';
			const base = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];

			prefixValues = [...new Set([...base, ...cliPrefixes])];
		} else {
			prefixValues = cliPrefixes.length > 1 ? cliPrefixes : cliPrefixes.length === 1 ? [cliPrefixes[0]] : [];
		}
	} else if (settings.prefix.multi && settings.prefix.nopref) {
		prefixMode = 'multi';
		const base = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];
		const custom = Array.isArray(settings.prefix.customPrefixes) ? settings.prefix.customPrefixes : [];

		prefixValues = custom.length ? [...new Set([...base, ...custom])] : base;
	} else if (settings.prefix.multi) {
		prefixMode = 'multi';
		const base = [...'°π÷×¶∆£¢€¥®™✓_=+|~!#$%^&./\\©^>'];
		const custom = Array.isArray(settings.prefix.customPrefixes) ? settings.prefix.customPrefixes : [];

		prefixValues = custom.length ? [...new Set([...base, ...custom])] : base;
	} else if (settings.prefix.nopref) {
		prefixMode = 'nopref';
		prefixValues = [];
	} else {
		prefixValues = [settings.prefix.pref || '.'];
	}

	const escCharClass = (str) => str.replace(/[\[\]\\^$]/g, (ch) => `\\${ch}`);
	const escaped = prefixValues.map(escCharClass).join('');
	const prefixReg = prefixMode === 'multi' ? new RegExp(`^[${escaped}]`) : null;

	configuration.prefix.default = prefixMode === 'nopref' ? '' : prefixValues[0] || '.';
	configuration.prefix.mode = prefixMode;
	configuration.prefix.regex = prefixReg;
	configuration.prefix.values = prefixValues;
	configuration.botJid = myJid;
	configuration.owners = [toUserJid(settings.owner_number), ...(settings.team_number || []).map(toUserJid), myJid].filter(
		Boolean
	);
	configuration.settings = settings;
	configuration.isFirstConnectionForCache = false;
}

async function ensurePrefixCache(client) {
	if (!configuration.isFirstConnectionForCache && configuration.prefix.values) {
		if (!configuration.prefix.refreshing) {
			configuration.prefix.refreshing = true;
			refreshPrefixCache(client)
				.catch(() => {})
				.finally(() => {
					configuration.prefix.refreshing = false;
				});
		}

		return;
	}

	await refreshPrefixCache(client);
}

async function ensureGroupCache(client, from, options) {
	await configuration.groups.ensure(client, from, options);
}

/** @typedef {import('../types/Core/index.js').Context} ContextType */

/** @implements {ContextType} */
export class Context {
	#raw;
	#client;
	#store;
	#state;
	#cache = {};
	constructor(rawMessage, client, store, state) {
		this.#raw = rawMessage;
		this.#client = client;
		this.#store = store;
		this.#state = state;
		this._chainHistory = null;
	}
	get raw() {
		return this.#raw;
	}
	/**	 * @param {import('../types/Messages/index.js').WAMessage} rawMessage	 * @param {import('../types/Core/index.js').ClientSocket} client	 * @param {import('../types/Core/index.js').Store} [store]	 * @param {unknown} [state]	 * @returns {Promise<Context | object>}	 */ static async from(
		rawMessage,
		client,
		store,
		state
	) {
		const m = rawMessage;

		if (m.message?.protocolMessage?.type === 0) {
			return m;
		}

		delete m?.message?.senderKeyDistributionMessage;
		await ensurePrefixCache(client);
		const ctx = new Context(m, client, store, state);

		if (m.message?.pollUpdateMessage) {
			const { PollUpdateDecrypt } = await import('../helper/misc/wa_data/index.js');

			client.ev.emit('poll.update', { ...m.message, msg: m, from: ctx.from, sender: ctx.sender, func: PollUpdateDecrypt });
		}

		if (ctx.isGroup) {
			const body = extractBody(m, ctx.type);
			const likelyCommand = ctx.#isLikelyCommand(body);
			const metadataPromise = ensureGroupCache(client, ctx.from, { forceRefresh: likelyCommand });

			await Promise.all([metadataPromise, ctx.#ensureGroupSettings(metadataPromise)]);
		}

		ctx.#ensureUserCache();

		if (!m.message) {
			return ctx.#earlyReturn();
		}

		return ctx;
	}
	/**	 * @param {string} text	 * @returns {Promise<import('../types/Messages/index.js').MessageGenerated>}	 */ async reply(text) {
		return this.#client.send(this.from, { text }, { quoted: this.#raw });
	}
	/**	 * @param {string} emoji	 * @returns {Promise<import('../types/Messages/index.js').MessageGenerated>}	 */ async react(
		emoji
	) {
		return this.#client.send(this.from, { react: { text: emoji, key: this.#raw.key } });
	}
	/**	 * @param {import('../types/Messages/index.js').MessageSendContent} content	 * @param {import('../types/Messages/index.js').MessageSendOptions} [options]	 * @returns {Promise<import('../types/Messages/index.js').MessageGenerated>}	 */ async send(
		content,
		options = {}
	) {
		return this.#client.send(this.from, content, { quoted: this.#raw, ...options });
	}
	/**	 * @param {string} jid	 * @param {import('../types/Messages/index.js').MessageSendContent} content	 * @param {import('../types/Messages/index.js').MessageSendOptions} [options]	 * @returns {Promise<import('../types/Messages/index.js').MessageGenerated>}	 */ async sendTo(
		jid,
		content,
		options = {}
	) {
		return this.#client.send(jid, content, options);
	}
	/**	 * @returns {Promise<import('../types/Messages/index.js').MessageGenerated>}	 */ async delete() {
		return this.#client.send(this.from, { delete: this.#raw.key });
	}
	derive(overrides) {
		const ctx = new Context(this.#raw, this.#client, this.#store, this.#state);

		ctx.#cache = { ...this.#cache, ...overrides };
		return ctx;
	}

	synthetic({ pipedMedia, ...overrides }) {
		const mediaTypeMap = {
			imageMessage: { isMediaImage: true, isMediaVid: false, stickerAble: true },
			videoMessage: { isMediaImage: false, isMediaVid: true, stickerAble: true },
			stickerMessage: { isMediaImage: false, isMediaVid: false, stickerAble: true, isQuotedSticker: true },
			lottieStickerMessage: { isMediaImage: false, isMediaVid: false, stickerAble: true, isQuotedSticker: true },
			audioMessage: { isMediaImage: false, isMediaVid: false, isQuotedAudio: true },
			documentMessage: { isMediaImage: false, isMediaVid: false, isMediaDocument: true, isQuotedDocument: true }
		};

		const mediaFlags = mediaTypeMap[pipedMedia.mediaType] || {};
		const syntheticMediaData = { message: { [pipedMedia.mediaType]: { __pipedBuffer: pipedMedia.buffer } } };

		return this.derive({
			...overrides,
			...mediaFlags,
			typeQuoted: pipedMedia.mediaType,
			mediaData: syntheticMediaData,
			extractMediaData: syntheticMediaData.message[pipedMedia.mediaType]
		});
	}
	get message() {
		return this.#raw;
	}
	get from() {
		return this.#memo('from', () => this.#raw?.key?.remoteJidAlt || this.#raw?.key?.remoteJid || this.#raw?.from);
	}
	get isGroup() {
		return this.#memo('isGroup', () => this.from.endsWith('@g.us'));
	}
	get isFromMe() {
		return this.#memo('isFromMe', () => Boolean(this.#raw?.key?.fromMe));
	}
	get isBotInstance() {
		return this.#memo(
			'isBotInstance',
			() => this.#raw?.key?.id?.startsWith('BAE5') || this.#raw?.key?.id?.startsWith('3EB0') || this.device?.name === 'unknown'
		);
	}
	get locale() {
		return this.#memo('locale', () => this.from?.split('@')[0] ?? 'id');
	}
	get sender() {
		return this.#memo('sender', () => {
			const m = this.#raw;
			const rawJid = this.#client.user?.id;
			const myJid = rawJid ? this.#client.decodeJid(rawJid) : '';

			if (this.isFromMe) {
				return myJid;
			}

			if (this.isGroup) {
				return m?.key?.participant?.endsWith('@lid') ? m?.key?.participantAlt : m?.key?.participant;
			}

			if (m?.key?.remoteJid === 'status@broadcast') {
				return m?.key?.participant;
			}

			return m?.key?.remoteJidAlt || m?.key?.remoteJid || m?.from;
		});
	}
	get type() {
		return this.#memo('type', () => {
			let m = this.#raw.message;

			if (!m) {
				return null;
			}

			m = Object.keys(m)[0] === 'ephemeralMessage' ? normalizeMessageContent(this.#raw) : m;
			this.#raw.message = m;
			/** @type {string | undefined} */
			let type = getContentType(m);

			if (type === 'extendedTextMessage' && m?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
				type = 'mentionText';
			}

			return type;
		});
	}
	get body() {
		return this.#memo('body', () => extractBody(this.#raw, this.type));
	}
	get args() {
		return this.#memo('args', () => this.body?.split(/ +/g) || []);
	}
	get cmd() {
		return this.#memo('cmd', () => {
			const raw = this.body?.toLowerCase()?.split(' ')[0] || '';

			return this.isCmd ? raw : '';
		});
	}
	get prefix() {
		return this.#memo('prefix', () => {
			const { default: prf, mode: prefixMode, regex: prefixReg } = configuration.prefix;
			const raw = this.body?.toLowerCase()?.split(' ')[0] || '';

			if (prefixMode === 'multi' && prefixReg) {
				return prefixReg.test(raw) ? raw.match(prefixReg)?.[0] : null;
			}

			if (prefixMode === 'nopref') {
				return '';
			}

			return prf;
		});
	}
	get isCmd() {
		return this.#memo('isCmd', () => {
			const prefixMode = configuration.prefix.mode;

			if (prefixMode === 'nopref') {
				return true;
			}

			return this.body != null && this.prefix != null && this.body.startsWith(this.prefix);
		});
	}
	get query() {
		return this.#memo('query', () => this.args?.slice(1)?.join(' ') || '');
	}
	get pushname() {
		return this.#memo('pushname', () => {
			const cached = configuration.users.info.get(this.sender);

			return (
				this.#raw?.pushName?.trim() ||
				cached?.name ||
				this.#store?.contacts?.[this.sender]?.verifiedName ||
				this.#store?.contacts?.[this.sender]?.notify ||
				this.prettyNumber
			);
		});
	}
	get prettyNumber() {
		return this.#memo('prettyNumber', () => {
			const cached = configuration.users.info.get(this.sender);

			return (
				cached?.prettyNumber || PhoneNumber(`+${this.sender?.replace(S_WHATSAPP_NET, '')}`)?.formatInternational() || 'No Data'
			);
		});
	}
	get isOwner() {
		return this.#memo('isOwner', () => configuration.owners?.includes(this.sender));
	}
	get isSuperOwner() {
		return this.#memo('isSuperOwner', () => toUserJid(configuration.settings?.owner_number) === this.sender);
	}
	get isBlocked() {
		return this.#memo('isBlocked', () => configuration.blocklist?.includes(this.sender));
	}
	get isBanned() {
		return this.#memo('isBanned', () => configuration.bannedlist?.includes(this.sender));
	}
	get settings() {
		return this.#memo('settings', () => configuration.settings);
	}
	get groupMetadata() {
		return this.#memo('groupMetadata', () => (this.isGroup ? configuration.groups.metadata.get(this.from) || {} : {}));
	}
	get groupName() {
		return this.#memo('groupName', () => (this.isGroup ? this.groupMetadata?.subject || 'No Data' : 'No Data'));
	}
	get groupId() {
		return this.#memo('groupId', () => (this.isGroup ? this.groupMetadata?.id || 'No Data' : 'No Data'));
	}
	get adminGroups() {
		return this.#memo('adminGroups', () => this.groupMetadata?.adminGroups || []);
	}
	get participantsGroup() {
		return this.#memo('participantsGroup', () => this.groupMetadata?.participantsGroup || []);
	}
	get isAdmin() {
		return this.#memo('isAdmin', () => this.adminGroups?.includes(this.sender));
	}

	get isBotAdmin() {
		return this.#memo('isBotAdmin', () => {
			const botJid = this.#client.user?.id;

			if (!botJid) {
				return false;
			}

			const botUser = botJid.split(':')[0];

			return this.adminGroups?.some((adminJid) => adminJid.split('@')[0] === botUser);
		});
	}

	get filename() {
		return this.#memo('filename', () => this.sender + (this.#raw?.key?.id || Date.now()));
	}
	get device() {
		return this.#memo('device', () => {
			const name = getDevice(this.#raw.key.id);
			const isIos = name === 'ios';
			const isAndroid = name === 'android';
			const isWeb = name === 'web';
			const isDesktop = name === 'desktop';

			return { name, isIos, isAndroid, isWeb, isDesktop };
		});
	}
	get isIos() {
		return this.#memo('isIos', () => this.device.isIos);
	}
	get isAndroid() {
		return this.#memo('isAndroid', () => this.device.isAndroid);
	}
	get isWeb() {
		return this.#memo('isWeb', () => this.device.isWeb);
	}
	get isDesktop() {
		return this.#memo('isDesktop', () => this.device.isDesktop);
	}
	get typeQuoted() {
		return this.#memo('typeQuoted', () => extractTypeQuoted(this.#raw));
	}
	get mention() {
		return this.#memo('mention', () => extractMentionedJid(this.#raw, this.type));
	}
	get bodyQuoted() {
		return this.#memo('bodyQuoted', () => {
			const m = this.#raw;
			const mMediaData =
				this.type === 'extendedTextMessage' ? renameQuotedMessage(m)?.message?.extendedTextMessage?.contextInfo : m;
			const quotedType =
				this.type === 'extendedTextMessage' && mMediaData ? firstKey(mMediaData.message || { CLIENT: 'm' }) : 'none';

			return typeMessage.includes(quotedType) ? extractQuotedBody(mMediaData, this.typeQuoted) : '';
		});
	}
	get mediaData() {
		return this.#memo('mediaData', () => {
			const m = this.#raw;
			const mMediaData =
				this.type === 'extendedTextMessage' ? renameQuotedMessage(m)?.message?.extendedTextMessage?.contextInfo : m;
			let data =
				this.type === 'extendedTextMessage' || this.type === 'mentionText'
					? this.typeQuoted === 'thumbnailMessage'
						? m
						: { ...mMediaData, ...lidMaps.get(mMediaData?.participant) }
					: m || {};

			data.extract = async () => {
				const messages = await this.#store.loadMessage(this.from, data.stanzaId);

				if (!messages) {
					return messages;
				}

				messages.parse = async () => Context.from(messages, this.#client, this.#store, this.#state);
				return messages;
			};
			return data;
		});
	}
	get extractMediaData() {
		return this.#memo('extractMediaData', () => extractMetadata(this.mediaData, this.type, this.typeQuoted));
	}
	get isMediaImage() {
		return this.#memo('isMediaImage', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';

			return (
				this.type === 'imageMessage' ||
				(this.type === 'extendedTextMessage' && !content.includes('viewOnceMessage') && content.includes('imageMessage'))
			);
		});
	}

	get isViewOnce() {
		return this.#memo('isViewOnce', () => {
			const inner = this.#raw?.message?.viewOnceMessage?.message || this.#raw?.message;
			const media = inner?.videoMessage || inner?.imageMessage || inner?.audioMessage;

			return !!media?.viewOnce;
		});
	}

	get viewOnceMedia() {
		return this.#memo('viewOnceMedia', () => {
			const inner = this.#raw?.message;

			if (!inner) {
				return null;
			}

			const isVideo = !!inner.videoMessage;

			return {
				isVideo,
				caption: inner.imageMessage?.caption || inner.videoMessage?.caption || inner.audioMessage?.caption || '',
				message: inner
			};
		});
	}
	get isMediaVid() {
		return this.#memo('isMediaVid', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';

			return (
				this.type === 'videoMessage' ||
				(this.type === 'extendedTextMessage' && !content.includes('viewOnceMessage') && content.includes('videoMessage'))
			);
		});
	}
	get isQuotedSticker() {
		return this.#memo('isQuotedSticker', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';

			return (
				this.type === 'extendedTextMessage' && (content.includes('stickerMessage') || content.includes('lottieStickerMessage'))
			);
		});
	}
	get isQuotedDocument() {
		return this.#memo('isQuotedDocument', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';

			return (
				this.type === 'extendedTextMessage' &&
				(content.includes('documentMessage') || content.includes('documentWithCaptionMessage'))
			);
		});
	}
	get isQuotedAudio() {
		return this.#memo('isQuotedAudio', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';

			return this.type === 'extendedTextMessage' && content.includes('audioMessage');
		});
	}
	get typeSticker() {
		return TYPE_STICKER;
	}
	get stickerAble() {
		return this.#memo('stickerAble', () => TYPE_STICKER.includes(this.typeQuoted) || TYPE_STICKER.includes(this.type));
	}
	get isMediaDocument() {
		return this.#memo('isMediaDocument', () => {
			const content = this.type === 'extendedTextMessage' ? JSON.stringify(this.#raw?.message) : '';
			const isQuotedDoc =
				this.type === 'extendedTextMessage' &&
				(content.includes('documentMessage') || content.includes('documentWithCaptionMessage'));

			return this.type === 'documentMessage' || this.type === 'documentWithCaptionMessage' || isQuotedDoc;
		});
	}
	get timeStamp() {
		return this.#memo('timeStamp', () => this.#raw?.messageTimestamp || Date.now());
	}
	get botNumber() {
		return this.#memo('botNumber', () => configuration.botJid);
	}
	get waitForInput() {
		return this.#memo('waitForInput', () => {
			const client = this.#client;
			const from = this.from;
			const sender = this.sender;

			return async (data) => {
				if (data.sendImpl) {
					await data.sendImpl();
				} else if (data.message) {
					await client.send(from, { text: data.message });
				}

				return new Promise((resolve) => {
					const timeoutMs = (data.timeInSecond || 10) * 1000;
					const timer = setTimeout(() => {
						configuration.input.delete(sender);
						resolve({ timeout: true });
					}, timeoutMs);

					configuration.input.set(sender, {
						expectedType: data.expectedType,
						resolve(result) {
							clearTimeout(timer);
							configuration.input.delete(sender);
							resolve(result);
						}
					});
				});
			};
		});
	}
	set chainHistory(value) {
		this._chainHistory = value;
	}
	get chainHistory() {
		return this._chainHistory || null;
	}
	#isLikelyCommand(body) {
		if (!body || typeof body !== 'string') {
			return false;
		}

		const { mode, regex, default: prf } = configuration.prefix;

		if (mode === 'nopref') {
			return true;
		}

		if (mode === 'multi' && regex) {
			return regex.test(body);
		}

		return body.startsWith(prf);
	}

	#ensureUserCache() {
		const sender = this.sender;

		if (configuration.users.info.has(sender)) {
			return;
		}

		const prettyNumber = PhoneNumber(`+${sender?.replace(S_WHATSAPP_NET, '')}`)?.formatInternational() || 'No Data';

		configuration.users.info.set(sender, {
			prettyNumber,
			name: this.#raw.pushName,
			ephemeralDuration: this.isGroup
				? this.#store?.messages?.[sender]?.array?.length
					? crawlProperty(this.#store.messages[sender].array[0].message, 'expiration')
					: 0
				: crawlProperty(this.#raw.message, 'expiration')
		});
	}
	async #ensureGroupSettings(metadataPromise) {
		const from = this.from;
		const m = this.#raw;

		if (!configuration.groups.settings.has(from)) {
			let entry = await checkJSON(from);

			if (typeof entry === 'boolean') {
				if (metadataPromise) {
					await metadataPromise;
				}

				await pushDefaultSettings(from, this.groupName, this.groupMetadata?.desc?.toString() || '');
				entry = await checkJSON(from);
			}

			if (entry) {
				configuration.groups.settings.set(from, entry);
			}
		} else if ('GROUP_CHANGE_SUBJECT' === m.messageStubType) {
			await updateSettings('groupName', m.messageStubParameters[0], from);
		} else if ('GROUP_CHANGE_DESCRIPTION' === m.messageStubType) {
			await updateSettings('groupDescription', m.messageStubParameters?.[0] || '', from);
		}
	}
	#earlyReturn() {
		return {
			message: this.#raw,
			settings: this.settings,
			isFromMe: this.isFromMe,
			from: this.from,
			isGroup: this.isGroup,
			...configuration.groups.settings.get(this.from),
			isBotInstance: this.isBotInstance,
			sender: this.sender,
			isBlocked: this.isBlocked,
			prettyNumber: this.prettyNumber,
			groupName: this.groupName,
			groupId: this.groupId,
			pushname: this.pushname,
			botNumber: this.botNumber,
			isOwner: this.isOwner,
			isSuperOwner: this.isSuperOwner,
			timeStamp: this.timeStamp,
			filename: this.filename,
			groupMetadata: this.groupMetadata,
			device: this.device
		};
	}
	#memo(key, compute) {
		if (!(key in this.#cache)) {
			this.#cache[key] = compute();
		}

		return this.#cache[key];
	}
}
