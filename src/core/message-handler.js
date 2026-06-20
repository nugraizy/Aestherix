import { BOT_NAME } from './constants.js';

import readline from 'readline';
import { findBestMatch } from 'string-similarity';

import { autoReplyManager } from '../helper/auto-reply.js';
import configuration from '../helper/config/connect.js';
import { Limit, checkAfk, deleteAfk, getAfk } from '../helper/index.js';
import { Cache } from '../helper/modules/cache.js';
import { getLocale, useLocale } from '../helper/i18n/index.js';
import { cmdId, setPrefix } from '../helper/modules/prefix.js';
import { slowModeManager } from '../helper/slowmode.js';
import { color, getTimeSince } from '../utils/modules/index.js';
import { Context } from './context.js';
import { Logger } from './logger.js';
import { getAutomodRules, getCustomAliases } from '../helper/groups/settings/group-settings.js';
import { PipelineExecutor } from './pipeline.js';
import { RetryManager } from './retry-manager.js';

const EVALY = ['/>', '$>', '=>', '!>'];
const SEPARATOR = color('→', 'green');
const HEAVY_CATEGORIES = new Set(['Downloader', 'Converter', 'Search', 'AI', 'Anime']);
const EXECUTION_LOCK_TTL = 60000;
const profileLogger = new Logger({ name: 'PROFILE' });

const noop = () => {};

let stdoutWriteCounter = 0;
let stdoutWriteTrackingInitialized = false;

function ensureStdoutWriteTracking() {
	if (stdoutWriteTrackingInitialized) {
		return;
	}

	const originalWrite = process.stdout.write.bind(process.stdout);

	process.stdout.write = (chunk, ...rest) => {
		stdoutWriteCounter++;
		return originalWrite(chunk, ...rest);
	};

	stdoutWriteTrackingInitialized = true;
}

const HANDLER_PATH = {
	STUBTYPE: './handlers/stub.js',
	STORY: './handlers/story.js',
	OFFLINE: './handlers/offline.js',
	TEBAKGAMBAR: './handlers/games/tebak-gambar.js',
	SAMBUNGKATA: './handlers/games/sambung-kata.js',
	WORDLE: './handlers/games/wordle.js',
	ANONYMOUS: './handlers/anonymous.js',
	GROUPURL: './handlers/group-url.js',
	ANTINSFW: './handlers/anti-nsfw.js',
	AI: './handlers/character-ai.js'
};

