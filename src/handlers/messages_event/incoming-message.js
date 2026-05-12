import { generateWAMessage } from 'baileys';
import { findBestMatch } from 'string-similarity';

import configuration from '../../helper/config/connect.js';
import { incrementCommandUsage } from '../../helper/connection/utils/command-usage.js';
import { Limit, checkAfk, deleteAfk, getAfk, reassign } from '../../helper/index.js';
import { Cache } from '../../helper/modules/cache.js';
import { cmdId, setPrefix } from '../../helper/modules/prefix.js';
import { runtime } from '../../index.js';
import { color, getTimeSince, loggers, randomChar } from '../../utils/modules/index.js';

const handler = new Cache();

const log = console.log;

let isInit = false;

let STATS_OFFLINE = true;
const EVALY = ['/>', '$>', '=>', '!>'];
const SEPARATOR = color('⤑', 'green');
const HANDLER_PATH = {
	STUBTYPE: './stub-message.js',
	STORY: './story-message.js',
	OFFLINE: './offline-message.js',
	AKINATOR: '../game_handlers/akinator.js',
	TEBAKGAMBAR: '../game_handlers/tebak-gambar.js',
	SAMBUNGKATA: '../game_handlers/sambung-kata.js',
	WORDLE: '../game_handlers/wordle.js',
	ANONYMOUS: './anonymous-message.js',
	GROUPURL: '../misc/group-url.js',
	ANTINSFW: '../misc/anti-nsfw.js',
	AI: './character-ai.js'
};

/**
 *
 * @param {import('../../types/Reconstruct').ReassignResult} message
 */
const logMessage = (message) => {
	if (message.isFromMe && !configuration.OPTIONS.printSelf) {
		return;
	}

	const senderInfo = message.isFromMe
		? `${color('[', 'gray')}${color('HOST', 'salmon')}${color(']', 'gray')} ${color(`${global.__botName}`, 'yellow')} ${color(message.prettyNumber, 'purple')}`
		: `${color(message.pushname, 'yellow')} ${color(message.prettyNumber, 'purple')}`;
	const messageBody = color(message.query?.replace(/[\t\n]/g, ' ').substring(0, 35), 'white');
	// const typeInfo = `${SEPARATOR} ${color('type', 'rose')} ${color(message.type, 'teal')}`;
	const runtimeInfo = `${SEPARATOR}  ${color(((Date.now() - runtime) / 1000).toFixed(0), '#F1FA8C')}${color('s', 'lemon')}`;
	const messageFrom = `${SEPARATOR}  ${color('in', 'white')} ${color(
		message.isGroup ? `group ${message.groupName}` : 'private chat',
		'lavender'
	)}${(message.isGroup && color(' id ', 'white') + color(message.groupId, 'purple')) || ''}`;

	let fullBody = null;

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

		fullBody = `${color(isPossiblyCaption && message.body !== 'No Caption' ? 'caption' : 'message', 'softGreen')} ${color(
			message.body?.substring(0, 20).replace(/[\t\n]/g, ' '),
			'white'
		)}`;
	}

	loggers.info(
		`${senderInfo} ${SEPARATOR} `,
		fullBody,
		// typeInfo,
		messageFrom,
		runtimeInfo
	);
};

const handleStubMessage = async (client, message, store) => {
	if (message.messageStubParameters.length && message.messageStubParameters[0] === 'No matching sessions found for message') {
		return;
	}

	if (message.messages?.[0]) {
		handler.get('STUBTYPE')(client, message.messages?.[0], store);
	}
};

const handleStoryMessage = async (client, message) => handler.get('STORY')(client, message);

const handleOfflineMessage = async (client, message, cmds) => {
	if (STATS_OFFLINE) {
		await cmds.commands.get('simulates').run(
			{
				args: ['.simulates', 'online', 'disable'],
				isOwner: true,
				from: false,
				message: message.message
			},
			client,
			store
		);
		STATS_OFFLINE = false;
	}

	return await handler.get('OFFLINE')(client, message);
};

const handleMentionedAfkUsers = (message, client) => {
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
		client.instance.reply(message.from, caption.trim(), message.message);
	}
};

const handleAIMessage = async (message, client) => handler.get('AI')(message, client);

