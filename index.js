/* eslint-disable */
import baileys, { jidDecode } from '@adiwajshing/baileys';
import { Boom } from '@hapi/boom';
import center from 'center-align';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import meow from 'meow';
import dayjs from 'dayjs';
import localePlugins from 'dayjs/plugin/timezone.js';
import mqtt from 'mqtt';
import cron from 'node-cron';
import path from 'path';
import P from 'pino';
import { platform } from 'process';
import Spinnies from 'spinnies';
import { pathToFileURL } from 'url';

import configuration from './connect.js';
import { getSpinner } from './helper/misc/spinner/spinners.js';
import { S_WHATSAPP_NET } from './helper/misc/wa_data/index.js';
import { color, ERRLOG, INFOLOG, readJSON, romanize, writeJSON } from './helper/modules/functions.js';

let shouldWait = false;

console.clear();

dayjs.extend(localePlugins);
dayjs.tz.setDefault('Asia/Jakarta');

const { default: makeWASocket, DisconnectReason, makeInMemoryStore, useSingleFileAuthState, DEFAULT_CONNECTION_CONFIG } = baileys;
const moduleURL = new URL(import.meta.url);

export const __dirname = platform == 'win32' ? path.dirname(moduleURL.pathname).slice(1) : path.dirname(moduleURL.pathname);
const { stdout } = process;

const spinners = new Spinnies({ color: 'blue', succeedColor: 'green', failColor: 'redBright', spinner: getSpinner('dots') });

configuration.cli = parseCli();
configuration.OPTIONS = configuration.cli.flags;

const { OPTIONS, cli } = configuration; // backwards compatibility

const regexOption =
	'prefix,readOnly,autoRead,autoCorrect,restrict,onlyLogs,noLogs,selfMode,debugMode,multiCmd,rainbow,trace,help,watch,coolDown,noLoad,json,reset,story,offline,noCall,instaNotifier,limitReset,resetOnStart'.split(
		',',
	);

if (platform !== 'win32' && !OPTIONS.noLoad) {
	await printRandomAscii();
}

if (OPTIONS.reset) {
	const sessionName = `${cli.input[0] ?? 'Session-debug'}`;

	if (fs.existsSync(`./session/${sessionName}.json`)) {
		fs.unlinkSync(`./session/${sessionName}.json`);
	}

	if (fs.existsSync(`./media_files/connection_databases/${sessionName}.json`)) {
		fs.unlinkSync(`./media_files/connection_databases/${sessionName}.json`);
	}
}

if (OPTIONS.limitReset) {
	cron.schedule(
		'0 0 * * *',
		async () => {
			const time = dayjs().format('HH:mm:ss DD/MM');

			(await import('./helper/groups/settings/limit.js')).resetAllLimit();
			INFOLOG(`[${color(time, 'cyan')}]`, `${color("Sukses Reset User's Limit", 'white')}`);

			if (OPTIONS.resetOnStart) {
				await clearDBConnection();
			}
		},
		{
			timezone: 'Asia/Jakarta',
			scheduled: true,
		},
	);
}

const { state, saveState } = useSingleFileAuthState(`./session/${cli.input[0] ?? 'Session-debug'}.json`);

global.store = makeInMemoryStore({ logger: P().child({ level: 'fatal', stream: 'store' }) });

if (OPTIONS.json) {
	if (!fs.existsSync('./media_files/connection_databases/')) {
		fs.mkdirSync('./media_files/connection_databases/');
	}

	if (fs.existsSync(`./session/${cli.input[0] ?? 'Session-debug'}.json`)) {
		await clearDBConnection();
	}

	store.readFromFile(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);

	setInterval(() => {
		store.writeToFile(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	}, 2 * 1000);
}

export const runtime = Date.now();

for (const option of Object.keys(OPTIONS).filter((key) => OPTIONS[key] == true)) {
	if (!regexOption.includes(option)) {
		ERRLOG(` ${color(option, 'red')} ${color('is not a valid option', 'white')}`);
	}
}

if (!fs.existsSync('./temporary_files/')) {
	fs.mkdirSync('./temporary_files/');
}

const addSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.add(name, options);
	}
};
const successSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.succeed(name, options);
	}
};
const failSpinner = (name, options) => {
	if (!OPTIONS.noLoad) {
		spinners.fail(name, options);
	}
};

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

