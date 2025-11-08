import dayjs from 'dayjs';
import pm2 from 'pm2';
import yargsParser from 'yargs-parser';

import { getFilesizeFromBytes } from '../../utils/modules/index.js';

const SEND_AS_STRING = false;

const withPM2 = (callback) =>
	new Promise((resolve, reject) => {
		pm2.connect((err) => {
			if (err) {
				return reject(err);
			}

			callback((err, result) => {
				pm2.disconnect();

				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	});

const getProcesses = () => withPM2((done) => pm2.list(done));

const pm2Operation = (operation, param = null) =>
	withPM2((done) => {
		const method = operation === 'kill' ? 'killDaemon' : operation;

		if (param !== null) {
			pm2[method](param, done);
		} else {
			pm2[method](done);
		}
	});

const renderProcess = (processes, builder, isCarousel) => {
	const container = { captionFull: '', buttons: [], carousel: [] };
	let captionFull = 'PM2 Processes\n\n';

	for (const proc of processes) {
		const {
			pm_id: pmId,
			pid,
			name,
			pm2_env: { npm_lifecycle_script: npmScript, restart_time: restartTime, created_at: createdAt },
			monit: { cpu, memory }
		} = proc;

		let caption = `ID : ${pmId}\nPID : ${pid}\nName : ${name}\n`;

		if (npmScript) {
			caption += `Command : ${npmScript}\n`;
		}

		caption += `Restarted : ${restartTime}\n`;
		caption += `Time Started : ${dayjs(createdAt).format('dddd, D MMMM YYYY - HH:mm:ss')}\n`;

		if (!isCarousel) {
			caption += `{CPU ${cpu}%  MEMORY ${getFilesizeFromBytes(memory)}}\n\n`;
		}

		captionFull += caption;
		container.captionFull = captionFull;

		if (!builder) {
			continue;
		}

		const restartBtn = builder.button.reply({ display: `Restart ${name}`, id: `!pm2 -r ${name}` });
		const stopBtn = builder.button.reply({ display: `Stop ${name}`, id: `!pm2 -s ${name}` });
		const killBtn = builder.button.reply({ display: 'Kill', id: '!pm2 -k' });
		const separator = builder.button.url({ display: '', url: `Made By ${__botName}` });

		container.buttons.push(
			{ caption, button: restartBtn },
			{ caption, button: stopBtn },
			{ caption, button: killBtn },
			{ caption, buttonUrl: separator }
		);

		container.carousel.push({
			body: caption.trim(),
			footer: `{CPU ${cpu}%  MEMORY ${getFilesizeFromBytes(memory)}}`,
			header: Buffer.alloc(10),
			buttons: [restartBtn, stopBtn, killBtn]
		});
	}

	return container;
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'pm2',
	minifiedDescription: 'Manage PM2 Instance Processes',
	description: 'Manage PM2 Instance Processes, such as Listing, Stopping, Restarting, and Killing process.',
	category: 'Owner',
	usage: '!pm2',
	aliases: [],
	cooldown: 0,
	limit: 0,
	status: 'enable',

	async run({ from, message, query, device, type }, client) {
		if (!query) {
			const processes = await getProcesses();

			if (SEND_AS_STRING) {
				const { captionFull } = renderProcess(processes);

				return client.instance.reply(from, captionFull.trim(), message);
			}

			if (device === 'ios') {
				const builder = new client.instance.TemplateBuilder.Native(client);
				const { captionFull, buttons } = renderProcess(processes, builder);

				builder
					.mainBody(captionFull.trim())
					.mainFooter('PM2 Instances')
					.buttons(...buttons.map((v) => v.buttonUrl || v.button));

				const built = await builder.render();

				return client.instance.relay(from, built.message, { messageId: built.key.id });
			}

			const builder = new client.instance.TemplateBuilder.Carousel(client);
			const { carousel } = renderProcess(processes, builder, true);

			const built = await builder
				.mainBody('PM2 Monitor')
				.mainFooter('PM2 Instances')
				.mainHeader('Header')
				.cards(carousel)
				.render();

			return client.instance.relay(from, built.message, { messageId: built.key.id });
		}

		if (query && type === 'templateButtonReplyMessage') {
			const { kill, list, stop, restart } = yargsParser(query, {
				configuration: { 'short-option-groups': false },
				alias: { kill: ['k'], list: ['l', 'ls'], stop: ['s'], restart: ['r'] }
			});

			if (kill) {
				return pm2Operation('kill');
			}

			if (list) {
				const processes = await getProcesses();
				const { captionFull } = renderProcess(processes);

				return client.instance.reply(from, captionFull, message);
			}

			if (stop) {
				return pm2Operation('stop', stop);
			}

			if (restart) {
				return pm2Operation('restart', restart);
			}
		}
	}
};
