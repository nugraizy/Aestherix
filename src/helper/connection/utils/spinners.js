import Spinnies from 'spinnies';

import { loggers, color as colors } from '../../../utils/modules/index.js';

const backtick = colors('`', '#FF79C6');

export const spinner = new Spinnies({
	succeedPrefix: '​',
	failPrefix: '​'
});

export const success = (name, second, spin) => {
	spin.succeed(name, {
		text: loggers.INF(
			colors('Loaded', '#BD93F9'),
			backtick + colors(name, '#44475A') + backtick,
			colors('in', '#BD93F9'),
			colors(second, '#F1FA8C') + colors('ms', '#BD93F9'),
			{
				ignore: true
			}
		)
	});
};

export const fail = (name, spin, message) => {
	spin.fail(name, {
		text: loggers.ERR(
			colors('Load', '#FF5555'),
			backtick + colors(name, '#44475A') + backtick,
			colors('|', 'grey'),
			colors(`Reason : ${message}`, '#FF5555'),
			{ ignore: true }
		)
	});
};

export const add = (name, spin) => {
	spin.add(name, {
		text: loggers.WRN(colors('Loading', '#50FA7B'), backtick + colors(name, '#44475A') + backtick, { ignore: true })
	});
};