clientMqttListen.on('connect', () => {
	clientMqttListen.subscribe(process.env.MQTT_TOPIC, async (err) => {});
});

Number.prototype.toTime = function () {
	const minutes = Math.floor(this / 60_000);
	const seconds = ((this % 60_000) / 1000).toFixed(0);

	return seconds == 60 ? `${minutes + 1}:00` : `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

let isClosed = false;

const start = async () => {
	if (OPTIONS.help) {
		log(cli.help);
		process.exit(0);
	}

	const load = async () => {
		await loadCommands();
		await loadEveryCommand();
	};
	const CONNECTION_CONFIG = {
		printQRInTerminal: true,
		version: DEFAULT_CONNECTION_CONFIG.version,
		logger: P({ level: OPTIONS.trace ? 'trace' : OPTIONS.debugMode ? 'debug' : 'fatal' }),
		auth: state,
		markOnlineOnConnect: false,
		shouldSyncHistoryMessage: () => false,
		getMessage: async () => ({ conversation: 'Success syncing. Please resend the command again.' }),
		generateHighQualityLinkPreview: true,
		mediaCache: new Map(),
		userDevicesCache: false,
	};
	const Client = makeWASocket(CONNECTION_CONFIG);

	store.bind(Client.ev);

	Client.ev.on('connection.update', async ({ lastDisconnect, connection, receivedPendingNotifications }) => {
		try {
			if (connection == 'connecting') {
				addSpinner('Connecting', { text: 'Connecting to WASocket...' });
			}

			if (connection == 'close') {
				const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

				if (reason == DisconnectReason.badSession) {
					log('Bad session, Please delete your previous session and do a rescan...');
					process.exit(0);
				} else if (reason == DisconnectReason.loggedOut) {
					log('Logged out, Please delete your previous session and do a rescan...');
					process.exit(0);
				} else {
					if (reason == DisconnectReason.restartRequired) {
						log('Restart required, Restarting your WebScoket...');
					} else if (reason == DisconnectReason.timedOut) {
						log('Timed out, Quick reconnecting...');
					} else if (reason == DisconnectReason.connectionClosed) {
						log('Connection closed, Quick reconnecting...');
					} else if (reason == DisconnectReason.connectionReplaced) {
						log('Connection replaced, Quick reconnecting...');
					} else if (reason == DisconnectReason.connectionLost) {
						log('Connection lost, Quick reconnecting...');
					} else {
						log('Unknown reason, Quick reconnecting...');
					}

					reconnectMqttConnection(connectMqtt);
					await start().catch((e) => log(e));
				}
			} else if (connection == 'open') {
				if (!isClosed) {
					await load();
					isClosed = true;
				}

				configuration.isFirstConnection = true;

				if (receivedPendingNotifications == true) {
					shouldWait = true;
				}

				if (receivedPendingNotifications == false && shouldWait) {
					shouldWait = false;
				}

				if (!receivedPendingNotifications && !shouldWait) {
					global.client = {};
					global.botNum = Client.user.id;
					client[Client.user.id] = Client;
					(await import('./helper/modules/assignFunction.js')).assign(client);
					successSpinner('Connecting', { text: 'Connected to WASocket' });
					INFOLOG(color(center(`Bot Version  ${romanize(readJSON('./package.json').version)}\n\n`, stdout.columns), '#9f53ea'));

					connectEvent();
					clearDBConnection();
					connectMqtt();
				}
			}
		} catch (error) {
			log(error);
			reconnectMqttConnection(connectMqtt);
			await start().catch((e) => log(e));
		}
	});

	const connectEvent = () => {
		Client.ev.on('messages.upsert', async (message) => {
			const Handler = (await import('./handlers/messages_event/incomingMessage.js')).default.handler;

			Handler(message, client, configuration.cmds, store, configuration.user);
		});

		Client.ev.on('messages.update', async (message) => {
			if (message?.[0]?.update?.status == 4 || message?.[0]?.update?.status == 3) {
				return;
			}

			const Handler = (await import('./handlers/messages_event/deletedMessage.js')).default.handler;

			message = store.messages[message[0].key.remoteJid]?.get(message[0].key.id);
			Handler(client, message, false, store);
		});

		Client.ev.on('presence.update', async (presence) => {
			const from = presence.id;
			const participant = Object.keys(presence.presences)[0];
			const presences = presence.presences[participant].lastKnownPresence;

			if (presences == 'composing') {
				const Handler = (await import('./handlers/message_presence/composing.js')).default.handler;

				Handler(client, from, participant);
			}
		});

		Client.ev.on('call', async ([{ isGroup, status, id, from }]) => {
			if (OPTIONS.noCall && !isGroup && status == 'offer') {
				const { user, server } = jidDecode(botNum);

				await client[botNum].sendNode({
					tag: 'call',
					attrs: {
						from: `${user}@${server}`,
						to: from,
						id: client[botNum].generateMessageTag(),
					},
					content: [
						{
							tag: 'reject',
							attrs: {
								'call-id': id,
								'call-creator': from,
								count: '512202',
							},
							content: null,
						},
					],
				});
				await client[botNum].updateBlockStatus(from, 'block');
			}
		});

		Client.ev.on('group.participants.update', async (message) => {
			const Handler = (await import('./handlers/notification_handlers/participantsNotification.js')).default.handler;

			Handler(client, message, store);
		});

		Client.ev.on('group.settings.update', async (message) => {
			const Handler = (await import('./handlers/notification_handlers/groupSettingsNotification.js')).default.handler;

			Handler(client, message, store);
		});

		Client.ev.on('werewolf.cycle', async (update) => {
			if (update.time == 'day') {
				await client[botNum].sendMessage(update.id, { text: update.gameDialogue, mentions: update.peopleKilledMention });
			} else if (update.time == 'evening') {
				await client[botNum].sendMessage(update.id, {
					text: update.gameDialogue,
				});

				for (const id of update.playersData.filter((v) => !v.isAlive)) {
					client[botNum].sendMessage(id.id, {
						text: 'Karena kamu sudah mati, maka kamu hanya bisa menonton permainan saja',
					});
				}

				for (const id of update.playersData.filter((v) => v.isAlive)) {
					client[botNum].sendMessage(id.id, {
						title: 'Pilih salah satu dari pemain berikut untuk divoting',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						text: '\t',
						buttonText: 'Open List',
						sections: update.playersData
							.filter((v) => v.isAlive)
							.map((v) => ({ rows: [{ title: `VOTE ${v.name}`, rowId: `.ww vote ${v.id} ${update.id}` }], title: 'VOID BOT | Werewolf Games' })),
					});
				}
			} else if (update.time == 'voting') {
				await client[botNum].sendMessage(update.id, { text: update.gameDialogue, mentions: [update?.voteData?.voted] });

				if (update.isWinning) {
					return await client[botNum].sendMessage(update.id, { text: update.gameDialogue, mentions: update?.peopleMention });
				}

				await client[botNum].sendMessage(update.id, {
					text: `Statistic Pemain :

	Pemain : ${update.playersData.filter((v) => v.isAlive).length}/${update.playersData.length}

	${update.playersData
		.map((v) => {
			return v.isAlive ? `@${v.id.split('@')[0]} : 😄 Hidup` : `@${v.id.split('@')[0]} : 💀 Mati | ${v.role}`;
		})
		.join('\n')}`,
					mentions: update.playersData.map((v) => v.id),
				});
			} else if (update.time == 'dawn') {
				await client[botNum].sendMessage(update.id, { text: update.gameDialogue.replace('{0}', update.gameTime) });

				for (const { id, role, isAlive } of update.playersData) {
					if (isAlive) {
						if (role == 'werewolf') {
							client[botNum].sendMessage(id, {
								buttonText: 'Open list',
								footer: 'Made by Void Bot. Powered by Hidden Finder',
								title: 'Kamu adalah Serigala. Dan saat ini merupakan waktu yang tepat untuk membunuh seseorang.\nPilih salah satu player.',
								text: '\t',
								sections: update.playersData
									.filter((v) => v.isAlive)
									.map((v) => {
										return { rows: [{ title: `KILL ${v.name}`, rowId: `.ww kill ${v.id} ${update.id}` }], title: 'VOID BOT | Werewolf Games' };
									}),
							});
						} else if (role == 'seer') {
							client[botNum].sendMessage(id, {
								buttonText: 'Open list',
								footer: 'Made by Void Bot. Powered by Hidden Finder',
								text: '\t',
								title: 'Kamu adalah Penerawang. Dan saat ini merupakan waktu yang tepat untuk menerawang seseorang.\nPilih salah satu player.',
								sections: update.playersData
									.filter((v) => v.isAlive)
									.map((v, i) => {
										return { rows: [{ title: `TERAWANG ${update.playersData[i].name}`, rowId: `.ww seer ${update.playersData[i].id} ${update.id}` }], title: 'VOID BOT | Werewolf Games' };
									}),
							});
						} else if (role == 'guard') {
							client[botNum].sendMessage(id, {
								buttonText: 'Open list',
								title: 'Kamu adalah Penjaga. Dan saat ini merupakan waktu yang tepat untuk memjaga seseorang.\nPilih salah satu player.',
								footer: 'Made by Void Bot. Powered by Hidden Finder',
								text: '\t',
								sections: update.playersData
									.filter((v) => v.isAlive)
									.map((v, i) => {
										return { rows: [{ title: `JAGA ${update.playersData[i].name}`, rowId: `.ww guard ${update.playersData[i].id} ${update.id}` }], title: 'VOID BOT | Werewolf Games' };
									}),
							});
						} else if (role == 'villager') {
							client[botNum].sendMessage(id, { text: 'Kamu adalah Penduduk. Tunggu sampai pagi. Saat ini hanya pemain malam yang beraksi' });
						}
					}
				}
			} else if (update.time == 'night') {
				await client[botNum].sendMessage(update.id, { text: 'Aktifitas pemain malam dihentikan karena sudah mau pagi.' });
			} else if (update.time == 'failAfk') {
				await client[botNum].sendMessage(update.id, { text: update.message, mentions: update.playersData.map((v) => v.id) });
			} else if (update.time == 'voted') {
				await client[botNum].sendMessage(update.id, { text: update.text, mentions: update.mentions });
			}
		});

		Client.ws.on('CB:notification,type:w:gp2', (update) => {
			if (update?.content?.[0].tag !== 'description' && update?.content?.[0].tag !== 'invite') {
				return;
			}

			const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
			const name = update?.attrs?.notify;
			const action = update?.attrs?.content?.[0]?.tag || update?.content?.[0].tag;
			const content = update?.content?.[0]?.content?.[0]?.content?.toString() || update?.content?.[0]?.attrs.code || '';
			const participant = update?.attrs?.participant;

			client[botNum].ev.emit('group.settings.update', { from, name, action, participant, content });
		});

		Client.ws.on('CB:notification,type:picture', async (update) => {
			const from = update?.attrs?.from || update?.content?.[0]?.attrs?.author;
			const name = update?.attrs?.notify;
			const action = update?.content?.[0]?.tag;
			const participant = update?.content?.[0]?.attrs?.author;
			const content = action == 'delete' ? null : await client[botNum].profilePictureUrl(from, 'image').catch((e) => null);

			client[botNum].ev.emit('group.settings.update', { from, name, action, participant, content });
		});
	};

	function connectMqtt() {
		clientMqttListen.on('message', async (topic, message) => {
			message = message.toString();
			const data = JSON.parse(message);

			if (!data.status) {
				return;
			}

			const content = `Spotify On ${data.isPlaying ? 'Play' : 'Paused'} :                                                       ${data.artists || ''} - ${data.trackTitle || ''}  ( ${
				data.progressMs?.toTime() || '00'
			} - ${data?.durationMs?.toTime() || '00'} )`;
			const myStatus = await client[botNum].fetchStatus(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`);

			if (myStatus.status == content) {
				return;
			}

			await client[botNum].query({
				tag: 'iq',
				attrs: { to: S_WHATSAPP_NET, type: 'set', xmlns: 'status' },
				content: [{ tag: 'status', attrs: {}, content: Buffer.from(content, 'utf-8') }],
			});
		});
	}

	Client.ev.on('auth-state.update', saveState);

	Client.ev.on('contacts.update', () => {});

	Client.ev.on('groups.update', () => {});
};

