import dayjs from 'dayjs';
import { findBestMatch } from 'string-similarity';

import configuration from '../../helper/config/connect.js';
import { runtime } from '../../index.js';
import { Limit, checkAfk, deleteAfk, getAfk, reassign } from '../../helper/index.js';
import { color, getTimeSince, INFOLOG, ERRLOG } from '../../utils/modules/index.js';
import { Cache } from '../../helper/modules/cache.js';

const log = console.log;

let STATS_OFFLINE = true;
const EVALY = ['/>', '$>', '=>', '!>'];

const handler = new Cache();
const path = {
	stubType: './stub-message.js',
	story: './story-message.js',
	offline: './offline-message.js',
	akinator: '../game_handlers/akinator.js',
	tebakGambar: '../game_handlers/tebak-gambar.js',
	sambungKata: '../game_handlers/sambung-kata.js',
	wordle: '../game_handlers/wordle.js',
	anonymous: './anonymous-message.js',
	groupUrl: '../misc/group-url.js',
	antiNsfw: '../misc/anti-nsfw.js'
};

const logMessage = (message, time) => {
	const senderInfo = `${color(message.pushname, 'white')} ${color(message.prettyNumber, '#ff71ce')}`;
	const messageBody = `${color(message.query?.replace(/\\\n/g, ' - '), '#05ffa1')}`;
	const typeInfo = `${color('type', '#ff71ce')} : ${color(message.type, '#b967ff')}`;
	const runtimeInfo = `${color(((Date.now() - runtime) / 1000).toFixed(0), '#f18f15')}${color('s', '#f5e700')}`;

	const fullBody = message.isCmd
		? `${color(message.prefix, 'white')}${color(message.cmd.slice(1), '#01cdfe')} ${messageBody.substring(0, 20)}`.trim()
		: color(message.body?.substring(0, 20), 'white');

	INFOLOG(`[${color(time, 'cyan')}]`, `${senderInfo} :`, fullBody, typeInfo, runtimeInfo);
};

const handleStubMessage = async (client, message, store) => {
	if (!handler.has('stubType')) {
		handler.set('stubType', (await import(path.stubType)).default);
	}

	return handler.get('stubType')(client, message.messages[0], store);
};

const handleStoryMessage = async (client, message) => {
	if (!handler.has('story')) {
		handler.set('story', (await import(path.story)).default);
	}

	return handler.get('story')(client, message);
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

	if (!handler.has('offline')) {
		handler.set('offline', (await import(path.offline)).default);
	}

	return handler.get('offline')(client, message);
};

const handleMentionedAfkUsers = (message, client, botNum) => {
	let caption = 'You are Tagging People That Are AFK.\n\n';
	const container = [];

	for (const mention of message.mention) {
		if (checkAfk(mention, message.from)) {
			const { reasons, since, name } = getAfk(mention, message.from);
			const time = getTimeSince(since);

			caption += `${name}\nSince : ${time} ago.\nReason : ${reasons}\n\n`;
			container.push(mention);
		}
	}

	if (container.length > 0) {
		client[botNum].reply(caption.trim(), {
			groupMetadata: message.groupMetadata,
			from: message.from,
			quoted: message.message
		});
	}
};

/**
 *
 * @param {import('../../types/Reconstruct').ReassignResult} message
 * @param {typeof client} client
 * @param {import('../../types/Socket').Store} store
 * @param {import('../../types/Socket/config.js').GlobalConfig['cmds']} cmds
 * @param {import('../../types/Socket/config.js').GlobalConfig['user']} user
 * @param {typeof globalThis['botNum']} botNum
 * @param {string} runtime
 * @param {import('../../types/Socket').SingleAuthState['state']} state
 * @returns
 */
