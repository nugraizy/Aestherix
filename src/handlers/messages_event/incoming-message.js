import { findBestMatch } from 'string-similarity';
import { generateWAMessage } from '@adiwajshing/baileys';

import configuration from '../../helper/config/connect.js';
import { runtime } from '../../index.js';
import { Limit, checkAfk, deleteAfk, getAfk, reassign } from '../../helper/index.js';
import { color, getTimeSince, loggers, randomChar } from '../../utils/modules/index.js';
import { Cache } from '../../helper/modules/cache.js';

const handler = new Cache();

const log = console.log;

let isInit = false;

let STATS_OFFLINE = true;
const EVALY = ['/>', '$>', '=>', '!>'];
const SEPERATOR = color('ヽ', '#50FA7B');
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

const logMessage = (message) => {
	const senderInfo = `${color(message.pushname, 'white')} ${SEPERATOR} ${color(message.prettyNumber, '#BD93F9')}`;
	const messageBody = color(message.query?.replace(/[\t\n]/g, ' ').substring(0, 35), 'white');
	const typeInfo = `${SEPERATOR} ${color('type', '#BD93F9')} ${color(message.type, 'white')}`;
	const runtimeInfo = `${SEPERATOR} ${color(((Date.now() - runtime) / 1000).toFixed(0), '#F1FA8C')}${color('s', '#f5e700')}`;

	let fullBody = null;

	if (message.isCmd && message.isEval) {
		fullBody = `${color(message.cmd, '#BD93F9')} ${messageBody}`;
	} else if (message.isCmd && !message.isEval) {
		fullBody = `${color(message.prefix, '#BD93F9')}${color(message.cmd, '#BDE0FE')} ${messageBody}`;
	} else {
		fullBody = color(message.body?.substring(0, 20).replace(/[\t\n]/g, ' '), 'white');
	}

	loggers.INF(`${senderInfo} ${SEPERATOR}`, fullBody, typeInfo, runtimeInfo);
};

const handleStubMessage = async (client, message, store) => {
	await handler.get('STUBTYPE')(client, message.messages[0], store);
};

const handleStoryMessage = async (client, message) => {
	await handler.get('STORY')(client, message);
};

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
	let caption = 'You are Tagging People That Are AFK.'.formatHeaders() + '\n\n';
	const container = [];

	if (message.message.key.fromMe) {
		return;
	}

	for (const mention of message.mention) {
		if (checkAfk(mention, message.from)) {
			const { reasons, since, name } = getAfk(mention, message.from);
			const time = getTimeSince(since);

			caption += `${name}\nSince : ${time} ago.\nReason : ${reasons}\n\n`;
			container.push(mention);
		}
	}

	if (container.length) {
		client.instance.reply(caption.trim(), {
			groupMetadata: message.groupMetadata,
			from: message.from,
			quoted: message.message
		});
	}
};