/**
 *
 * @param {import('../../types/Reconstruct').ReassignResult} message
 * @param {typeof client} client
 * @param {import('../../types/Socket').Store} store
 * @param {import('../../types/Socket/config.js').GlobalConfig['cmds']} cmds
 * @param {import('../../types/Socket/config.js').GlobalConfig['user']} user
 * @param {typeof globalThis['instance']} instance
 * @param {string} runtime
 * @param {import('../../types/Socket').SingleAuthState['state']} state
 * @returns
 */
const handleCommandExecution = async (message, client, store, cmds, user, instance, runtime, state) => {
	const useMultiCmd = Boolean(configuration.OPTIONS.multiCmd);
	const hasSeparator = useMultiCmd && !EVALY.includes(message.cmd) && message.body.includes('|');
	const bodies = hasSeparator ? message.body.split('|') : [message.body];

	for (const body of bodies) {
		const localMessage = { ...message, body: body.trim() };

		localMessage.args = localMessage.body.split(/ +/g);
		localMessage.cmd = localMessage.args?.[0].toLowerCase() || '';
		let prefix = configuration.cache.prf;
		const { prefixMode, prefixReg } = configuration.cache;

		if (prefixMode === 'multi' && prefixReg) {
			prefix = prefixReg.test(localMessage.cmd) ? localMessage.cmd.match(prefixReg)?.[0] : null;
		} else if (prefixMode === 'nopref') {
			prefix = '';
		}

		localMessage.isEval = EVALY.includes(localMessage.args[0]);

		localMessage.isCmd = prefixMode === 'nopref' ? true : prefix != null && localMessage.body.startsWith(prefix);
		localMessage.cmd = localMessage.isEval ? localMessage.args[0] : localMessage.isCmd ? localMessage.cmd : '';
		localMessage.query = localMessage.args.slice(1).join(' ').trim();

		if (localMessage.isCmd) {
			setPrefix(prefix);
		}

		let correctedCommand = null;
		let correctedAliases = null;

		check: if (localMessage.isCmd && configuration.OPTIONS.autoCorrect) {
			const prf = localMessage.prefix;

			if (localMessage.isEval) {
				break check;
			}

			const tempCmd = localMessage.cmd.slice(1).trim().toLowerCase();
			const cmdMatch = findBestMatch(tempCmd, cmds.commands.keys());

			if (cmdMatch.bestMatch.rating >= 0.6) {
				correctedCommand = prf + cmdMatch.bestMatch.target;
				localMessage.cmd = correctedCommand || correctedAliases || '';
			} else {
				const aliasMatch = findBestMatch(tempCmd, cmds.aliases);

				if (aliasMatch.bestMatch.rating >= 0.57) {
					correctedAliases = prf + aliasMatch.bestMatch.target;
					localMessage.cmd = correctedCommand || correctedAliases || '';
				}
			}

			localMessage.cmd = localMessage.cmd.slice(1).toLowerCase();
		} else if (localMessage.isCmd && !configuration.OPTIONS.autoCorrect) {
			if (localMessage.isEval) {
				break check;
			}

			localMessage.cmd = localMessage.cmd.slice(1).toLowerCase();
		}

		const commands = cmds.commands.valuesOnly();

		/**
		 * @type {import('../../types/Commands/index.js').CommandProps}
		 */
		const Tempcmds =
			cmds.commands.get(localMessage.cmd) || commands.find((v) => v.aliases?.includes(localMessage.cmd)) || false;

		if (!configuration.OPTIONS.noLogs) {
			logMessage(localMessage, runtime);
		}

		if (!Tempcmds && !localMessage.isGroup && configuration.OPTIONS.ai) {
			await handleAIMessage(localMessage, client);
			return;
		}

		if (!Tempcmds) {
			await handleGames(localMessage, client); // eslint-disable-line
		}

		if (Tempcmds && !localMessage.isOwner) {
			if (configuration.cmds.disabledCommands?.has(Tempcmds.name)) {
				await client.instance.reply(
					localMessage.from,
					`The command \`${Tempcmds.name}\` is currently disabled by dashboard.`,
					localMessage.message
				);
				continue;
			}

			if (configuration.OPTIONS.selfMode) {
				continue;
			}

			if (localMessage.isBanned) {
				await client.instance.send(localMessage.from, { react: { text: '🖕🏼', key: localMessage.message.key } });
				continue;
			}

			if (Tempcmds.category === 'Owner' && !localMessage.isOwner) {
				await client.instance.reply(localMessage.from, 'This commands is only for owner.', localMessage.message);
				continue;
			}

			if (configuration.OPTIONS.restrict && Tempcmds.restrict) {
				await client.instance.reply(
					localMessage.from,
					'This command is restricted and currently bot are on restricted mode.',
					localMessage.message
				);
				continue;
			}

			if (
				Tempcmds.category === 'Games' &&
				localMessage.isGroup &&
				!localMessage.isAdmin &&
				!localMessage.isOwner &&
				localMessage?.[localMessage?.from]?.games === 'disable'
			) {
				await client.instance.reply(
					localMessage.from,
					'Game Mode is Disabled. Type !games enable to enable Game Mode',
					localMessage.message
				);
				continue;
			}

			if (Tempcmds.category === 'Moderation' && localMessage.isGroup && !localMessage.isAdmin && !localMessage.isOwner) {
				await client.instance.reply(
					localMessage.from,
					'You are not admin. This commands is only for admins.',
					localMessage.message
				);
				continue;
			}

			if (Tempcmds.category === 'Moderation' && !localMessage.isGroup) {
				await client.instance.reply(localMessage.from, 'This commands for group only', localMessage.message);
				continue;
			}

			const cooldownEnabled = configuration.OPTIONS.coolDown;
			let userRole = Limit.checkRole(localMessage.sender);

			if (Tempcmds.premium && !(userRole.role === 'PREMIUM' || userRole.role === 'OWNER')) {
				if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|h)$/i.test(localMessage.args[1]) && Tempcmds.name !== 'eval') {
					const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
						Tempcmds.cooldown
					}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.\nThis Features Only for Premium users.`;

					client.instance.reply(localMessage.from, help, localMessage.message);

					continue;
				}

				await client.instance.reply(localMessage.from, 'This commands is only for premium user.', localMessage.message);

				continue;
			}

			if (!configuration.OPTIONS.noLimit) {
				const isExist = Limit.checkExist(localMessage.sender);

				if (!isExist) {
					const { role } = Limit.checkRole(localMessage.sender);

					if (!(role === 'OWNER' || role === 'PREMIUM')) {
						Limit.upsert(localMessage.sender, 0, role);
					}
				}

				const limit = Limit.reduceLimit(localMessage.sender, Tempcmds.limit);

				if (limit.error) {
					client.instance.reply(
						localMessage.from,
						limit.message.replace('%s', `But this command (${Tempcmds.name}) need ${Tempcmds.limit}`),
						localMessage.message
					);
					continue;
				}
			}

			if (cooldownEnabled) {
				const cooldownUser = user.cooldown.get(localMessage.sender) || new Cache();
				const isCooldown = cooldownUser.requests;

				if (isCooldown) {
					await client.instance.reply(
						localMessage.from,
						`Command still running. Please wait for the command ${
							cooldownEnabled ? 'and the cooldown after it finish.' : 'to finish.'
						}`,
						localMessage.message
					);
					continue;
				}

				const commandName = Tempcmds.name;
				const cooldownTime = cooldownUser.get(commandName);

				if (cooldownTime && Date.now() < cooldownTime) {
					await client.instance.reply(
						localMessage.from,
						`Command \`${commandName}\` is still on cooldown for ${((cooldownTime - Date.now()) / 1000).toFixed(1)} seconds.`,
						localMessage.message
					);
					continue;
				}

				cooldownUser.set(commandName, Date.now() + Tempcmds.cooldown * 1000);
				cooldownUser.requests = true;
				user.cooldown.set(localMessage.sender, cooldownUser);
			}
		}

		if (
			Tempcmds &&
			(configuration.OPTIONS.onlyLogs
				? localMessage.cmd.startsWith('==>') || localMessage.cmd.startsWith('//>') || localMessage.cmd.startsWith('$$>')
					? true
					: false
				: true)
		) {
			if (configuration.cmds.disabledCommands?.has(Tempcmds.name)) {
				await client.instance.reply(
					localMessage.from,
					`The command \`${Tempcmds.name}\` is currently disabled by dashboard.`,
					localMessage.message
				);
				continue;
			}

			if (!localMessage.isOwner && configuration.OPTIONS.selfMode) {
				continue;
			}

			if (localMessage.isBaileys) {
				continue;
			}

			const cooldownUser = user.cooldown.get(localMessage.sender);

			try {
				if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|h)$/i.test(localMessage.args[1]) && Tempcmds.name !== 'eval') {
					const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
						Tempcmds.cooldown
					}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.`;

					await client.instance.reply(localMessage.from, help, localMessage.message);

					if (cooldownUser?.requests) {
						cooldownUser.requests = false;
					}

					continue;
				}

				await Tempcmds.run({ ...localMessage, state }, client, store);
				await incrementCommandUsage(configuration, Tempcmds.name);

				if (cooldownUser?.requests) {
					cooldownUser.requests = false;
				}
			} catch (err) {
				if (cooldownUser?.requests) {
					cooldownUser.requests = false;
				}

				const builder = new client.instance.TemplateBuilder.Native();

				let str = !localMessage.isOwner ? 'Please send this error stack to the owner :\n\n' : '\n';

				str += `Type : ${err.name || 'Unknown'}\n`;
				str += `Message : ${err.message || 'Unknown'}\n`;
				str += `Stack Trace :\n${(message.isOwner ? err?.stack?.substring(0, 70) : err?.stack?.substring(0, 20)) || 'Unknown'}`;

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
										url: `https://wa.me/${localMessage.settings.owner_number.replace(/[^\d]/g, '')}?text=hi,%20bot%20mengalami%20error${encodeURI(
											`\n\n${err.stack}`
										)}`
									})
								: null,
							localMessage.isOwner
								? builder.button.reply({
										display: 'Report via Bot',
										id: cmdId('report', err.stack, localMessage)
									})
								: null,
							builder.button.reply({
								display: 'Retry',
								id: localMessage.body
							})
						].filter(Boolean)
					)
					.send();

				loggers.error(color(err.message, 'white'));
				const stackEntries = (
					err.stack
						?.split(err.name + ': ')[1]
						?.replace(err.message + '\n', '')
						?.split('    at ') || []
				)
					.map((stackEntry) => {
						const regex = /\((.*?)\)/;
						const match = regex.exec(stackEntry);

						if (match) {
							const [fullMatch, text] = match;

							return `${color(stackEntry.replace(fullMatch, '').replace('\n', ''), 'white')}(${color(text, 'purple')})`;
						}

						return stackEntry.trim();
					})
					.filter(Boolean);

				for (const entry of stackEntries) {
					loggers.error(`${color('❯ ', 'gray')}${color('at ', 'purple')}${entry}`);
				}
			}
		}
	}
};

const handleAfk = (client, message) => {
	if (checkAfk(message.sender, message.from)) {
		const { reasons, since } = getAfk(message.sender, message.from);
		const time = getTimeSince(since);

		client.instance.send(
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

		client.instance.reply(message.from, `${name} is AFK since ${time} ago. Reason: ${reasons}`, message.message);
	}

	if (message.mention?.length) {
		handleMentionedAfkUsers(message, client, instance);
	}
};

const handleGames = async (message, client) => {
	await Promise.all(
		Array.from(handler.keys())
			.filter((v) => !['STUBTYPE', 'STORY', 'OFFLINE', 'AI'].includes(v))
			.map((v) => handler.get(v)(message, client, message))
	);
};

const initHandler = async () => {
	handler.set('AKINATOR', (await import(HANDLER_PATH.AKINATOR)).default);
	handler.set('TEBAKGAMBAR', (await import(HANDLER_PATH.TEBAKGAMBAR)).default);
	handler.set('SAMBUNGKATA', (await import(HANDLER_PATH.SAMBUNGKATA)).default);
	handler.set('WORDLE', (await import(HANDLER_PATH.WORDLE)).default);
	handler.set('ANONYMOUS', (await import(HANDLER_PATH.ANONYMOUS)).default);
	handler.set('GROUPURL', (await import(HANDLER_PATH.GROUPURL)).default);
	handler.set('ANTINSFW', (await import(HANDLER_PATH.ANTINSFW)).default);
	handler.set('AI', (await import(HANDLER_PATH.AI)).default);
	handler.set('STUBTYPE', (await import(HANDLER_PATH.STUBTYPE)).default);
	handler.set('STORY', (await import(HANDLER_PATH.STORY)).default);
	handler.set('OFFLINE', (await import(HANDLER_PATH.OFFLINE)).default);
};

const failedMessages = new Map();
const MAX_RETRIES = 3;

async function createRetryNode(msg, failedMessages, MAX_RETRIES) {
	const messageId = msg.key.id;
	let retryCount = failedMessages.get(messageId) || 0;

	if (retryCount >= MAX_RETRIES) {
		failedMessages.delete(messageId);
		return null;
	}

	retryCount++;
	failedMessages.set(messageId, retryCount);

	return {
		key: {
			id: messageId,
			remoteJid: msg.key.remoteJid,
			participant: msg.key.participant
		},
		message: msg.message,
		messageTimestamp: msg.messageTimestamp,
		status: msg.status
	};
}

const handleIncomingMessage = async (upsert, client, cmds, store, user, state, runtime) => {
	for (let message of upsert.messages) {
		if (message.key.fromMe && message.status === 0) {
			const retryNode = await createRetryNode(message, failedMessages, MAX_RETRIES);

			if (retryNode) {
				try {
					await client.instance.relay(message.key.remoteJid, retryNode.message, { messageId: message.key.id });
				} catch (error) {
					console.error(`Error retrying message ${message.key.id}:`, error);
				}
			}
		}

		if (message === undefined || message?.messageStubParameters?.[0] === 'No SenderKeyRecord found for decryption') {
			return;
		}

		if (configuration.OPTIONS.test && message?.test) {
			message = {
				messages: [
					await generateWAMessage(
						client.instance.decodeJid(instance),
						{
							text: message.message
						},
						{
							upload: client.instance.waUploadToServer,
							messageId: randomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16)
						}
					)
				]
			};
		}

		if (!isInit) {
			await initHandler();
			isInit = true;
		}

		if (configuration.OPTIONS.debugMode && !message?.key?.fromMe) {
			log(JSON.stringify(message, undefined, 2));
		}

		if (message && 'messageStubParameters' in message && message.messageStubParameters?.length) {
			if (
				message.messageStubParameters[0] === 'Message absent from node' ||
				message.messageStubParameters[0] === 'No session found to decrypt message' ||
				message.messageStubParameters[0] === 'No session record' ||
				message.messageStubParameters[0] === 'Bad MAC'
			) {
				return;
			}

			return handleStubMessage(client, message, store);
		}

		message = await reassign(message, client, store, state);

		if (
			!message ||
			'error' in message ||
			!message.message ||
			message.isBaileys ||
			message.type === 'protocolMessage' ||
			message.type === 'senderKeyDistributionMessage' ||
			!message.type
		) {
			return;
		}

		if (message.message.key && message.message.key.remoteJid === 'status@broadcast' && configuration.OPTIONS.story) {
			return handleStoryMessage(client, message);
		}

		if (configuration.OPTIONS.offline) {
			return handleOfflineMessage(client, message, cmds);
		}

		if (configuration.OPTIONS.autoRead && !configuration.OPTIONS.offline && !message.isBlocked && !message.isBanned) {
			client.instance.readMessages([message.message.key]);
		}

		if (message.isGroup) {
			handleAfk(client, message);
		}

		const isInputState = configuration.input.get(message.sender);

		if (isInputState) {
			const textLikeTypes = [
				'conversation',
				'extendedTextMessage',
				'templateButtonReplyMessage',
				'buttonsMessage',
				'buttonsResponseMessage',
				'listResponseMessage'
			];

			if (isInputState.expectedType.some((v) => textLikeTypes.includes(v)) && textLikeTypes.includes(message.type)) {
				const isCommand = message.isCmd;

				if (isCommand) {
					isInputState.resolve({ message: message.body, quoted: message.message, invalid: false, command: true });
				} else {
					isInputState.resolve({ message: message.body, quoted: message.message, invalid: false });
					return;
				}
			} else if (isInputState.expectedType.includes(message.type)) {
				isInputState.resolve({ message: message.message, quoted: message.message, invalid: false });
				return;
			} else {
				isInputState.resolve({ message: message.body, quoted: message.message, invalid: true });
				return;
			}
		}

		await handleCommandExecution(message, client, store, cmds, user, instance, runtime, state);
	}
};

const incomingHandler = handleIncomingMessage;

export default incomingHandler;
