import _ from 'lodash';

import { getFilesizeFromBytes } from '../../helper/index.js';

export default {
	name: 'stats',
	description: '',
	usage: '!',
	aliases: [''],
	category: '',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async (yes, client) => {
		for (const [key, value] of Object.entries(process.memoryUsage())) {
			console.log(`[${_.lowerCase(key).capitalize()}] ${getFilesizeFromBytes(value)}`);
		}
	},
};