start().catch((e) => log(e));

function loadFiles(dir) {
	let files = [];
	const list = fs.readdirSync(dir);

	for (const file of list) {
		const path = `${dir}/${file}`;
		const stat = fs.statSync(path);

		if (stat?.isDirectory()) {
			files = files.concat(loadFiles(path));
		} else {
			files.push(path);
		}
	}

	return files;
}

async function loadCommands() {
	addSpinner('files', { text: 'Loading Files...' });
	const commands = loadFiles('./commands');

	successSpinner('files', { text: `Loaded ${commands.length} files` });
	addSpinner('commands', { text: 'Loading Commands...' });

	if (OPTIONS.watch) {
		addSpinner('watch', { text: 'Watching for changes...' });
	}

	for (const command of commands) {
		try {
			const cmd = (await import(pathToFileURL(path.join(__dirname, command)))).default;

			if (cmd.status != 'disable') {
				if (OPTIONS.watch) {
					await watchFile(pathToFileURL(path.join(__dirname, command)), cmd.name);
				}

				const modules = process.platform == 'win32' ? pathToFileURL(path.join(__dirname, command)).pathname.slice(1) : pathToFileURL(path.join(__dirname, command)).pathname;

				configuration.cmds.commands.set(cmd.name, { ...cmd, pathname: decodeURI(modules) });
				configuration.commandsPath.push(decodeURI(modules));
			}
		} catch (e) {
			log(e);
			ERRLOG(`${color(command, 'red')} ${color('is causing error. Please check the file before running.', 'white')}`);
			process.exit(0);
		}
	}

	successSpinner('commands', { text: `Loaded ${configuration.cmds.commands.size} commands` });

	if (OPTIONS.watch) {
		successSpinner('watch', { text: `Watched ${configuration.cmds.commands.size} commands` });
	}
}

