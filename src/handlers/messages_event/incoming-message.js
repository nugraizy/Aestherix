import dayjs from 'dayjs';
import similarity from 'string-similarity';

import configuration from '../../helper/config/connect.js';
import { runtime } from '../../index.js';
import { addLimit, checkAfk, deleteAfk, getAfk, reassign } from '../../helper/index.js';
import { color, getTimeSince, INFOLOG } from '../../utils/modules/index.js';

const log = console.log;

let STATS_OFFLINE = true;
const EVALY = ['/>', '$>', '=>', '!>'];

const handler = new Map();
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

const handlers = async (message, client, cmds, store, user, state) => {
	if (message === undefined) {
		return;
	}

	if (configuration.OPTIONS.debugMode && !message?.messages?.[0]?.key?.fromMe) {
		log(JSON.stringify(message, undefined, 2));
	}

	const time = dayjs().format('HH:mm:ss DD/MM');

	if (message.messages[0] && 'messageStubParameters' in message.messages[0]) {
		if (!handler.has('stubType')) {
			handler.set('stubType', (await import(path.stubType)).default);
		}

		return handler.get('stubType')(client, message.messages[0], store);
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
		if (!handler.has('story')) {
			handler.set('story', (await import(path.story)).default);
		}

		return handler.get('story')(client, message);
	}

	if (configuration.OPTIONS.offline) {
		if (STATS_OFFLINE) {
			await cmds.commands
				.get('simulates')
				.run(
					{ args: ['.simulates', 'online', 'disable'], isOwner: true, from: false, message: message.message },
					client,
					store
				);
			STATS_OFFLINE = false;
		}

		if (!handler.has('offline')) {
			handler.set('offline', (await import(path.offline)).default);
		}

		return handler.get('offline')(client, message);
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

			client[botNum].reply(
				{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
				`${name} is AFK since ${time} ago. Reason: ${reasons}`
			);
		}

		if (message.mention?.length > 0) {
			let caption = "You're Tagging People That Are AFK.\n\n"; /* eslint-disable-line */
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
				client[botNum].reply(
					{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
					caption.trim()
				);
			}
		}
	}

	const runtimes = ((Date.now() - runtime) / 1000).toFixed(0);

	if (message.isCmd && message.from !== 'status@broadcast') {
		let bodies = [];

		if (configuration.OPTIONS.multiCmd) {
			bodies = EVALY.includes(message.cmd) ? [message.body] : message.body.split('|');
		} else {
			bodies.push(message.body);
		}

		for (const body of bodies) {
			message.body = body.trim();
			message.args = message.body.split(/ +/g);
			message.cmd = message.body.toLowerCase().split(' ')[0].trim() || '';
			message.query = message.args.slice(1).join(' ').trim();
			const correctedCommand = [];

			if (configuration.OPTIONS.autoCorrect) {
				Array.from(cmds.commands.keys()).forEach((cmd) => {
					const correcting = similarity.compareTwoStrings(message.args[0], cmd);

					if (correcting >= Math.min(0.6)) {
						correctedCommand.push({
							score: correcting,
							command: cmd
						});
					}
				});

				cmds.aliases.forEach((aliases) => {
					const correcting = similarity.compareTwoStrings(message.args[0], aliases);

					if (correcting >= Math.min(0.57)) {
						correctedCommand.push({
							score: correcting,
							command: aliases
						});
					}
				});
			}

			if (correctedCommand.length != 0) {
				const HIGH_SCORE = correctedCommand.find(
					(x) =>
						Math.max.apply(
							null,
							correctedCommand.map((x) => x.score)
						) === x.score
				);

				message.cmd = message.prefix + HIGH_SCORE.command.toLowerCase().split(' ')[0].trim() || '';
			}

			const commands = Array.from(cmds.commands.values());

			const Tempcmds =
				cmds.commands.get(message.cmd.slice(1).trim().toLowerCase()) ||
				commands.find((v) => v.aliases.includes(message.cmd.slice(1).trim().toLowerCase())) ||
				commands.find((v) => v.aliases.includes(message.cmd.trim().toLowerCase())) ||
				false;

			if (message.isGroup && !configuration.OPTIONS.noLogs) {
				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color(message.pushname.trim(), 'white')} ${color(message.prettyNumber, '#ff71ce')} :`,
					`${color(message.prefix, 'white')}${color(Tempcmds.name || message.cmd.slice(1).trim(), '#01cdfe')}`,
					`${color(message.query.substr(0, 20), '#05ffa1')}`,
					`${color(message.from, '#b967ff')}`,
					`${color('type', '#ff71ce')} : ${color(message.type, '#b967ff')}`,
					`${color(runtimes, '#f18f15')}${color('s', '#f5e700')}`
				);
			} else if (!message.isGroup && !configuration.OPTIONS.noLogs) {
				INFOLOG(
					`[${color(time, 'cyan')}]`,
					`${color(message.pushname.trim(), 'white')} ${color(message.prettyNumber, '#ff71ce')} :`,
					`${color(message.prefix, 'white')}${color(Tempcmds.name || message.cmd.slice(1).trim(), '#01cdfe')}`,
					`${color(message.query.trim().substr(0, 20), '#05ffa1')}`,
					`${color('type', '#ff71ce')} : ${color(message.type, '#b967ff')}`,
					`${color(runtimes, '#f18f15')}${color('s', '#f5e700')}`
				);
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
					await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'This command is restricted and currently bot are on restricted mode.'
					);
					continue;
				}

				if (
					Tempcmds.category === 'Games' &&
					message.isGroup &&
					!message.isAdmin &&
					!message.isOwner &&
					message?.[message?.from]?.games === 'disable'
				) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'Game Mode is Disabled. Type !games enable to enable Game Mode'
					);
				}

				if (Tempcmds.category === 'Moderation' && message.isGroup && !message.isAdmin && !message.isOwner) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'You are not Admin'
					);
				}

				if (Tempcmds.category === 'Moderation' && !message.isGroup) {
					return await client[botNum].reply(
						{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
						'This commands for group only'
					);
				}

				if (!configuration.OPTIONS.noLimit) {
					const limit = addLimit({ id: message.sender, limit: Tempcmds.limit ?? 0, type: 'MIN' });

					if (typeof limit === 'object' && 'message' in limit) {
						client[botNum].reply(
							{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
							`${limit.message}\nYour limit is ${limit.limits}\nBut this command (${Tempcmds.name}) need ${Tempcmds.limit}`
						);
						continue;
					}

					if (!limit) {
						return await client[botNum].reply(
							{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
							'You have reached the limit of this command.'
						);
					}
				}

				if (configuration.OPTIONS.coolDown) {
					if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).requests) {
						return await client[botNum].reply(
							{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
							'Please wait until your request is done'
						);
					}

					if (user.cooldown.has(message.sender) && user.cooldown.get(message.sender).has(Tempcmds.name)) {
						const time = user.cooldown.get(message.sender).get(Tempcmds.name);

						if (Date.now() > time) {
							user.cooldown.get(message.sender).delete(Tempcmds.name);
							user.cooldown.get(message.sender).requests = false;
						} else {
							return await client[botNum].reply(
								{ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message },
								`${Tempcmds.name} is on cooldown for ${((time - Date.now()) / 1000).toFixed(1)} seconds.`
							);
						}
					}

					if (!user.cooldown.has(message.sender)) {
						user.cooldown.set(message.sender, new Map());
					}

					if (!user.cooldown.get(message.sender).has(Tempcmds.name)) {
						user.cooldown.get(message.sender).set(Tempcmds.name, Date.now() + Tempcmds.cooldown * 1000);
					}

					user.cooldown.get(message.sender).get(Tempcmds.name);
					user.cooldown.get(message.sender).requests = true;
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

				try {
					if (/-{1,2}((help(s)?|info|des(c|k)rip(t|s)i(on)?)|H)$/i.test(message.args[1]) && Tempcmds.name !== 'eval') {
						const help = `Description : ${Tempcmds.description}\nUsage : ${Tempcmds.usage}\nCooldown : ${
							Tempcmds.cooldown
						}s\nAliases : ${Tempcmds.aliases.map((v) => `!${v}`).join(', ')}.`;

						client[botNum].reply({ groupMetadata: message.groupMetadata, from: message.from, quoted: message.message }, help);

						if (user.cooldown.get(message.sender)?.requests) {
							user.cooldown.get(message.sender).requests = false;
						}

						continue;
					}

					await Tempcmds.run({ ...message, state }, client, store);

					if (user.cooldown.get(message.sender)?.requests) {
						user.cooldown.get(message.sender).requests = false;
					}
				} catch (err) {
					if (user.cooldown.get(message.sender)?.requests) {
						user.cooldown.get(message.sender).requests = false;
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
					console.error(err);
				}
			}
		}

		return;
	}

	if (!message.isGroup && !configuration.OPTIONS.noLogs) {
		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color(message.pushname.trim(), 'white')} ${color(message.prettyNumber, '#ff71ce')} :`,
			`${color(message.body?.trim()?.replace('\n', '')?.substr(0, 20), '#05ffa1')}`,
			`${color('type', '#ff71ce')} : ${color(message.type, '#b967ff')}`,
			`${color(runtimes, '#f18f15')}${color('s', '#f5e700')}`
		);
	} else if (message.isGroup && !configuration.OPTIONS.noLogs) {
		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color(message.pushname.trim(), 'white')} ${color(message.prettyNumber, '#ff71ce')} :`,
			`${color(message.body?.trim()?.replace('\n', '')?.substr(0, 20), '#05ffa1')}`,
			`${color(message.from, '#b967ff')}`,
			`${color('type', '#ff71ce')} : ${color(message.type, '#b967ff')}`,
			`${color(runtimes, '#f18f15')}${color('s', '#f5e700')}`
		);
	}

	if (message.isBanned || message.isBlocked) {
		return;
	}

	if (!handler.has('akinator')) {
		handler.set('akinator', (await import(path.akinator)).default);
	} else if (!handler.has('tebakGambar')) {
		handler.set('tebakGambar', (await import(path.tebakGambar)).default);
	} else if (!handler.has('sambungKata')) {
		handler.set('sambungKata', (await import(path.sambungKata)).default);
	} else if (!handler.has('wordle')) {
		handler.set('wordle', (await import(path.wordle)).default);
	} else if (!handler.has('anonymous')) {
		handler.set('anonymous', (await import(path.anonymous)).default);
	} else if (!handler.has('groupUrl')) {
		handler.set('groupUrl', (await import(path.groupUrl)).default);
	} else if (!handler.has('antiNsfw')) {
		handler.set('antiNsfw', (await import(path.antiNsfw)).default);
	}

	await Promise.all(
		Array.from(handler.keys())
			.filter((v) => !['stubType', 'story', 'offline'].includes(v))
			.map((v) => handler.get(v)(message, client, message))
	);
};

const incomingHandler = handlers;

export default incomingHandler;