export class MessageHandler {
	#client;
	#router;
	#store;
	#configuration;
	#flags;
	#handlers = new Cache();
	#retries = new Map();
	#executionLocks = new Map();
	#retryManager = new RetryManager();
	#automodCounters = new Map();
	#replyChains = new Cache({ maxAge: 300_000, limit: 500 });
	#lastLog = {
		kind: null,
		sender: null,
		from: null,
		command: null,
		signature: null,
		marker: null,
		count: 0
	};
	#initialized = false;
	#statsOffline = true;

	constructor(client, { router, store, configuration: config, options = {} }) {
		this.#client = client;
		this.#router = router;
		this.#store = store;
		this.#configuration = config ?? configuration;
		this.#flags = options.flags ?? {};
		ensureStdoutWriteTracking();

		const cleanupTimer = setInterval(() => this.#sweepStaleEntries(), 120_000);

		cleanupTimer.unref();
	}

	get router() {
		return this.#router;
	}

	get #log() {
		return this.#client.logger;
	}

	async handle(upsert) {
		for (let message of upsert.messages) {
			await this.#processMessage(message);
		}
	}

	async preInit() {
		if (this.#initialized) {
			return;
		}

		await Promise.all([this.#initHandlers(), this.#retryManager.load()]);
		this.#initialized = true;
	}

	async #processMessage(message) {
		const profileEnabled = Boolean(this.#flags.profile);
		const profileStart = profileEnabled ? performance.now() : 0;
		let tContextFrom = 0;
		let tDispatch = 0;

		if (message.key.fromMe && message.status === 0) {
			this.#retryRelay(message);
		}

		if (!message || message?.messageStubParameters?.[0] === 'No SenderKeyRecord found for decryption') {
			return;
		}

		if (!this.#initialized) {
			await this.#initHandlers();
			this.#initialized = true;
		}

		if (this.#flags.debugMode && !message?.key?.fromMe) {
			console.log(JSON.stringify(message, undefined, 2));
		}

		if (this.#isStubMessage(message)) {
			return this.#handleStub(message);
		}

		const client = this.#client;
		const state = this.#configuration.flags?.state;

		const ctxStart = profileEnabled ? performance.now() : 0;

		message = await Context.from(message, client, this.#store, state);

		if (profileEnabled) {
			tContextFrom = performance.now() - ctxStart;
		}

		if (!this.#isValidMessage(message)) {
			return;
		}

		if (message.message.key?.remoteJid === 'status@broadcast' && this.#flags.story) {
			const storyHandler = this.#handlers.get('STORY');

			if (storyHandler) {
				return storyHandler(client, message);
			}

			return;
		}

		if (this.#flags.offline) {
			return this.#handleOffline(client, message);
		}

		if (this.#flags.autoRead && !message.isBlocked && !message.isBanned) {
			this.#client.readMessages([message.message.key]);
		}

		if (message.isViewOnce && message.viewOnceMedia) {
			if (!message.isGroup || (await this.#shouldAutoDecryptViewOnce(message.from))) {
				this.#autoDecryptViewOnce(message, client);
			}
		}

		if (message.isGroup) {
			this.#handleAfk(client, message);
		}

		if (this.#resolveInputState(message)) {
			return;
		}

		if (message.isGroup && !message.isCmd) {
			const slowCheck = slowModeManager.check(message.from, message.sender, message.isAdmin);

			if (!slowCheck.allowed) {
				await client.reply(message.from, `⏳ Slow mode active. Please wait ${slowCheck.remaining} seconds.`, message);
				return;
			}
		}

		if (message.isGroup && !message.isCmd) {
			await this.#checkAutomod(message, client);
		}

		if (!message.isCmd && message.body) {
			const autoReplies = autoReplyManager.check(message.from, message.body);

			for (const reply of autoReplies) {
				await client.reply(message.from, reply.response, message);
			}
		}

		const dispatchStart = profileEnabled ? performance.now() : 0;

		await this.#dispatch(message, client);

		if (profileEnabled) {
			tDispatch = performance.now() - dispatchStart;
			const total = performance.now() - profileStart;

			profileLogger.info(
				color('cmd', 'lilac'),
				color(message.isCmd ? `${message.prefix || ''}${message.cmd || ''}` : '(non-cmd)', 'powderBlue'),
				color('total', 'white'),
				color(`${total.toFixed(1)}ms`, '#F1FA8C'),
				color('ctx', 'white'),
				color(`${tContextFrom.toFixed(1)}ms`, '#F1FA8C'),
				color('dispatch', 'white'),
				color(`${tDispatch.toFixed(1)}ms`, '#F1FA8C')
			);
		}
	}

	async #dispatch(message, client) {
		const useMultiCmd = Boolean(this.#flags.multiCmd);
		const hasSeparator = useMultiCmd && !EVALY.includes(message.cmd) && message.body.includes('&&');
		const bodies = hasSeparator ? message.body.split('&&') : [message.body];

		for (const body of bodies) {
			const trimmed = body.trim();

			if (this.#flags.pipe && !EVALY.includes(message.cmd) && /\s+\|\s+/.test(trimmed)) {
				await this.#dispatchPipeline(message, trimmed, client);
				continue;
			}

			await this.#dispatchSingle(message, trimmed, client);
		}
	}

	async #dispatchPipeline(message, body, client) {
		const stages = body
			.split(/\s+\|\s+/)
			.map((s) => s.trim())
			.filter(Boolean);

		if (stages.length < 2) {
			await this.#dispatchSingle(message, body, client);
			return;
		}

		const pipeline = new PipelineExecutor(client, message, this.#router, {
			guard: (ctx, command, cl) => this.#guard(ctx, command, cl),
			run: (ctx, command, cl) => this.#run(ctx, command, cl),
			log: (ctx) => !this.#flags.silent && this.#logMessage(ctx)
		});

		await pipeline.execute(stages);
	}

	async #dispatchSingle(message, body, client) {
		if (
			body.startsWith('dashauth:') &&
			message.isOwner &&
			(message.type === 'buttonsResponseMessage' || message.type === 'interactiveResponseMessage')
		) {
			const { processDashboardConfirmationAction } = await import('../../dashboard/server/socket/confirmation.js');
			const result = await processDashboardConfirmationAction({ actionId: body, senderJid: message.sender });

			if (result.handled) {
				const reply = result.approved
					? 'Dashboard login confirmed. You can return to the browser now.'
					: result.message || 'Dashboard login rejected.';

				await client.reply(message.from, reply, message.raw);
			}

			return;
		}

		if (body.startsWith('enable:')) {
			const cmdName = body.slice(7);

			if (!this.#retryManager.isDisabled(cmdName)) {
				return;
			}

			this.#retryManager.reEnable(cmdName);
			await client.reply(message.from, `Command \`${cmdName}\` has been re-enabled.`, message.raw);
			return;
		}

		const retryMatch = body.match(/^(.+?) retry:([a-f0-9]{8})$/);

		if (retryMatch) {
			const [, strippedBody, retryId] = retryMatch;
			const cached = this.#retryManager.getMedia(retryId);

			if (cached) {
				const resolved = this.#router.resolve(strippedBody);

				if (resolved?.command) {
					const localMessage = message.derive({
						body: strippedBody,
						args: resolved.args,
						cmd: resolved.cmdName,
						prefix: resolved.prefix,
						isEval: resolved.isEval,
						isCmd: true,
						query: resolved.query,
						isMediaImage: cached.mediaType === 'imageMessage',
						isMediaVid: cached.mediaType === 'videoMessage',
						isQuotedSticker: cached.mediaType === 'stickerMessage' || cached.mediaType === 'lottieStickerMessage',
						isQuotedAudio: cached.mediaType === 'audioMessage',
						isMediaDocument: cached.mediaType === 'documentMessage',
						typeQuoted: cached.typeQuoted,
						mediaData: { message: { [cached.mediaType]: cached.buffer } },
						extractMediaData: cached.buffer
					});

					setPrefix(resolved.prefix);

					const guardResult = await this.#guard(localMessage, resolved.command, client);

					if (guardResult === 'skip') {
						return;
					}

					const retryClient = this.#wrapRetryClient(client, cached.buffer);

					await this.#run(localMessage, resolved.command, retryClient);
					return;
				}
			}

			const resolved = this.#router.resolve(strippedBody);

			if (resolved) {
				const localMessage = message.derive({
					body: strippedBody,
					args: resolved.args,
					cmd: resolved.cmdName,
					prefix: resolved.prefix,
					isEval: resolved.isEval,
					isCmd: true,
					query: resolved.query
				});

				setPrefix(resolved.prefix);

				const guardResult = await this.#guard(localMessage, resolved.command, client);

				if (guardResult === 'skip') {
					return;
				}

				await this.#run(localMessage, resolved.command, client);
			}

			return;
		}

		let localMessage;

		if (message.isGroup) {
			const sessionName = this.#configuration.settings?.main_session || 'aestherix-bot';

			try {
				this.#router.groupAliases = await getCustomAliases(message.from, sessionName);
			} catch {
				this.#router.groupAliases = {};
			}
		} else {
			this.#router.groupAliases = {};
		}

		const resolved = this.#router.resolve(body);

		if (resolved) {
			localMessage = message.derive({
				body,
				args: resolved.args,
				cmd: resolved.cmdName,
				prefix: resolved.prefix,
				isEval: resolved.isEval,
				isCmd: true,
				query: resolved.query
			});

			setPrefix(resolved.prefix);
		} else {
			localMessage = message.derive({
				body,
				args: body.split(/ +/g),
				cmd: '',
				isEval: false,
				isCmd: false,
				query: body
			});
		}

		let command = resolved?.command ?? null;

		if (!command && localMessage.isCmd && this.#flags.autoCorrect) {
			command = this.#autoCorrect(localMessage);
		}

		if (!this.#flags.silent) {
			this.#logMessage(localMessage);
		}

		if (!command && !localMessage.isGroup && this.#flags.ai) {
			const aiHandler = this.#handlers.get('AI');

			if (aiHandler) {
				await aiHandler(localMessage, client);
			}

			return;
		}

		if (!command) {
			await this.#handleGames(localMessage, client);
			return;
		}

		const guardResult = await this.#guard(localMessage, command, client);

		if (guardResult === 'skip') {
			return;
		}

		await this.#run(localMessage, command, client);
	}

	#autoCorrect(localMessage) {
		if (localMessage.isEval) {
			return null;
		}

		const tempCmd = localMessage.cmd;

		if (!tempCmd || tempCmd.length < 2 || /[^a-z0-9]/i.test(tempCmd)) {
			return null;
		}

		const commands = this.#router.commands;
		const aliases = this.#router.aliases;
		const commandKeys = typeof commands.keysOnly === 'function' ? commands.keysOnly() : commands.keys();

		const cmdMatch = findBestMatch(tempCmd, commandKeys);

		if (cmdMatch.bestMatch.rating >= 0.6) {
			localMessage.cmd = cmdMatch.bestMatch.target;
			return commands.get(cmdMatch.bestMatch.target);
		}

		if (aliases.length) {
			const aliasMatch = findBestMatch(tempCmd, aliases);

			if (aliasMatch.bestMatch.rating >= 0.57) {
				localMessage.cmd = aliasMatch.bestMatch.target;
				return commands.filter((_key, cmd) => cmd.aliases?.includes(aliasMatch.bestMatch.target), 'find') || null;
			}
		}

		return null;
	}

	async #guard(localMessage, command, client) {
		if (this.#router.isBlocked(command)) {
			return 'skip';
		}

		if (localMessage.isBotInstance) {
			return 'skip';
		}

		if (this.#flags.onlyLogs && !localMessage.isEval) {
			return 'skip';
		}

		if (!localMessage.isOwner && this.#flags.selfMode) {
			return 'skip';
		}

		const disabled = this.#configuration.registry.disabledCommands;

		if (disabled?.has(command.name)) {
			void client.reply(
				localMessage.from,
				`The command \`${command.name}\` is currently disabled by dashboard.`,
				localMessage.message
			);
			return 'skip';
		}

		if (this.#retryManager.isDisabled(command.name)) {
			const remaining = this.#retryManager.getDisableRemaining(command.name);
			const L = useLocale(localMessage.locale ?? 'id', 'common');

			if (localMessage.isOwner) {
				const builder = new client.TemplateBuilder.Native();

				await builder
					.destination(localMessage.from)
					.body(L.core.errors.commandDisabled.replace('{0}', command.name).replace('{1}', remaining))
					.buttons(builder.button.reply({ display: L.core.success.enable, id: `enable:${command.name}` }))
					.send();
			} else {
				void client.reply(
					localMessage.from,
					L.core.errors.commandDisabled.replace('{0}', command.name).replace('{1}', remaining),
					localMessage.message
				);
			}

			return 'skip';
		}

		if (command.category === 'Owner' && !localMessage.isOwner) {
			const L = useLocale(localMessage.locale ?? 'id', 'common');
			void client.reply(localMessage.from, L.core.errors.ownerOnly, localMessage.message);
			return 'skip';
		}

		if (this.#configuration.settings?.maintenance && !localMessage.isOwner) {
			const L = useLocale(localMessage.locale ?? 'id', 'common');
			void client.reply(localMessage.from, L.core.errors.maintenance, localMessage.message);
			return 'skip';
		}

		if (HEAVY_CATEGORIES.has(command.category)) {
			const lockedBy = this.#checkExecutionLock(localMessage.sender);

			if (lockedBy) {
				const L = useLocale(localMessage.locale ?? 'id', 'common');
				void client.reply(localMessage.from, L.core.errors.executionLocked.replace('{0}', lockedBy), localMessage.message);
				return 'skip';
			}
		}

		if (localMessage.isOwner) {
			const isSelf = localMessage.sender === this.#configuration.botJid;

			if (isSelf) {
				const selfRole = Limit.checkRole(localMessage.sender);

				if (command.premium && selfRole.role !== 'PREMIUM' && selfRole.role !== 'OWNER') {
					const L = useLocale(localMessage.locale ?? 'id', 'common');
					void client.reply(localMessage.from, L.core.errors.premiumOnly, localMessage.message);
					return 'skip';
				}

				return 'pass';
			}

			return 'pass';
		}

		if (localMessage.isBanned) {
			void client.send(localMessage.from, { react: { text: '🖕🏼', key: localMessage.message.key } });
			return 'skip';
		}

		if (this.#flags.restrict && command.restrict) {
			const L = useLocale(localMessage.locale ?? 'id', 'common');
			void client.reply(localMessage.from, L.core.errors.restricted, localMessage.message);
			return 'skip';
		}

		if (
			command.category === 'Games' &&
			localMessage.isGroup &&
			!localMessage.isAdmin &&
			localMessage?.[localMessage?.from]?.games === 'disable'
		) {
			void client.reply(
				localMessage.from,
				'Game Mode is Disabled. Type !games enable to enable Game Mode',
				localMessage.message
			);
			return 'skip';
		}

		if (command.category === 'Moderation') {
			if (!localMessage.isGroup) {
				const L = useLocale(localMessage.locale ?? 'id', 'common');
				void client.reply(localMessage.from, L.core.errors.groupOnly, localMessage.message);
				return 'skip';
			}

			if (!localMessage.isAdmin) {
				const L = useLocale(localMessage.locale ?? 'id', 'common');
				void client.reply(localMessage.from, L.core.errors.adminOnly, localMessage.message);
				return 'skip';
			}
		}

		const userRole = Limit.checkRole(localMessage.sender);

		if (command.premium && userRole.role !== 'PREMIUM' && userRole.role !== 'OWNER') {
			if (this.#isHelpRequest(localMessage, command)) {
				await this.#sendHelp(client, localMessage, command, true);
				return 'skip';
			}

			const L = useLocale(localMessage.locale ?? 'id', 'common');
			void client.reply(localMessage.from, L.core.errors.premiumOnly, localMessage.message);
			return 'skip';
		}

		if (!this.#flags.unlimited) {
			if (!Limit.checkExist(localMessage.sender) && userRole.role !== 'OWNER' && userRole.role !== 'PREMIUM') {
				Limit.upsert(localMessage.sender, 0, userRole.role);
			}

			const limit = Limit.reduceLimit(localMessage.sender, command.limit);

			if (limit.error) {
				void client.reply(
					localMessage.from,
					limit.message.replace('%s', `But this command (${command.name}) need ${command.limit}`),
					localMessage.message
				);
				return 'skip';
			}
		}

		if (this.#flags.coolDown) {
			const { onCooldown, remaining } = this.#router.checkCooldown(localMessage.sender, command.name, command.cooldown);

			if (onCooldown) {
				void client.reply(
					localMessage.from,
					`Command \`${command.name}\` is still on cooldown for ${remaining} seconds.`,
					localMessage.message
				);
				return 'skip';
			}
		}

		return 'pass';
	}

	async #run(localMessage, command, client) {
		if (this.#isHelpRequest(localMessage, command)) {
			await this.#sendHelp(client, localMessage, command);
			return;
		}

		if (command.replyChain?.enabled && !localMessage.isGroup) {
			const chainKey = `${localMessage.sender}:${command.name}`;
			const chain = this.#replyChains.get(chainKey) || [];

			chain.push({ role: 'user', content: localMessage.body, timestamp: Date.now() });

			const max = command.replyChain.maxMessages || 5;

			while (chain.length > max * 2) {
				chain.shift();
			}

			this.#replyChains.set(chainKey, chain);
			localMessage.chainHistory = chain;
		}

		const sender = localMessage.sender;
		const isHeavy = HEAVY_CATEGORIES.has(command.category);

		if (isHeavy) {
			this.#executionLocks.set(sender, { command: command.name, expiry: Date.now() + EXECUTION_LOCK_TTL });
		}

		const timeoutMs = command.timeout ?? 30000;
		const ownerNoTimeout = localMessage.isOwner && command.category === 'Owner';

		try {
			if (ownerNoTimeout || !timeoutMs) {
				await command.run(localMessage, client, this.#store);
			} else {
				let timedOut = false;
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => {
						timedOut = true;
						reject(new Error(`Command "${command.name}" timed out after ${Math.round(timeoutMs / 1000)}s`));
					}, timeoutMs)
				);

				const firewall = new Proxy(client, {
					get(target, prop) {
						if (timedOut && typeof prop !== 'symbol') {
							return typeof target[prop] === 'function' ? () => Promise.resolve() : undefined;
						}

						const value = target[prop];
						return typeof value === 'function' ? value.bind(target) : value;
					}
				});

				await Promise.race([command.run(localMessage, firewall, this.#store), timeoutPromise]);
			}

			this.#router.trackUsage(command.name).catch(noop);
			this.#retryManager.clearCounter(localMessage.sender, command.name);
		} catch (err) {
			const isTimeout = err?.message?.startsWith('Command "') && err?.message?.includes('timed out');

			if (isTimeout) {
				void client.reply(localMessage.from, `⏱️ ${err.message}`, localMessage.message);
			} else {
				await this.#handleError(err, localMessage, command, client).catch(() => {});
			}
		} finally {
			if (isHeavy) {
				this.#executionLocks.delete(sender);
			}
		}
	}

	#checkExecutionLock(sender) {
		const lock = this.#executionLocks.get(sender);

		if (!lock) {
			return null;
		}

		if (Date.now() > lock.expiry) {
			this.#executionLocks.delete(sender);
			return null;
		}

		return lock.command;
	}

	#wrapRetryClient(realClient, buffer) {
		return new Proxy(realClient, {
			get(target, prop) {
				if (prop === 'downloadMediaMessage') {
					return () => Promise.resolve(buffer);
				}

				if (prop === 'downloadAndSaveMediaMessage') {
					return async (_media, filePath) => {
						const { default: fs } = await import('fs-extra');

						await fs.writeFile(filePath, buffer);
						return filePath;
					};
				}

				const value = target[prop];

				return typeof value === 'function' ? value.bind(target) : value;
			}
		});
	}

	#isHelpRequest(localMessage, command) {
		return /-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|h)$/i.test(localMessage.args[1]) && command.name !== 'eval';
	}

	async #sendHelp(client, localMessage, command, isPremiumNote = false) {
		let help = `Description : ${command.description}\nUsage : ${command.usage}\nCooldown : ${command.cooldown}s\nAliases : ${command.aliases.map((v) => `!${v}`).join(', ')}.`;

		if (isPremiumNote) {
			help += '\nThis Features Only for Premium users.';
		}

		await client.reply(localMessage.from, help, localMessage.message);
	}

	async #handleError(err, localMessage, command, client) {
		const L = useLocale(localMessage.locale ?? 'id', 'common');
		const builder = new client.TemplateBuilder.Native();
		const errorLocation = this.#getErrorLocation(err?.stack);
		let str = !localMessage.isOwner ? L.core.info.reportToOwner : '\n';

		str += `Type : ${err.name || 'Unknown'}\nMessage : ${err.message || 'Unknown'}\nFile : ${errorLocation.file}\nLine : ${errorLocation.line}\nStack Trace :\n${(localMessage.isOwner ? err?.stack?.substring(0, 70) : err?.stack?.substring(0, 20)) || 'Unknown'}`;

		const failure = this.#retryManager.recordFailure(localMessage.sender, command.name);
		let retryId = null;

		if (!failure.disabled) {
			const needsMedia =
				localMessage.isMediaImage ||
				localMessage.isMediaVid ||
				localMessage.isQuotedSticker ||
				localMessage.isQuotedAudio ||
				localMessage.isMediaDocument ||
				localMessage.stickerAble;

			if (needsMedia && localMessage.mediaData) {
				try {
					const buffer = await client.downloadMediaMessage(localMessage.mediaData);

					if (buffer?.length) {
						retryId = this.#retryManager.generateId();
						this.#retryManager.cacheMedia(retryId, {
							buffer,
							typeQuoted: localMessage.typeQuoted,
							mediaType: localMessage.typeQuoted || localMessage.type
						});
					}
				} catch {
					/* media download failed — retry without cached media */
				}
			}

			const canRetry = !needsMedia || retryId;
			const retryBody = retryId ? `${localMessage.body} retry:${retryId}` : localMessage.body;

			await builder
				.destination(localMessage.from)
				.body(localMessage.isOwner ? L.core.info.unexpectedError : L.core.info.clientError)
				.footer(str)
				.buttons(
					...[
						localMessage.isOwner
							? builder.button.url({
									display: L.core.success.reportToOwner,
									url: `https://wa.me/${localMessage.settings.owner_number.replace(/[^\d]/g, '')}?text=hi,%20bot%20mengalami%20error${encodeURI(`\n\n${err.stack}`)}`
								})
							: null,
						localMessage.isOwner
							? builder.button.reply({ display: L.core.success.reportViaBot, id: cmdId('report', err.stack, localMessage) })
							: null,
						canRetry
							? builder.button.reply({
									display: L.core.success.retry.replace('{0}', `${this.#retryManager.maxRetries - failure.count} left`),
									id: retryBody
								})
							: null
					].filter(Boolean)
				)
				.send();
		} else {
			await builder
				.destination(localMessage.from)
				.body(localMessage.isOwner ? L.core.info.unexpectedError : L.core.info.clientError)
				.footer(str)
				.buttons(
					...[
						localMessage.isOwner
							? builder.button.url({
									display: L.core.success.reportToOwner,
									url: `https://wa.me/${localMessage.settings.owner_number.replace(/[^\d]/g, '')}?text=hi,%20bot%20mengalami%20error${encodeURI(`\n\n${err.stack}`)}`
								})
							: null,
						localMessage.isOwner
							? builder.button.reply({ display: L.core.success.reportViaBot, id: cmdId('report', err.stack, localMessage) })
							: null,
						localMessage.isOwner
							? builder.button.reply({ display: L.core.success.enable, id: `enable:${command.name}` })
							: null
					].filter(Boolean)
				)
				.send();
		}

		this.#log.error(err);
	}

	#getErrorLocation(stack) {
		const fallback = { file: 'message-handler.js', line: 'unknown' };

		if (!stack) {
			return fallback;
		}

		const stackLines = String(stack).split('\n');
		const framePattern = /\((?:file:\/\/)?(.+?):(\d+):(\d+)\)|at (?:file:\/\/)?(.+?):(\d+):(\d+)/;

		for (const line of stackLines) {
			if (!line.includes(' at ')) {
				continue;
			}

			if (line.includes('message-handler.js') || line.includes('node:internal') || line.includes('internal/')) {
				continue;
			}

			const match = line.match(framePattern);

			if (!match) {
				continue;
			}

			const filePath = (match[1] || match[4] || '')
				.trim()
				.replace(/\\/g, '/')
				.replace(/[?#].*$/, '');
			const lineNumber = match[2] || match[5] || 'unknown';

			if (!filePath) {
				continue;
			}

			const srcIndex = filePath.lastIndexOf('/src/');
			const displayPath = srcIndex !== -1 ? filePath.slice(srcIndex + 1) : filePath.split('/').slice(-2).join('/');

			return {
				file: displayPath || filePath,
				line: lineNumber
			};
		}

		return fallback;
	}

	async #handleOffline(client, message) {
		if (this.#statsOffline) {
			await this.#router.commands
				.get('simulates')
				?.run(
					{ args: ['.simulates', 'online', 'disable'], isOwner: true, from: false, message: message.message },
					client,
					this.#store
				);
			this.#statsOffline = false;
		}

		const offlineHandler = this.#handlers.get('OFFLINE');

		if (offlineHandler) {
			return offlineHandler(client, message);
		}
	}

	#handleAfk(client, message) {
		const L = useLocale(message.locale ?? 'id', 'common');

		if (checkAfk(message.sender, message.from)) {
			const { reasons, since } = getAfk(message.sender, message.from);
			const time = getTimeSince(since);

			client.send(
				message.from,
				{
					text: L.core.afk.unsetAuto.replace('{0}', message.sender.split('@')[0]).replace('{1}', time).replace('{2}', reasons),
					mentions: [message.sender]
				},
				{ quoted: message.message }
			);
			deleteAfk(message.sender, message.from);
		}

		if (message.bodyQuoted && message.mediaData?.participant && checkAfk(message.mediaData.participant, message.from)) {
			const { reasons, since, name } = getAfk(message.mediaData.participant);
			const time = getTimeSince(since);

			client.reply(
				message.from,
				L.core.afk.isAfk.replace('{0}', name).replace('{1}', time).replace('{2}', reasons),
				message.message
			);
		}

		if (message.mention?.length) {
			this.#handleMentionedAfk(message, client);
		}
	}

	#handleMentionedAfk(message, client) {
		if (message.message.key.fromMe) {
			return;
		}

		const L = useLocale(message.locale ?? 'id', 'common');
		let caption = L.core.afk.taggingWarning + '\n\n';
		const container = [];

		for (const mention of message.mention) {
			if (checkAfk(mention, message.from)) {
				const { reasons, since, name } = getAfk(mention, message.from);
				const time = getTimeSince(since);

				caption += L.core.afk.afkDetail.replace('{0}', name).replace('{1}', time).replace('{2}', reasons);
				container.push(mention);
			}
		}

		if (container.length) {
			client.reply(message.from, caption.trim(), message.message);
		}
	}

	async #handleGames(message, client) {
		const gameKeys = Array.from(this.#handlers.keys()).filter((v) => !['STUBTYPE', 'STORY', 'OFFLINE', 'AI'].includes(v));

		await Promise.allSettled(
			gameKeys.map((v) => {
				const handler = this.#handlers.get(v);

				return handler ? handler(client, message, this.#store) : Promise.resolve();
			})
		);
	}

	#isStubMessage(message) {
		return message && 'messageStubParameters' in message && message.messageStubParameters?.length;
	}

	#handleStub(message) {
		const stub = message.messageStubParameters[0];
		const ignored = [
			'Message absent from node',
			'No session found to decrypt message',
			'No session record',
			'Bad MAC',
			'No matching sessions found for message'
		];

		if (ignored.includes(stub)) {
			return;
		}

		if (message.messages?.[0]) {
			const stubHandler = this.#handlers.get('STUBTYPE');

			if (stubHandler) {
				stubHandler(this.#client, message.messages[0], this.#store);
			}
		}
	}

	#isValidMessage(message) {
		if (!message || 'error' in message || !message.message || message.isBotInstance) {
			return false;
		}

		if (message.type === 'protocolMessage' || message.type === 'senderKeyDistributionMessage' || !message.type) {
			return false;
		}

		return true;
	}

	#resolveInputState(message) {
		const inputState = this.#configuration.input.get(message.sender);

		if (!inputState) {
			return false;
		}

		const textLikeTypes = [
			'conversation',
			'extendedTextMessage',
			'templateButtonReplyMessage',
			'buttonsMessage',
			'buttonsResponseMessage',
			'listResponseMessage'
		];

		if (inputState.expectedType.some((v) => textLikeTypes.includes(v)) && textLikeTypes.includes(message.type)) {
			if (message.isCmd) {
				inputState.resolve({ message: message.body, quoted: message.message, invalid: false, command: true });
				return false;
			}

			inputState.resolve({ message: message.body, quoted: message.message, invalid: false });
			return true;
		}

		if (inputState.expectedType.includes(message.type)) {
			inputState.resolve({ message: message.message, quoted: message.message, invalid: false });
			return true;
		}

		inputState.resolve({ message: message.body, quoted: message.message, invalid: true });
		return true;
	}

	async #checkAutomod(ctx, client) {
		if (!ctx.isGroup || ctx.isCmd || !ctx.body) {
			return;
		}

		try {
			const rules = await getAutomodRules(ctx.from);
			const enabledRules = rules.filter((r) => r.enabled);

			if (!enabledRules.length) {
				return;
			}

			const sender = ctx.sender;
			const groupId = ctx.from;
			const body = ctx.body;
			const now = Date.now();

			for (const rule of enabledRules) {
				let violated = false;

				if (rule.type === 'caps') {
					const letters = body.replace(/[^a-zA-Z]/g, '');

					if (letters.length > 0) {
						const upperCount = letters.replace(/[^A-Z]/g, '').length;
						const pct = (upperCount / letters.length) * 100;

						violated = pct > rule.threshold;
					}
				}

				if (rule.type === 'links') {
					const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+/i;

					violated = urlPattern.test(body);
				}

				if (rule.type === 'spam' || rule.type === 'flood') {
					const counterKey = `${groupId}:${sender}:${rule.id}`;
					const counter = this.#automodCounters.get(counterKey) || { timestamps: [] };

					counter.timestamps.push(now);
					counter.timestamps = counter.timestamps.filter((t) => now - t <= rule.duration * 1000);

					this.#automodCounters.set(counterKey, counter);

					violated = counter.timestamps.length >= rule.threshold;

					if (violated) {
						counter.timestamps = [];
					}
				}

				if (!violated) {
					continue;
				}

				const { action } = rule;
				const locale = await getLocale(groupId);
				const L = useLocale(locale, 'common');

				if (action === 'warn') {
					await client.reply(groupId, L.core.automod.warn.replace('{0}', rule.type), ctx.message);
				} else if (action === 'kick') {
					try {
						await client.updateGroup(groupId, { action: 'remove', participants: [sender], admins: [], message: ctx.message });
						await client.send(
							groupId,
							{ text: L.core.automod.kicked.replace('{0}', `@${sender.split('@')[0]}`).replace('{1}', rule.type), mentions: [sender] },
							{ quoted: ctx.message }
						);
					} catch {
						await client.send(
							groupId,
							{ text: L.core.automod.kickFailed.replace('{0}', `@${sender.split('@')[0]}`), mentions: [sender] },
							{ quoted: ctx.message }
						);
					}
				} else if (action === 'delete') {
					try {
						await client.sendMessage(groupId, { delete: ctx.message.key });
					} catch {
						/* message already deleted */
					}
				}
			}
		} catch (err) {
			process.stderr.write(`[AUTOMOD] check error: ${err.message}\n`);
		}
	}

	#retryRelay(msg) {
		const id = msg.key.id;
		const count = this.#retries.get(id) || 0;

		if (count >= 3) {
			this.#retries.delete(id);
			return;
		}

		this.#retries.set(id, count + 1);
		this.#client.relay(msg.key.remoteJid, msg.message, { messageId: id }).catch(() => {
			/* silent retry */
		});
	}

	#sweepStaleEntries() {
		const now = Date.now();

		for (const [sender, lock] of this.#executionLocks) {
			if (now > lock.expiry) {
				this.#executionLocks.delete(sender);
			}
		}

		if (this.#retries.size > 1000) {
			this.#retries.clear();
		}

		if (this.#automodCounters.size > 5000) {
			this.#automodCounters.clear();
		}
	}

	async #initHandlers() {
		await Promise.all(
			Object.entries(HANDLER_PATH).map(async ([key, modulePath]) => {
				const module = await import(modulePath);

				this.#handlers.set(key, module.default ?? module);
			})
		);
	}

	#logMessage(message) {
		if (message.isFromMe && !this.#flags.printSelf) {
			return;
		}

		if (this.#client.role === 'sub' && message.isGroup && !message.isCmd) {
			return;
		}

		const runtime = this.#configuration.flags?.runtime ?? Date.now();
		const signature = this.#buildLogSignature(message);
		const isContinuation = this.#canRewriteLog(message, signature);
		const repeatCount = isContinuation ? this.#lastLog.count + 1 : 1;

		if (isContinuation) {
			readline.moveCursor(process.stdout, 0, -1);
			readline.clearLine(process.stdout, 0);
			readline.cursorTo(process.stdout, 0);
		}

		const senderInfo = message.isFromMe
			? `${color('[', 'gray')}${color('HOST', 'salmon')}${color(']', 'gray')} ${color(BOT_NAME, 'yellow')}`
			: `${color(message.pushname, 'yellow')}`;

		const messageBody = color(message.query?.replace(/[\t\n]/g, ' ').substring(0, 35), 'white');
		const runtimeInfo = `${SEPARATOR} ${color(((Date.now() - runtime) / 1000).toFixed(0), '#F1FA8C')}${color('s', 'lemon')}${
			repeatCount > 1 ? ` ${color(`(×${repeatCount})`, 'glowYellow')}` : ''
		}`;
		const messageFrom = `${SEPARATOR} ${color('in', 'white')} ${color(message.isGroup ? `${message.groupName}` : 'private', 'lavender')}${(message.isGroup && color(' id ', 'white') + color(message.groupId, 'purple')) || ''}`;

		let fullBody;

		if (message.isCmd) {
			fullBody = message.isEval
				? `${color('eval', 'periwinkle')} ${messageBody}`
				: `${color('command', 'salmon')} ${color(message.prefix, 'purple')}${color(message.cmd, 'powderBlue')} ${messageBody}`;
		} else {
			const isPossiblyCaption = [
				'audioMessage',
				'documentWithCaptionMessage',
				'imageMessage',
				'videoMessage',
				'liveLocationMessage'
			].includes(message.type);

			fullBody = `${color(isPossiblyCaption && message.body !== 'No Caption' ? 'caption' : 'message', 'softGreen')} ${color(message.body?.substring(0, 20).replace(/[\t\n]/g, ' '), 'white')}`;
		}

		this.#log.info(`${senderInfo} ${SEPARATOR}`, fullBody, messageFrom, runtimeInfo);

		this.#lastLog = {
			kind: message.isCmd ? 'cmd' : 'message',
			sender: message.sender,
			from: message.from,
			command: message.isCmd ? message.cmd : null,
			signature,
			marker: stdoutWriteCounter,
			count: repeatCount
		};
	}

	#canRewriteLog(message, signature) {
		if (!message.isCmd || this.#lastLog.kind !== 'cmd') {
			return false;
		}

		if (stdoutWriteCounter !== this.#lastLog.marker) {
			return false;
		}

		return (
			this.#lastLog.sender === message.sender &&
			this.#lastLog.from === message.from &&
			this.#lastLog.command === message.cmd &&
			this.#lastLog.signature === signature
		);
	}

	#buildLogSignature(message) {
		const commandBody = message.isCmd
			? `${message.prefix || ''}${message.cmd || ''} ${message.query || ''}`.trim()
			: message.body || '';

		return `${message.from || ''}|${message.sender || ''}|${commandBody}`;
	}

	async #shouldAutoDecryptViewOnce(from) {
		const cached = configuration.groups.settings.get(from);

		return cached?.viewonce === 'enable';
	}

	async #autoDecryptViewOnce(message, client) {
		try {
			const { downloadMediaMessage } = await import('baileys');
			const vo = message.viewOnceMedia;

			if (!vo?.message) {
				return;
			}

			const locale = await getLocale(message.from);
			const L = useLocale(locale, 'common');
			const buffer = await downloadMediaMessage(message.mediaData, 'buffer', {});
			const mediaKey = vo.message?.imageMessage ? 'image' : vo.message?.videoMessage ? 'video' : 'audio';

			const rawCaption =
				vo.caption ||
				vo.message?.imageMessage?.caption ||
				vo.message?.videoMessage?.caption ||
				vo.message?.audioMessage?.caption ||
				'';

			const viewOnceLabel = L.info.viewOnceDecrypted;

			const caption = rawCaption ? `\n\n${rawCaption}` : '';

			if (!buffer || !Buffer.isBuffer(buffer)) {
				return;
			}

			await client.send(
				message.from,
				{
					[mediaKey]: buffer,
					caption: `${viewOnceLabel}${caption}`
				},
				{ quoted: message.message }
			);
		} catch (err) {
			console.log(err);
			this.#log?.error?.('viewonce auto-decrypt failed:', err.message);
		}
	}
}