async function loadEveryCommand() {
	for (const command of configuration.cmds.commands) {
		for (const aliases of command[1].aliases) {
			configuration.cmds.aliases.push(aliases);
		}
	}
}

async function watchFile(module) {
	const modules = process.platform == 'win32' ? decodeURI(module.pathname.slice(1)) : decodeURI(module.pathname);

	fs.watchFile(module, async (event, filename) => {
		const time = dayjs().format('HH:mm:ss DD/MM');

		if (fs.existsSync(module)) {
			INFOLOG(`[${color(time, 'cyan')}]`, color(`${modules?.split('/')?.reverse()[0]} has been changed`, '#9f53ea'));
			await reloadModule(module, false);
		} else {
			await reloadModule(module, true, modules);
		}
	});
}

async function reloadModule(module, isNewFile, newFilePath) {
	if (isNewFile) {
		try {
			const time = dayjs().format('HH:mm:ss DD/MM');
			const commands = await new Promise(async (resolve) => {
				const files = (
					await Promise.all(
						loadFiles('./commands').map(async (v) => {
							const modules = process.platform == 'win32' ? decodeURI(pathToFileURL(v).pathname.slice(1)) : decodeURI(pathToFileURL(v).pathname);
							const module = (await import(pathToFileURL(modules))).default;

							return { ...module, pathname: modules };
						}),
					)
				)
					.filter((v) => v.status == 'enable')
					.map((v) => v.pathname);

				resolve(files);
			});
			let afterCommands;
			let renamedCommand;

			for (const commandModule of configuration.commandsPath) {
				let status = false;

				if (fs.existsSync(commandModule)) {
					status = true;
				}

				if (!status) {
					renamedCommand = commands.filter((v) => !configuration.commandsPath.includes(v))[0];
					afterCommands = commandModule;
					break;
				}
			}

			try {
				configuration.commandsPath.push(renamedCommand);
				configuration.commandsPath.splice(configuration.commandsPath.indexOf(afterCommands), 1);
				const cmd = (await import(pathToFileURL(renamedCommand))).default;

				configuration.cmds.commands.set(cmd.name, cmd);
				watchFile(pathToFileURL(renamedCommand), cmd.name);
				fs.unwatchFile(module);
			} catch (e) {
				log(e);
				configuration.commandsPath.splice(configuration.commandsPath.indexOf(newFilePath), 1);
				configuration.cmds.commands.delete(Array.from(configuration.cmds.commands.values()).find((v) => v.pathname == newFilePath).name);
				fs.unwatchFile(module);
				return ERRLOG(`[${color(time, 'cyan')}]`, color(`⚠️ ${newFilePath.split('/').reverse()[0]} is deleted`, 'red'));
			} finally {
				INFOLOG(`[${color(time, 'cyan')}]`, color(`${newFilePath.split('/').reverse()[0]} has been renamed to ${renamedCommand.split('/').reverse()[0]}`, '#9f53ea'));
			}
		} catch (e) {
			log(e);
		}
		return;
	}

	try {
		fs.unwatchFile(module);
		const cmd = (await nocache(module)).default;

		configuration.cmds.commands.delete(cmd.name);
		configuration.cmds.commands.set(cmd.name, cmd);
		watchFile(module);
	} catch (e) {
		log(e);
	}
}

