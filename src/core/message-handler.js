import { BOT_NAME } from './constants.js';

import readline from 'readline';
import { findBestMatch } from 'string-similarity';

import configuration from '../helper/config/connect.js';
import { Limit, checkAfk, deleteAfk, getAfk } from '../helper/index.js';
import { Cache } from '../helper/modules/cache.js';
import { cmdId, setPrefix } from '../helper/modules/prefix.js';
import { color, getTimeSince, loggers } from '../utils/modules/index.js';
import { Context } from './context.js';
import { Logger } from './logger.js';
import { PipelineExecutor } from './pipeline.js';

const EVALY = ['/>', '$>', '=>', '!>'];
const SEPARATOR = color('⤑', 'green');
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
	}

	get router() {
		return this.#router;
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

		await this.#initHandlers();
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
			return this.#handlers.get('STORY')(client, message);
		}

		if (this.#flags.offline) {
			return this.#handleOffline(client, message);
		}

		if (this.#flags.autoRead && !message.isBlocked && !message.isBanned) {
			this.#client.readMessages([message.message.key]);
		}

		if (message.isGroup) {
			this.#handleAfk(client, message);
		}

		if (this.#resolveInputState(message)) {
			return;
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
			log: (ctx) => !this.#flags.noLogs && this.#logMessage(ctx)
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

		let localMessage;

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

		if (!this.#flags.noLogs) {
			this.#logMessage(localMessage);
		}

		if (!command && !localMessage.isGroup && this.#flags.ai) {
			await this.#handlers.get('AI')(localMessage, client);
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

		if (command.category === 'Owner' && !localMessage.isOwner) {
			void client.reply(localMessage.from, 'This commands is only for owner.', localMessage.message);
			return 'skip';
		}

		if (this.#configuration.settings?.maintenance && !localMessage.isOwner) {
			void client.reply(
				localMessage.from,
				'🛠️ Bot is currently in maintenance mode. Please try again later.',
				localMessage.message
			);
			return 'skip';
		}

		if (HEAVY_CATEGORIES.has(command.category)) {
			const lockedBy = this.#checkExecutionLock(localMessage.sender);

			if (lockedBy) {
				void client.reply(
					localMessage.from,
					`Please wait, your previous command (${lockedBy}) is still running.`,
					localMessage.message
				);
				return 'skip';
			}
		}

		if (localMessage.isOwner) {
			return 'pass';
		}

		if (localMessage.isBanned) {
			void client.send(localMessage.from, { react: { text: '🖕🏼', key: localMessage.message.key } });
			return 'skip';
		}

		if (this.#flags.restrict && command.restrict) {
			void client.reply(
				localMessage.from,
				'This command is restricted and currently bot are on restricted mode.',
				localMessage.message
			);
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
				void client.reply(localMessage.from, 'This commands for group only', localMessage.message);
				return 'skip';
			}

			if (!localMessage.isAdmin) {
				void client.reply(localMessage.from, 'You are not admin. This commands is only for admins.', localMessage.message);
				return 'skip';
			}
		}

		const userRole = Limit.checkRole(localMessage.sender);

		if (command.premium && userRole.role !== 'PREMIUM' && userRole.role !== 'OWNER') {
			if (this.#isHelpRequest(localMessage, command)) {
				await this.#sendHelp(client, localMessage, command, true);
				return 'skip';
			}

			void client.reply(localMessage.from, 'This commands is only for premium user.', localMessage.message);
			return 'skip';
		}

		if (!this.#flags.noLimit) {
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

		const sender = localMessage.sender;
		const isHeavy = HEAVY_CATEGORIES.has(command.category);

		if (isHeavy) {
			this.#executionLocks.set(sender, { command: command.name, expiry: Date.now() + EXECUTION_LOCK_TTL });
		}

		try {
			await command.run(localMessage, client, this.#store);
			this.#router.trackUsage(command.name).catch(noop);
		} catch (err) {
			await this.#handleError(err, localMessage, client).catch(() => {});
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

	async #handleError(err, localMessage, client) {
		const builder = new client.TemplateBuilder.Native();
		const errorLocation = this.#getErrorLocation(err?.stack);
		let str = !localMessage.isOwner ? 'Please send this error stack to the owner :\n\n' : '\n';

		str += `Type : ${err.name || 'Unknown'}\nMessage : ${err.message || 'Unknown'}\nFile : ${errorLocation.file}\nLine : ${errorLocation.line}\nStack Trace :\n${(localMessage.isOwner ? err?.stack?.substring(0, 70) : err?.stack?.substring(0, 20)) || 'Unknown'}`;

		await builder
			.destination(localMessage.from)
			.body(
				localMessage.isOwner
					? 'Something went unexpected. Please read below :'
					: 'This error is from the client. Please report to owner.'
			)
			.footer(str)
			.buttons(
				...[
					localMessage.isOwner
						? builder.button.url({
								display: 'Report to Owner',
								url: `https://wa.me/${localMessage.settings.owner_number.replace(/[^\d]/g, '')}?text=hi,%20bot%20mengalami%20error${encodeURI(`\n\n${err.stack}`)}`
							})
						: null,
					localMessage.isOwner
						? builder.button.reply({ display: 'Report via Bot', id: cmdId('report', err.stack, localMessage) })
						: null,
					builder.button.reply({ display: 'Retry', id: localMessage.body })
				].filter(Boolean)
			)
			.send();

		loggers.error(err);
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

		return this.#handlers.get('OFFLINE')(client, message);
	}

	#handleAfk(client, message) {
		if (checkAfk(message.sender, message.from)) {
			const { reasons, since } = getAfk(message.sender, message.from);
			const time = getTimeSince(since);

			client.send(
				message.from,
				{
					text: `@${message.sender.split('@')[0]} is AFK since ${time} ago. Now they are out from AFK. Reason: ${reasons}`,
					mentions: [message.sender]
				},
				{ quoted: message.message }
			);
			deleteAfk(message.sender, message.from);
		}

		if (message.bodyQuoted && checkAfk(message.mediaData.participant, message.from)) {
			const { reasons, since, name } = getAfk(message.mediaData.participant);
			const time = getTimeSince(since);

			client.reply(message.from, `${name} is AFK since ${time} ago. Reason: ${reasons}`, message.message);
		}

		if (message.mention?.length) {
			this.#handleMentionedAfk(message, client);
		}
	}

	#handleMentionedAfk(message, client) {
		if (message.message.key.fromMe) {
			return;
		}

		let caption = 'You are Tagging People That Are AFK.'.formatHeaders() + '\n\n';
		const container = [];

		for (const mention of message.mention) {
			if (checkAfk(mention, message.from)) {
				const { reasons, since, name } = getAfk(mention, message.from);
				const time = getTimeSince(since);

				caption += `${name}\nSince : ${time} ago.\nReason : ${reasons}\n\n`;
				container.push(mention);
			}
		}

		if (container.length) {
			client.reply(message.from, caption.trim(), message.message);
		}
	}

	async #handleGames(message, client) {
		const gameKeys = Array.from(this.#handlers.keys()).filter((v) => !['STUBTYPE', 'STORY', 'OFFLINE', 'AI'].includes(v));

		await Promise.all(gameKeys.map((v) => this.#handlers.get(v)(message, client, message)));
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
			this.#handlers.get('STUBTYPE')(this.#client, message.messages[0], this.#store);
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
		const messageFrom = `${SEPARATOR} ${color('in', 'white')} ${color(message.isGroup ? `group ${message.groupName}` : 'private chat', 'lavender')}${(message.isGroup && color(' id ', 'white') + color(message.groupId, 'purple')) || ''}`;

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

		loggers.info(`${senderInfo} ${SEPARATOR}`, fullBody, messageFrom, runtimeInfo);

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
}
