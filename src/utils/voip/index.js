/**
 * WhatsApp voice calling via the WASM VoIP stack.
 *
 * Reuses an existing Baileys socket — no separate session needed:
 *
 *   const voip = new VoipClient({ sock: client.socket })
 *   await voip.init()
 *   const call = await voip.call("12345678901", { audioSource: "./hi.mp3" })
 *   const call = await voip.call("12345678901", { audioSource: audioBuffer })
 *
 */
import { EventEmitter } from 'node:events';
import { randomBytes, createHmac } from 'node:crypto';

import { WasmEngine } from './wasm-engine.js';
import { SignalingBridge } from './bridge.js';
import { RelayTransport } from './relay.js';
import { AudioFeeder } from './audio-feeder.js';
import { CallState } from './call-states.js';
import { execFileSync } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export { CallState } from './call-states.js';

const SHA256_LEN = 32;

const toBareJid = (jid) => {
	if (!jid) {
		return jid;
	}

	const at = jid.indexOf('@');

	if (at < 0) {
		return jid;
	}

	const user = jid.slice(0, at).split(':')[0];

	return `${user}@${jid.slice(at + 1)}`;
};

const computeHkdf = (key, salt, info, length) => {
	const effectiveSalt = salt && salt.length > 0 ? Buffer.from(salt) : Buffer.alloc(SHA256_LEN, 0);
	const prk = createHmac('sha256', effectiveSalt).update(key).digest();
	const blocks = Math.ceil(length / SHA256_LEN);
	const okm = Buffer.alloc(blocks * SHA256_LEN);
	let prev = Buffer.alloc(0);

	for (let i = 1; i <= blocks; i += 1) {
		prev = createHmac('sha256', prk)
			.update(prev)
			.update(info)
			.update(Buffer.from([i]))
			.digest();
		prev.copy(okm, (i - 1) * SHA256_LEN);
	}

	return new Uint8Array(okm.buffer, okm.byteOffset, length);
};

const computeHmacSha256 = (data, key) => {
	const result = createHmac('sha256', Buffer.from(key)).update(data).digest();

	return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};

/**
 * Probe audio duration in milliseconds using ffprobe.
 * @param {string | Buffer} source - File path or audio buffer.
 * @returns {Promise<number>} Duration in ms, or 0 on failure.
 */
const probeAudioDuration = async (source) => {
	const isBuffer = Buffer.isBuffer(source);
	let tmpFile = null;

	try {
		if (isBuffer) {
			tmpFile = join(tmpdir(), `voip-probe-${Date.now()}.tmp`);
			await writeFile(tmpFile, source);
		}

		const input = isBuffer ? tmpFile : source;
		const output = execFileSync(
			'ffprobe',
			['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', input],
			{ timeout: 10_000, encoding: 'utf8' }
		);

		const seconds = Number(output.trim());

		return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
	} catch {
		return 0;
	} finally {
		if (tmpFile) {
			await unlink(tmpFile).catch(() => {});
		}
	}
};

const isCallReceiptNode = (node) => {
	if (node?.tag !== 'receipt') {
		return false;
	}

	const child = Array.isArray(node.content) ? node.content[0] : null;

	return !!(child?.attrs?.['call-id'] || child?.attrs?.call_id);
};

/** A live or recently-ended call. */
export class ActiveCall extends EventEmitter {
	#state = CallState.Idle;
	#endResolver;
	#endPromise;
	#endTimer = null;
	#ended = false;
	#heartbeatTimer = null;

	/** @type {string} mirrors the source path for the audio feeder */
	_audioSource = 'silence';

	/** @type {object | null} video frame routing config */
	_videoConfig = null;

	/** @type {string | null} call creator JID for group/link heartbeat */
	_callCreator = null;

	/** @type {import('./audio-feeder.js').AudioFeeder | null} */
	_feeder = null;

	/** @type {boolean} */
	_audioPaused = false;