const nocache = async (module) => {
	const tempModules = `${module}?update=${Date.now()}`;

	return await import(tempModules);
};

function parseCli() {
	return meow(help(), {
		importMeta: import.meta,
		flags: {
			read_only: { type: 'boolean', alias: 'y' },
			auto_read: { type: 'boolean', alias: 'r' },
			restrict: { type: 'boolean', alias: 'e' },
			only_logs: { type: 'boolean', alias: 'o' },
			no_logs: { type: 'boolean', alias: 'n' },
			self_mode: { type: 'boolean', alias: 's' },
			debug_mode: { type: 'boolean', alias: 'g' },
			multi_cmd: { type: 'boolean', alias: 'm' },
			rainbow: { type: 'boolean', alias: 'b' },
			trace: { type: 'boolean', alias: 't' },
			help: { type: 'boolean', alias: 'h' },
			prefix: { type: 'string', alias: 'p' },
			watch: { type: 'boolean', alias: 'w' },
			cool_down: { type: 'boolean', alias: 'c' },
			auto_correct: { type: 'boolean', alias: 'a' },
			no_load: { type: 'boolean', alias: 'v' },
			json: { type: 'boolean', alias: 'j' },
			reset: { type: 'boolean', alias: 'k' },
			story: { type: 'boolean', alias: 'q' },
			offline: { type: 'boolean', alias: 'f' },
			no_call: { type: 'boolean', alias: 'd' },
			insta_notifier: { type: 'boolean', alias: 'i' },
			limit_reset: { type: 'boolean', alias: 'l' },
			reset_on_start: { type: 'boolean', alias: 'x' },
		},
	});
}