const handleCommandExecution = async (message, client, store, cmds, user, botNum, runtime, state) => {
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
				? message.cmd.match(new RegExp(configuration.cache.prefixReg, 'gi'))
				: '-';
		}

		message.isCmd = message.body.startsWith(prefix);
		message.cmd = message.isCmd ? message.cmd : '';
		message.query = message.args.slice(1).join(' ').trim();
		let correctedCommand = null;
		let correctedAliases = null;

		if (configuration.OPTIONS.autoCorrect) {
			const prf = message.prefix;
			const cmdMatch = findBestMatch(message.args[0], cmds.commands.keys());
			const aliasMatch = findBestMatch(message.args[0], cmds.aliases);

			if (cmdMatch.ratings >= 0.6) {
				correctedCommand = prf + cmdMatch.target;
			} else if (aliasMatch.ratings >= 0.57) {
				correctedAliases = prf + aliasMatch.target;
			}

			message.cmd = correctedCommand || correctedAliases || '';
		}

		const commands = cmds.commands.values().values;

		const Tempcmds =
			cmds.commands.get(message.cmd.slice(1).trim().toLowerCase()) ||
			commands.find(
				(v) =>
					v.aliases?.includes(message.cmd.slice(1).trim().toLowerCase()) ||
					v.aliases?.includes(message.cmd.trim().toLowerCase())
			) ||
			false;

		if (message.isGroup && !configuration.OPTIONS.noLogs) {
			logMessage(message, runtime);
		} else if (!message.isGroup && !configuration.OPTIONS.noLogs) {
			logMessage(message, runtime);
		}

		if (Tempcmds && !message.isOwner) {
			if (configuration.OPTIONS.selfMode) {
				return;
			}

			if (message.isBanned) {
				await client[botNum].send(
					message.from,
					{ react: { text: '🖕🏼', key: message.message.key } },
					{ groupMetadata: message.groupMetadata }
				);
				continue;
			}

			if (configuration.OPTIONS.restrict && Tempcmds.restrict) {
				await client[botNum].reply('This command is restricted and currently bot are on restricted mode.', {
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
				return await client[botNum].reply('Game Mode is Disabled. Type !games enable to enable Game Mode', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
			}

			if (Tempcmds.category === 'Moderation' && message.isGroup && !message.isAdmin && !message.isOwner) {
				return await client[botNum].reply('You are not admin. This commands is only for admins.', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
			}

			if (Tempcmds.category === 'Moderation' && !message.isGroup) {
				return await client[botNum].reply('This commands for group only', {
					groupMetadata: message.groupMetadata,
					from: message.from,
					quoted: message.message
				});
			}

			if (!configuration.OPTIONS.noLimit) {
				const isExist = Limit.checkExist(message.sender);

				if (!isExist) {
					const { role } = Limit.checkRole(message.sender);

					if (!(role === 'OWNER' || role === 'PREMIUM')) {
						Limit.upsert(message.sender, 0, 'USER');
					}
				}

				const limit = Limit.reduceLimit(message.sender, Tempcmds.limit);

				if (limit.error) {
					client[botNum].reply(limit.message.replace('%s', `But this command (${Tempcmds.name}) need ${Tempcmds.limit}`), {
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
					return await client[botNum].reply('Please wait until your request is done', {
						groupMetadata: message.groupMetadata,
						from: message.from,
						quoted: message.message
					});
				}

				const commandName = Tempcmds.name;
				const cooldownTime = cooldownUser.get(commandName);

				if (cooldownTime && Date.now() < cooldownTime) {
					return await client[botNum].reply(
						`${commandName} is on cooldown for ${((cooldownTime - Date.now()) / 1000).toFixed(1)} seconds.`,
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message }
					);
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
				return;
			}

			const cooldownUser = user.cooldown.get(message.sender);

			try {
				if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|H)$/i.test(message.args[1]) && Tempcmds.name !== 'eval') {
					const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
						Tempcmds.cooldown
					}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.`;

					client[botNum].reply(help, {
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

				let str = 'Something went wrong.\n';

				str += !message.isOwner ? 'Please send this error stack to the owner :\n\n' : '\n';

				str += `Type : ${err.name || 'Unknown'}\n`;
				str += `Message : ${err.message || 'Unknown'}\n`;
				str += `Stack Trace : ${(message.isOwner ? err?.stack : err?.stack?.substring(0, 20)) || 'Unknown'}`;

				await client[botNum].send(
					message.from,
					{
						text: str,
						footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
						templateButtons: [
							{ urlButton: { displayText: 'Copy Stack Trace', url: `https://www.whatsapp.com/otp/copy/${err.stack}` } },
							(message.isOwner && {}) || {
								urlButton: {
									displayText: 'Report to Owner',
									url: `https://wa.me/${message.settings.owner_number}?text=hi,%20bot%20mengalami%20error${encodeURI(
										`\n\n${err.stack}`
									)}`
								}
							},
							(message.isOwner && {}) || { quickReplyButton: { displayText: 'Report via Bot', id: `.report ${err.stack}` } }
						],
						headerType: 1
					},
					{ groupMetadata: message.groupMetadata }
				);

				const time = dayjs().format('HH:mm:ss DD/MM');

				ERRLOG(`[${color(time, 'cyan')}]`, color(err.message, 'white'));
				ERRLOG(
					err.stack
						.split(err.name + ': ')[1]
						.replace(err.message + '\n', '')
						.split('    at ')
						.map((stackEntry) => {
							const regex = /\((.*?)\)/;
							const match = regex.exec(stackEntry);

							if (match) {
								const [fullMatch, text] = match;
								const formattedStackEntry = `${color(stackEntry.replace(fullMatch, ''), 'white')}(${color(text, '#ff71ce')})`;

								return formattedStackEntry.replace('\n', '') + '\n';
							} else {
								return stackEntry.trim();
							}
						})
						.join(`  ${color('> ', 'red') + color('at', '#ff71ce')} `)
				);
			}
		}
	}
};

const handleIncomingMessage = async (message, client, cmds, store, user, state) => {
	if (message === undefined) {
		return;
	}

	if (configuration.OPTIONS.debugMode && !message?.messages?.[0]?.key?.fromMe) {
		log(JSON.stringify(message, undefined, 2));
	}

	const time = dayjs().format('HH:mm:ss DD/MM');

	if (
		message.messages[0] &&
		'messageStubParameters' in message.messages[0] &&
		message.messages[0]?.messageStubParameters?.length > 0
	) {
		return handleStubMessage(client, message, store);
	}

	message = await reassign(message.messages[0], client, store, false);

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
		client[botNum].readMessages([message.message.key]);
	}

	if (message.isGroup) {
		if (checkAfk(message.sender, message.from)) {
			const { reasons, since } = getAfk(message.sender, message.from);
			const time = getTimeSince(since);

			client[botNum].send(
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

			client[botNum].reply(`${name} is AFK since ${time} ago. Reason: ${reasons}`, {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: message.message
			});
		}

		if (message.mention?.length > 0) {
			handleMentionedAfkUsers(message, client, botNum);
		}
	}

	handleCommandExecution(message, client, store, cmds, user, botNum, time, state);
};

const incomingHandler = handleIncomingMessage;

export default incomingHandler;