	/**
	 * @param {string} callId
	 * @param {WasmEngine} engine
	 * @param {number} durationMs
	 */
	constructor(callId, engine, durationMs) {
		super();
		this.callId = callId;
		this.engine = engine;
		this.#endPromise = new Promise((res) => {
			this.#endResolver = res;
		});

		if (durationMs > 0) {
			this.#endTimer = setTimeout(() => this.end(), durationMs);
		}
	}

	get state() {
		return this.#state;
	}

	end = () => {
		if (this.#ended) {
			return;
		}

		if (this.#endTimer) {
			clearTimeout(this.#endTimer);
			this.#endTimer = null;
		}

		try {
			this.engine.endCall(0, true);
		} catch {
			/* WASM stack may already be torn down */
		}

		this._forceEnd('ended');
	};

	mute = (muted) => {
		try {
			this.engine.setMute(muted);
		} catch {
			/* mute state unknown */
		}
	};

	pauseAudio = () => {
		this._audioPaused = true;

		if (this._feeder) {
			this._feeder.pause();
		}
	};

	resumeAudio = () => {
		this._audioPaused = false;

		if (this._feeder) {
			this._feeder.resume();
		}
	};

	setAudioSource = (source) => {
		this._audioSource = source;

		if (this._feeder) {
			this._feeder.setSource(source);
		}
	};

	removeAudio = () => {
		this._audioSource = 'silence';

		if (this._feeder) {
			this._feeder.setSource('silence');
		}
	};

	waitForEnd = () => this.#endPromise;

	/** @internal — called by VoipClient on WASM call-state change */
	_updateState = (state) => {
		this.#state = state;

		if (state === CallState.PreacceptReceived) {
			this.emit('ringing');
		} else if (state === CallState.Active) {
			this.emit('connected');
			this.#maybeStartHeartbeat();
		} else if (state === CallState.Idle || state === CallState.Ending) {
			this._forceEnd('ended');
		}
	};

	/** @internal */
	_emitAudio = (pcm) => {
		this.emit('audio', pcm);
	};

	/** @internal */
	_emitVideoFrame = (frame) => {
		if (this._videoConfig) {
			this.emit('video-frame', frame);
		}
	};

	/** @internal — stores VoipClient reference for heartbeat */
	_setGroupContext = (callCreator, voipClient) => {
		this._callCreator = callCreator;
		this._voipClient = voipClient;
	};

	/** @internal — start heartbeat immediately (for link calls that skip state 2) */
	_startHeartbeat = () => {
		this.#maybeStartHeartbeat();
	};

	/** @internal */
	_forceEnd = (reason) => {
		if (this.#ended) {
			return;
		}

		this.#ended = true;

		if (this.#endTimer) {
			clearTimeout(this.#endTimer);
			this.#endTimer = null;
		}

		if (this.#heartbeatTimer) {
			clearInterval(this.#heartbeatTimer);
			this.#heartbeatTimer = null;
		}

		try {
			this.engine.endCall(0, true);
		} catch {
			/* WASM stack may already be torn down */
		}

		this.emit('ended', reason);
		this.#endResolver(reason);
	};

	#maybeStartHeartbeat = () => {
		if (this.#heartbeatTimer || !this._callCreator || !this._voipClient?.sendHeartbeat) {
			return;
		}

		const tick = () => {
			try {
				const info = this.engine.getCallInfo();
				const realCallId = info?.call_id ?? info?.callId ?? this.callId;

				if (!realCallId || realCallId === '00000000000000000000000000000000') {
					return;
				}

				const realCreator = info?.call_creator_jid ?? info?.callCreatorJid ?? this._callCreator;

				this._voipClient.sendHeartbeat(realCallId, realCreator);
			} catch (err) {
				if (this.listenerCount('error') > 0) {
					this.emit('error', err);
				}
			}
		};

		tick();
		this.#heartbeatTimer = setInterval(tick, 10_000);
	};
}

/** Voice calling via the WASM VoIP stack. Reuses an existing Baileys socket. */
export class VoipClient {
	#sock;
	#engine = null;
	#relay = null;
	#signaling = null;
	#activeCall = null;
	#initialized = false;
	#seenIncomingIds = new Set();
	#ownsSocket = false;

	#audioPtr = 0;
	#audioChunkBytes = 0;
	#audioSampleRate = 16000;
	#audioChannels = 1;
	#audioFramesPerChunk = 320;
	#feeder = null;

	/**
	 * @param {{ sock: import('baileys').Socket }} config
	 */
	constructor(config) {
		if (!config?.sock) {
			throw new TypeError('VoipClient: sock is required');
		}

		this.#sock = config.sock;
	}

	get engine() {
		return this.#engine;
	}
	get activeCall() {
		return this.#activeCall;
	}

	/** Initialize the WASM VoIP stack. Safe to call multiple times — only the first call does work. */
	init = async () => {
		if (this.#initialized) {
			return;
		}

		this.#signaling = new SignalingBridge({ sock: this.#sock });
		await this.#signaling.init();

		this.#relay = new RelayTransport({
			onTransportMessage: (data, ip, port) => this.#engine?.handleOnTransportMessage(data, ip, port),
			onIceRtt: (rttMs, ip, port) => this.#engine?.updateIceRtt(rttMs, ip, port)
		});

		this.#engine = new WasmEngine({
			callbacks: {
				onSignalingXmpp: (peerJid, callId, xmlPayload) => {
					return this.#signaling.sendSignaling(peerJid, callId, xmlPayload);
				},
				onCallEvent: (eventType, eventData) => this.#handleCallEvent(eventType, eventData),
				sendDataToRelay: (data, ip, port) => this.#relay.send(data, ip, port),
				onAudioCaptureInit: (config) => {
					return this.#initAudioCapture(config);
				},
				onAudioCaptureStart: () => {
					return this.#startAudioCapture();
				},
				onAudioCaptureStop: () => {
					return this.#stopAudioCapture();
				},
				onAudioPlaybackData: (audioData) => this.#activeCall?._emitAudio(audioData),
				cryptoHkdf: computeHkdf,
				hmacSha256: computeHmacSha256
			}
		});

		await this.#engine.initialize();
		this.#signaling.attachEngine(this.#engine);

		const selfPnJid = this.#sock.authState.creds.me?.id;
		const selfLidJid = this.#sock.authState.creds.me?.lid;

		this.#engine.initVoipStack(selfPnJid, toBareJid(selfPnJid), selfLidJid);
		await this.#engine.waitForVoipStackReady();
		try {
			this.#engine.updateNetworkMedium(2, 0);
		} catch {
			/* non-critical */
		}

		this.#hookWsListeners();
		this.#wireIncomingCallListener();
		this.#sock.ev.on('connection.update', (update) => {
			if (update.connection === 'open') {
				this.#hookWsListeners();
			}
		});

		this.#initialized = true;
	};

	#hookWsListeners = () => {
		this.#sock.ws?.removeAllListeners('CB:call');
		this.#sock.ws?.removeAllListeners('CB:receipt');

		this.#sock.ws.on('CB:call', (node) => {
			this.#signaling?.processIncomingCall(node, this.#engine, this.#activeCall?.callId ?? '');
		});
		this.#sock.ws.on('CB:receipt', (node) => {
			if (!isCallReceiptNode(node)) {
				return;
			}

			this.#signaling?.processIncomingReceipt(node, this.#engine, this.#activeCall?.callId ?? '');
		});
	};

	#attachCallLifecycle = (call, incomingId) => {
		call.once('ended', (reason) => {
			if (this.#activeCall === call) {
				this.#stopAudioCapture();
				this.#activeCall = null;
			}

			if (incomingId) {
				this.#seenIncomingIds.delete(incomingId);
			}
		});
	};

	/** Place an outbound voice call. */
	call = async (phoneNumber, opts = {}) => {
		if (!this.#engine || !this.#signaling) {
			throw new Error('Not initialized. Call init() first.');
		}

		if (this.#activeCall) {
			throw new Error('A call is already active.');
		}

		const targetNumber = phoneNumber.replace(/\D/g, '');
		const targetPnJid = `${targetNumber}@s.whatsapp.net`;
		const audioSource = opts.audioSource ?? 'silence';

		let durationMs = opts.durationMs;

		if (!durationMs && audioSource !== 'silence') {
			const detected = await probeAudioDuration(audioSource);

			if (detected > 0) {
				durationMs = detected;
			}
		}

		durationMs = durationMs ?? 120_000;

		const peerLid = await this.#signaling.resolveLid(targetPnJid);

		if (!peerLid) {
			throw new Error(`Could not resolve LID for ${targetPnJid}`);
		}

		for (const jid of [targetPnJid, peerLid]) {
			try {
				await this.#sock.presenceSubscribe(jid);
			} catch {
				/* best-effort */
			}
		}

		await new Promise((r) => setTimeout(r, 750));

		const peerDeviceJids = await this.#signaling.discoverPeerDevices(peerLid);
		const deviceList = peerDeviceJids.length ? peerDeviceJids : [toBareJid(peerLid)];

		await this.#signaling.ensureSessionsForPeers(deviceList);

		await new Promise((r) => setTimeout(r, 500));
		await this.#signaling.issueTcToken(peerLid);
		const tcToken = await this.#signaling.ensureTcToken(peerLid, targetPnJid);

		const callId = ('00' + randomBytes(16).toString('hex').slice(2)).toUpperCase();

		const call = new ActiveCall(callId, this.#engine, durationMs);

		call._audioSource = audioSource;
		call._videoConfig = opts.video ?? null;

		this.#attachCallLifecycle(call);

		this.#activeCall = call;

		this.#engine.startCall({
			peerJid: peerLid,
			peerPn: targetPnJid,
			peerList: deviceList,
			callId,
			isVideo: !!opts.video,
			isLidCall: true,
			isFromDialer: false,
			extraData: tcToken
		});

		return call;
	};

	/**
	 * Place a group call to multiple participants.
	 * @param {string[]} participants - Phone numbers or JIDs.
	 * @param {object} [opts]
	 * @param {string} [opts.groupJid] - WhatsApp group JID (xxx@g.us).
	 * @param {string} [opts.chatName] - Group display name.
	 * @returns {Promise<ActiveCall>}
	 */
	groupCall = async (participants, opts = {}) => {
		if (!this.#engine || !this.#signaling) {
			throw new Error('Not initialized. Call init() first.');
		}

		if (this.#activeCall) {
			throw new Error('A call is already active.');
		}

		if (!participants?.length) {
			throw new Error('At least one participant is required.');
		}

		const me = this.#sock.authState.creds.me;
		const selfJid = me?.lid || me?.id;

		const resolved = [];

		for (const p of participants) {
			let peerLid;

			if (p?.includes('@lid')) {
				resolved.push(p);

				continue;
			}

			if (p?.includes('@s.whatsapp.net')) {
				peerLid = await this.#signaling.resolveLid(p);
			} else {
				const bare = p.replace(/\D/g, '');

				peerLid = await this.#signaling.resolveLid(`${bare}@s.whatsapp.net`);
			}

			if (!peerLid) {
				throw new Error(`Could not resolve LID for ${p}`);
			}

			resolved.push(peerLid);
		}

		const audioSource = opts.audioSource ?? 'silence';

		let durationMs = opts.durationMs;

		if (!durationMs && audioSource !== 'silence') {
			const detected = await probeAudioDuration(audioSource);

			if (detected > 0) {
				durationMs = detected;
			}
		}

		durationMs = durationMs ?? 120_000;

		const callId = ('00' + randomBytes(16).toString('hex').slice(2)).toUpperCase();

		const call = new ActiveCall(callId, this.#engine, durationMs);

		call._audioSource = audioSource;
		call._videoConfig = opts.video ?? null;
		call._setGroupContext(selfJid, this.#sock);

		this.#attachCallLifecycle(call);

		this.#activeCall = call;

		try {
			this.#engine.startGroupCall({
				callId,
				participants: resolved,
				isVideo: !!opts.video,
				groupJid: opts.groupJid ?? '',
				chatName: opts.chatName ?? '',
				isLightWeight: false,
				scheduleId: '',
				chatIcon: '',
				callFromUI: 0,
				lobbyEntryType: 0,
				username: '',
				linkToken: opts.linkToken ?? '',
				extraData: undefined
			});
		} catch (err) {
			this.#activeCall = null;

			throw err;
		}

		return call;
	};

	/**
	 * Create a call link.
	 * @param {'voice' | 'video'} [media]
	 * @returns {Promise<string>} Call link token.
	 */
	createLink = async (media = 'voice') => {
		if (!this.#sock.createCallLink) {
			throw new Error('createCallLink is not supported by this socket.');
		}

		return this.#sock.createCallLink(media === 'video' ? 'video' : 'audio');
	};

	/**
	 * Query a call link.
	 * @param {string} token
	 * @param {'voice' | 'video'} [media]
	 * @returns {Promise<object>}
	 */
	queryLink = async (token, media = 'voice') => {
		if (!this.#sock.queryCallLink) {
			throw new Error('queryCallLink is not supported by this socket.');
		}

		return this.#sock.queryCallLink(token, media);
	};

	/**
	 * Join a call link.
	 * @param {string} token - Call link token.
	 * @param {object} [opts]
	 * @param {boolean} [opts.video] - Join as video call.
	 * @param {number} [opts.durationMs] - Max call duration in ms.
	 * @param {string} [opts.audioSource] - Audio source path/buffer.
	 * @returns {Promise<ActiveCall>}
	 */
	joinLink = async (token, opts = {}) => {
		if (!this.#engine || !this.#signaling) {
			throw new Error('Not initialized. Call init() first.');
		}

		if (this.#activeCall) {
			throw new Error('A call is already active.');
		}

		const me = this.#sock.authState.creds.me;
		const selfJid = me?.lid || me?.id;

		const audioSource = opts.audioSource ?? './output.mp3';

		let durationMs = opts.durationMs;

		if (!durationMs && durationMs !== 0) {
			const detected = await probeAudioDuration(audioSource);

			if (detected > 0) {
				durationMs = detected;
			}
		}

		durationMs = durationMs ?? 0;

		const callId = ('00' + randomBytes(16).toString('hex').slice(2)).toUpperCase();

		const call = new ActiveCall(callId, this.#engine, durationMs);

		call._audioSource = audioSource;
		call._videoConfig = opts.video ?? null;

		this.#attachCallLifecycle(call);
		this.#activeCall = call;

		call._setGroupContext(selfJid, this);

		try {
			this.#engine.previewAndJoinCallLink(token, !!opts.video, 0, '');
		} catch (err) {
			this.#activeCall = null;
			throw err;
		}

		call._startHeartbeat();

		return call;
	};

	/**
	 * Send a heartbeat for a group/link call.
	 * @param {string} callId
	 * @param {string} callCreator
	 * @returns {Promise<void>}
	 */
	sendHeartbeat = async (callId, callCreator) => {
		const stanza = {
			tag: 'call',
			attrs: {
				to: `${callId}@call`,
				id: `hb-${Date.now()}`
			},
			content: [
				{
					tag: 'heartbeat',
					attrs: {
						'call-id': callId,
						'call-creator': callCreator
					},
					content: undefined
				}
			]
		};

		try {
			await this.#sock.query(stanza);
		} catch {
			/* best-effort */
		}
	};

	/** Tear down VoIP components. Does NOT close the shared socket. */
	disconnect = () => {
		this.#activeCall?._forceEnd('disconnect');
		this.#activeCall = null;
		this.#relay?.closeAll();
		this.#engine?.destroy();
		this.#stopAudioCapture();
		this.#engine = null;
		this.#relay = null;
		this.#signaling = null;
	};

	// ─── private ──────────────────────────────────────────────────────────────

	#handleCallEvent = (eventType, eventData) => {
		if (eventType === 16 && eventData) {
			try {
				const parsed = JSON.parse(eventData);
				const info = parsed.call_info ?? parsed.callInfo ?? {};
				const callState = Number(info.call_state ?? info.callState ?? 0);

				this.#activeCall?._updateState(callState);
			} catch {
				/* malformed event data */
			}
		} else if (eventType === 156 && eventData) {
			try {
				const update = JSON.parse(eventData);

				this.#relay?.updateRelayList(update);
			} catch {
				/* malformed relay update */
			}
		} else if (eventType === 10 || eventType === 11) {
			this.#activeCall?._forceEnd('remote_end');
		}
	};

	#wireIncomingCallListener = () => {
		this.#sock.ev.on('call', (calls) => {
			if (!calls?.length) {
				return;
			}

			for (const raw of calls) {
				if (!raw.id) {
					continue;
				}

				if (raw.status === 'reject' || raw.status === 'ended') {
					if (this.#activeCall?.callId === raw.id) {
						this.#activeCall._forceEnd(raw.status === 'reject' ? 'rejected' : 'remote_end');
					}

					continue;
				}

				if (raw.status !== 'offer') {
					continue;
				}

				if (this.#seenIncomingIds.has(raw.id)) {
					continue;
				}

				this.#seenIncomingIds.add(raw.id);

				const handle = this.#makeIncomingHandle(raw);

				this.emit('incoming', handle);
			}
		});
	};

	#makeIncomingHandle = (raw) => {
		const callId = raw.id;
		const from = raw.from;
		const fromPn = raw.from;
		const isVideo = !!raw.isVideo;
		const isGroup = !!raw.isGroup;
		const arrivedAt = Date.now();

		return {
			callId,
			from,
			fromPn,
			isVideo,
			isGroup,
			arrivedAt,
			accept: async (acceptOpts = {}) => {
				if (this.#sock.preacceptCall) {
					await this.#sock.preacceptCall(callId, from);
				}

				await this.#sock.acceptCall(acceptOpts.isMicEnabled ?? true, acceptOpts.isCameraEnabled ?? !!isVideo);

				const call = new ActiveCall(callId, this.#engine, acceptOpts.durationMs ?? 120_000);

				call._audioSource = acceptOpts.audioSource ?? 'silence';
				call._videoConfig = isVideo ? (acceptOpts.video ?? true) : null;

				this.#attachCallLifecycle(call, callId);

				this.#activeCall = call;

				return call;
			},
			reject: async (reason) => {
				if (this.#sock.rejectCall) {
					await this.#sock.rejectCall(callId, from, reason);
				}

				this.#seenIncomingIds.delete(callId);
			}
		};
	};

	#initAudioCapture = (config) => {
		if (!this.#engine) {
			return;
		}

		if (this.#audioPtr) {
			return;
		}

		this.#audioSampleRate = config.sampleRate || 16000;
		this.#audioChannels = config.channels || 1;
		this.#audioFramesPerChunk = config.framesPerChunk || 320;
		const chunkSamples = this.#audioFramesPerChunk * this.#audioChannels;

		this.#audioChunkBytes = chunkSamples * Float32Array.BYTES_PER_ELEMENT;
		this.#audioPtr = this.#engine.malloc(this.#audioChunkBytes);
	};

	#startAudioCapture = () => {
		if (!this.#engine || !this.#audioPtr) {
			return;
		}

		const audioSource = this.#activeCall?._audioSource ?? 'silence';

		this.#feeder = new AudioFeeder(
			this.#audioSampleRate,
			this.#audioChannels,
			this.#audioFramesPerChunk,
			(chunk) => {
				if (this.#engine && this.#audioPtr) {
					this.#engine.sendAudioData(chunk, this.#audioPtr);
				}
			},
			audioSource
		);

		if (this.#activeCall) {
			this.#activeCall._feeder = this.#feeder;
		}

		this.#feeder.start();

		if (this.#activeCall?._audioPaused) {
			this.#feeder.pause();
		}
	};

	#stopAudioCapture = () => {
		this.#feeder?.stop();
		this.#feeder = null;

		if (this.#engine && this.#audioPtr) {
			try {
				this.#engine.free(this.#audioPtr);
			} catch {
				/* already freed */
			}
			this.#audioPtr = 0;
		}
	};
}