async function printRandomAscii() {
	const randomAscii = fs.readdirSync('./helper/ascii/');

	spawn('bash', [`./helper/ascii/${randomAscii[Math.floor(Math.random() * randomAscii.length)]}`], {
		stdio: 'inherit',
	});
}

function help() {
	return `
	 Usage
	   $ node . <session> <options>

	 Options
	   --prefix, -p          Set your custom prefix.
	   --read_only, -y       Read only.
	   --auto_read, -r       Auto read every incoming message.
	   --restrict, -e        Restrict every moderator commands.
	   --only_logs, -o       Only showing logs but will ignore every message and commands.
	   --no_logs, -n         Not showing any logs in the meantime still respond for any commands.
	   --self_mode, -s       Set self mode that only owner and the bot can use.
	   --debug_mode, -g      Show every metadata of any message.
	   --multi_cmd, -m       Loop every command on your script. Use | to seperate each commands.
	   --rainbow, -b         make your logs rainbow colors.
	   --trace, -t           Show errors.
	   --watch, -w           Watch every file on your script and reload it when it changed.
	   --cool_down, -c       Set cool down for every command.
	   --auto_correct, -a    Enable auto correct for every incoming command.
	   --no_load, -v         Disable module load animation.
	   --json, -j            Use JSON DB to store data of the WhatsApp connection.
	   --reset, -k           Reset your WhatsApp connection session, and restart the script.
	   --story, q            Auto download people story after the bot received the story.
	   --offline, -f         Set your current presence to offline.
	   --no_call, -d         Reject incoming call.
	   --insta_notifier, -i  Handle incoming Instagram DMs.
	   --limit_reset, -l	 Enable Auto-reset user's limit.
	   --reset_on_start, -x  Auto reset DB-Connections every start of the script.
	   --help, -h            Show this message.

	 Examples
	   $ node . --read_only -t
 `;
}

export async function clearDBConnection() {
	if (!fs.existsSync(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`)) {
		await fs.writeFile(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`, JSON.stringify({}));
	}

	const data = readJSON(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`);
	const session = readJSON(`./session/${cli.input[0] ?? 'Session-debug'}.json`);

	session.keys = {};
	data.chats = [];
	data.contacts = {};
	data.messages = {};
	writeJSON(`./media_files/connection_databases/${cli.input[0] ?? 'Session-debug'}.json`, data);
	writeJSON(`./session/${cli.input[0] ?? 'Session-debug'}.json`, session);
}

function reconnectMqttConnection(connection) {
	if ('spotify' in configuration.presences) {
		clearTimeout(configuration.presences.spotify.timeout);
		delete configuration.presences.spotify;
	}

	clientMqttListen.reconnect();
	connection();
}
