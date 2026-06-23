import { BOT_NAME } from '../../core/constants.js';

import dayjs from 'dayjs';
import pm2 from 'pm2';
import yargsParser from 'yargs-parser';

import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { getFilesizeFromBytes } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

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

const renderProcess = (processes, builder, isCarousel, Lo, locale) => {
	const container = { captionFull: '', buttons: [], carousel: [] };
	let captionFull = Lo.titles.pm2Processes;

	for (const proc of processes) {
		const {
			pm_id: pmId,
			pid,
			name,
			pm2_env: { npm_lifecycle_script: npmScript, restart_time: restartTime, created_at: createdAt },
			monit: { cpu, memory }
		} = proc;

		let caption = `${Lo.labels.id} : ${pmId}\n${Lo.labels.pid} : ${pid}\n${Lo.labels.name} : ${name}\n`;

		if (npmScript) {
			caption += `${Lo.labels.command} : ${npmScript}\n`;
		}

		caption += `${Lo.labels.restarted} : ${restartTime}\n`;
		caption += `${Lo.labels.timeStarted} : ${dayjs(createdAt).format('dddd, D MMMM YYYY - HH:mm:ss')}\n`;

		if (!isCarousel) {
			caption += `{${t(locale, 'owner.labels.cpuMemory', [cpu, getFilesizeFromBytes(memory)])}}\n\n`;
		}

		captionFull += caption;
		container.captionFull = captionFull;

		if (!builder) {
			continue;
		}

		const restartBtn = builder.button.reply({ display: `Restart ${name}`, id: `!pm2 -r ${name}` });
		const stopBtn = builder.button.reply({ display: `Stop ${name}`, id: `!pm2 -s ${name}` });
		const killBtn = builder.button.reply({ display: Lo.labels.kill, id: '!pm2 -k' });
		const separator = builder.button.url({ display: '', url: `Made By ${BOT_NAME}` });

		container.buttons.push(
			{ caption, button: restartBtn },
			{ caption, button: stopBtn },
			{ caption, button: killBtn },
			{ caption, buttonUrl: separator }
		);

		container.carousel.push({
			body: caption.trim(),
			footer: `{${t(locale, 'owner.labels.cpuMemory', [cpu, getFilesizeFromBytes(memory)])}}`,
			header: Buffer.alloc(10),
			buttons: [restartBtn, stopBtn, killBtn]
		});
	}

	return container;
};

export default defineCommand({
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
		const locale = await getLocale(from);
		const Lo = useLocale(locale, 'owner');

		if (!query) {
			const processes = await getProcesses();

			if (SEND_AS_STRING) {
				const { captionFull } = renderProcess(processes, undefined, undefined, Lo, locale);

				return client.reply(from, captionFull.trim(), message);
			}

			if (device.isIos) {
				const builder = new client.TemplateBuilder.Native();
				const { captionFull, buttons } = renderProcess(processes, builder, undefined, Lo, locale);

				await builder
					.destination(from)
					.body(captionFull.trim())
					.footer(Lo.titles.pm2Instances)
					.buttons(...buttons.map((v) => v.buttonUrl || v.button))
					.send();

				return;
			}

			const builder = new client.TemplateBuilder.Carousel();
			const { carousel } = renderProcess(processes, builder, true, Lo, locale);

			await builder.destination(from).body(Lo.titles.pm2Monitor).footer(Lo.titles.pm2Instances).header('Header').cards(carousel).send();

			return;
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
				const { captionFull } = renderProcess(processes, undefined, undefined, Lo, locale);

				return client.reply(from, captionFull, message);
			}

			if (stop) {
				return pm2Operation('stop', stop);
			}

			if (restart) {
				return pm2Operation('restart', restart);
			}
		}
	}
});
