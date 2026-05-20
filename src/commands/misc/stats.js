import _ from 'lodash';
import os from 'node:os';

import { getFilesizeFromBytes, getRuntime } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

const getCpus = (func) =>
	func()
		.map((cpu) => {
			cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0);
			return cpu;
		})
		.map(
			(cpu, i) =>
				`${i + 1}. ${cpu.model.trim()} (${cpu.speed} MHZ)\n${Object.keys(cpu.times)
					.map((type) => `- ${type.padEnd(6)}: ${((100 * cpu.times[type]) / cpu.total).toFixed(2)}%`)
					.join('\n')}`
		)
		.join('\n\n');

export default defineCommand({
	name: 'stats',
	minifiedDescription: 'Bot Status',
	description: 'Check bot status.',
	usage: '!stats',
	aliases: ['status'],
	category: 'Misc',
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
			uptime: appUptime
		} = process;

		const { uptime: hostUptime, hostname, release, version, freemem, totalmem, platform, cpus } = os;

		caption = `${'Bot Status'.formatHeaders()}\n\n`;

		caption += '`Host Info`\n\n';
		caption += `App Runtime : ${getRuntime(appUptime()) || '0 ms'}\n`;
		caption += `Host Uptime : ${getRuntime(hostUptime())}\n`;
		caption += `Host : ${hostname()}\n`;
		caption += `Architecture : ${arch}\n`;
		caption += `Platform : ${platform()}\n`;
		caption += `Releases : ${release()}\n`;
		caption += `Release Version : ${version()}\n\n`;

		caption += '`Storage System Info`\n\n';
		caption += '';
		caption += `Memory : ${getFilesizeFromBytes(freemem)}/${getFilesizeFromBytes(totalmem)}\n`;

		for (const [key, value] of Object.entries({ ...resourceUsage(), ...memoryUsage() })) {
			caption += `${_.lowerCase(key).capitalize()} : ${getFilesizeFromBytes(value)}\n`;
		}

		caption += '\n\n';
		caption += '`Node Info`\n\n';
		caption += `Version : ${nodeVersion}\n`;
		caption += `LTS : ${lts}\n\n`;

		caption += '`CPU Info`\n\n';
		caption += `${getCpus(cpus)}`;

		client.reply(from, caption, message);
	}
});