const handleAIMessage = async (message, client) => {
	await handler.get('AI')(message, client);
};

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
	let bodies = [];

	if (configuration.OPTIONS.multiCmd) {
		bodies = EVALY.includes(message.cmd) ? [message.body] : message.body.split('|');
	} else {
		bodies.push(message.body);
	}

	for (const body of bodies) {
		message.body = body.trim();
		message.args = message.body.split(/ +/g);
		message.cmd = message.args?.[0].toLowerCase() || '';
		let prefix = configuration.cache.prf;

		if (configuration.cache.prefixMode === 'multi_prefix') {
			prefix = configuration.cache.prefixReg.test(message.cmd)
				? message.cmd.match(new RegExp(configuration.cache.prefixReg, 'gi'))[0]
				: '-';
		}

		message.isEval = EVALY.includes(message.args[0]);

		message.isCmd = message.body.startsWith(prefix);
		message.cmd = message.isEval ? message.args[0] : message.isCmd ? message.cmd : '';
		message.query = message.args.slice(1).join(' ').trim();
		let correctedCommand = null;
		let correctedAliases = null;

		check: if (message.isCmd && configuration.OPTIONS.autoCorrect) {
			const prf = message.prefix;

			if (message.isEval) {
				break check;
			}

			const tempCmd = message.isEval ? message.cmd.slice(1).trim().toLowerCase() : message.cmd.slice(1).trim().toLowerCase();
			const cmdMatch = findBestMatch(tempCmd, cmds.commands.keys());

			if (cmdMatch.bestMatch.rating >= 0.6) {
				correctedCommand = prf + cmdMatch.bestMatch.target;
				message.cmd = correctedCommand || correctedAliases || '';
			} else {
				const aliasMatch = findBestMatch(tempCmd, cmds.aliases);

				if (aliasMatch.bestMatch.rating >= 0.57) {
					correctedAliases = prf + aliasMatch.bestMatch.target;
					message.cmd = correctedCommand || correctedAliases || '';
				}
			}

			message.cmd = message.cmd.slice(1).toLowerCase();
		} else if (message.isCmd && !configuration.OPTIONS.autoCorrect) {
			if (message.isEval) {
				break check;
			}

			message.cmd = message.cmd.slice(1).toLowerCase();
		}

		const commands = cmds.commands.values().values;

		/**
		 * @type {import('../../types/Commands/index.js').CommandProps}
		 */
		const Tempcmds = cmds.commands.get(message.cmd) || commands.find((v) => v.aliases?.includes(message.cmd)) || false;

		if (!configuration.OPTIONS.noLogs) {
			logMessage(message, runtime);
		}

		if (!Tempcmds && !message.isGroup && configuration.OPTIONS.ai) {
			await handleAIMessage(message, client);
			return;
		}

		if (!Tempcmds) {
			await handleGames(message, client);
		}

		if (Tempcmds && !message.isOwner) {
			if (configuration.OPTIONS.selfMode) {
				continue;
			}

			if (message.isBanned) {
				await client.instance.send(
					message.from,
					{ react: { text: '🖕🏼', key: message.message.key } },
					{ groupMetadata: message.groupMetadata }
				);
				continue;
			}

			if (Tempcmds.category === 'Owner' && !message.isOwner) {
				await client.instance.reply('This commands is only for owner.', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				continue;
			}

			if (configuration.OPTIONS.restrict && Tempcmds.restrict) {
				await client.instance.reply('This command is restricted and currently bot are on restricted mode.', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				continue;
			}

			if (
				Tempcmds.category === 'Games' &&
				message.isGroup &&
				!message.isAdmin &&
				!message.isOwner &&
				message?.[message?.from]?.games === 'disable'
			) {
				await client.instance.reply('Game Mode is Disabled. Type !games enable to enable Game Mode', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				continue;
			}

			if (Tempcmds.category === 'Moderation' && message.isGroup && !message.isAdmin && !message.isOwner) {
				await client.instance.reply('You are not admin. This commands is only for admins.', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				continue;
			}

			if (Tempcmds.category === 'Moderation' && !message.isGroup) {
				await client.instance.reply('This commands for group only', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
				continue;
			}

			let userRole = Limit.checkRole(message.sender);

			if (Tempcmds.premium && !(userRole.role === 'PREMIUM' || userRole.role === 'OWNER')) {
				if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|H)$/i.test(message.args[1]) && Tempcmds.name !== 'eval') {
					const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
						Tempcmds.cooldown
					}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.\nThis Features Only for Premium users.`;

					client.instance.reply(help, {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});

					continue;
				}

				await client.instance.reply('This commands is only for premium user.', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});

				continue;
			}

			if (!configuration.OPTIONS.noLimit) {
				const isExist = Limit.checkExist(message.sender);

				if (!isExist) {
					const { role } = Limit.checkRole(message.sender);

					if (!(role === 'OWNER' || role === 'PREMIUM')) {
						Limit.upsert(message.sender, 0, role);
					}
				}

				const limit = Limit.reduceLimit(message.sender, Tempcmds.limit);

				if (limit.error) {
					client.instance.reply(limit.message.replace('%s', `But this command (${Tempcmds.name}) need ${Tempcmds.limit}`), {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});
					continue;
				}
			}

			const cooldownEnabled = configuration.OPTIONS.coolDown;

			if (cooldownEnabled) {
				const cooldownUser = user.cooldown.get(message.sender) || new Cache();
				const isCooldown = cooldownUser.requests;

				if (isCooldown) {
					await client.instance.reply('Please wait until your request is done', {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});
					continue;
				}

				const commandName = Tempcmds.name;
				const cooldownTime = cooldownUser.get(commandName);

				if (cooldownTime && Date.now() < cooldownTime) {
					await client.instance.reply(
						`${commandName} is on cooldown for ${((cooldownTime - Date.now()) / 1000).toFixed(1)} seconds.`,
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message }
					);
					continue;
				}

				cooldownUser.set(commandName, Date.now() + Tempcmds.cooldown * 1000);
				cooldownUser.requests = true;
				user.cooldown.set(message.sender, cooldownUser);
			}
		}

		if (
			Tempcmds &&
			(configuration.OPTIONS.onlyLogs
				? message.cmd.startsWith('==>') || message.cmd.startsWith('//>') || message.cmd.startsWith('$$>')
					? true
					: false
				: true)
		) {
			if (!message.isOwner && configuration.OPTIONS.selfMode) {
				continue;
			}

			const cooldownUser = user.cooldown.get(message.sender);

			try {
				if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|H)$/i.test(message.args[1]) && Tempcmds.name !== 'eval') {
					const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
						Tempcmds.cooldown
					}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.`;

					client.instance.reply(help, {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});

					if (cooldownUser?.requests) {
						cooldownUser.requests = false;
					}

					continue;
				}

				await Tempcmds.run({ ...message, state }, client, store);

				if (cooldownUser?.requests) {
					cooldownUser.requests = false;
				}
			} catch (err) {
				if (cooldownUser?.requests) {
					cooldownUser.requests = false;
				}

				const builder = new client.instance.TemplateBuilder.Native(client);

				let str = !message.isOwner ? 'Please send this error stack to the owner :\n\n' : '\n';

				str += `Type : ${err.name || 'Unknown'}\n`;
				str += `Message : ${err.message || 'Unknown'}\n`;
				str += `Stack Trace :\n${(message.isOwner ? err?.stack : err?.stack?.substring(0, 20)) || 'Unknown'}`;

				builder
					.mainBody('Something went wrong.')
					.mainFooter(str)
					.mainHeader('Header')
					.buttons(
						builder.button.url({
							display: 'GitHub User!',
							url: 'https://github.com/nugraizy'
						}),
						(message.isOwner && {}) ||
							builder.button.url({
								display: 'Report to Owner',
								url: `https://wa.me/${message.settings.owner_number}?text=hi,%20bot%20mengalami%20error${encodeURI(
									`\n\n${err.stack}`
								)}`
							}),
						(message.isOwner && {}) ||
							builder.button.reply({
								display: 'Report via Bot',
								id: `.report ${err.stack}`
							}),
						builder.button.copy({
							code: `https://www.whatsapp.com/otp/copy/${err.stack}`,
							display: 'Copy Stack Trace'
						})
					);

				const messageBuilt = await builder.render();

				await client.instance.relayMessage(message.from, messageBuilt.message, { messageId: messageBuilt.key.id });

				loggers.ERR(color(err.message, 'white'));
				const parseErr = (
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
							const formattedStackEntry = `${color(stackEntry.replace(fullMatch, ''), 'white')}(${color(text, '#BD93F9')})`;

							return formattedStackEntry.replace('\n', '') + '\n';
						} else {
							return stackEntry.trim();
						}
					})
					.join(`${color('❯ ', '#6272A4') + color('at ', '#BD93F9')}`);

				parseErr && loggers.ERR(parseErr);
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
			{ groupMetadata: message.groupMetadata, quoted: message.message }
		);
		deleteAfk(message.sender, message.from);
	}

	if (message.bodyQuoted && checkAfk(message.mediaData.participant, message.from)) {
		const { reasons, since, name } = getAfk(message.mediaData.participant);
		const time = getTimeSince(since);

		client.instance.reply(`${name} is AFK since ${time} ago. Reason: ${reasons}`, {
			groupMetadata: message.groupMetadata,
			from: message.from,
			quoted: message.message
		});
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

const handleIncomingMessage = async (message, client, cmds, store, user, state, runtime) => {
	if (message === undefined) {
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

	if (configuration.OPTIONS.debugMode && !message?.messages?.[0]?.key?.fromMe) {
		log(JSON.stringify(message, undefined, 2));
	}

	if (
		message.messages[0] &&
		'messageStubParameters' in message.messages[0] &&
		message.messages[0]?.messageStubParameters?.length
	) {
		return handleStubMessage(client, message, store);
	}

	message = await reassign(message.messages[0], client, store);

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
		if (isInputState.expectedType.some((v) => ['conversation', 'extendedTextMessage'].includes(v))) {
			isInputState.message = message.body;
			isInputState.quoted = message.message;
			return;
		}

		if (isInputState.expectedType.includes(message.type)) {
			isInputState.message = message.message;
			isInputState.quoted = message.message;
			return;
		}

		isInputState.invalid = true;
		isInputState.quoted = message.message;

		return;
	}

	await handleCommandExecution(message, client, store, cmds, user, instance, runtime, state);
};

const incomingHandler = handleIncomingMessage;

export default incomingHandler;
