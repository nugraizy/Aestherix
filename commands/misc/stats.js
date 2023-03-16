/* global botNum */
import _ from 'lodash';
import os from 'node:os';

import { getFilesizeFromBytes, getRuntime } from '../../helper/index.js';

const getCpus = (func) => {
	const cpus = func().map((cpu) => {
		cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
		return cpu;
	});

	const cpu = cpus.reduce(
		(last, cpu, _, { length }) => {
			last.total += cpu.total;
			last.speed += cpu.speed / length;
			last.times.user += cpu.times.user;
			last.times.nice += cpu.times.nice;
			last.times.sys += cpu.times.sys;
			last.times.idle += cpu.times.idle;
			last.times.irq += cpu.times.irq;
			return last;
		},
		{
			speed: 0,
			total: 0,
			times: {
				user: 0,
				nice: 0,
				sys: 0,
				idle: 0,
				irq: 0,
			},
		},
	);
};

export default {
	name: 'stats',
	description: 'Check bot status.',
	usage: '!stats',
	aliases: ['status'],
	category: 'misc',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message }, client) => {
		let caption = '';

		const {
			version: nodeVersion,
			arch,
			release: { lts },
			memoryUsage,
			resourceUsage,
			uptime: appUptime,
		} = process;

		const { uptime: hostUptime, hostname, release, version, freemem, totalmem, platform, cpus } = os;

		caption = `${'Bot Status'.formatHeaders()}\n\n`;

		caption += `⪨ Ｈｏｓｔ Ｉｎｆｏ ⪩\n\n`;
		caption += `App Runtime : ${getRuntime(appUptime()) || '0 ms'}\n`;
		caption += `Host Uptime : ${getRuntime(hostUptime())}\n`;
		caption += `Host : ${hostname()}\n`;
		caption += `Architecture : ${arch}\n`;
		caption += `Platform : ${platform()}\n`;
		caption += `Releases : ${release()}\n`;
		caption += `Release Version : ${version()}\n\n`;

		caption += `⪨ Ｓｔｏｒａｇｅ Ｓｙｓｔｅｍ Ｉｎｆｏ ⪩\n\n`;
		caption += ``;
		caption += `Memory : ${getFilesizeFromBytes(freemem)}/${getFilesizeFromBytes(totalmem)}\n`;
		for (const [key, value] of Object.entries({ ...resourceUsage(), ...memoryUsage() })) {
			caption += `${_.lowerCase(key).capitalize()} : ${getFilesizeFromBytes(value)}\n`;
		}

		caption += `\n\n`;
		caption += '⪨ Ｎｏｄｅ Ｉｎｆｏ ⪩\n\n';
		caption += `Version : ${nodeVersion}\n`;
		caption += `LTS : ${lts}\n\n`;

		caption += `⪨ ＣＰＵｓ Ｉｎｆｏ ⪩\n\n`;
		caption += `${getCpus(cpus)}`;

		client[botNum].reply({ from, quoted: message }, caption);
	},
};
