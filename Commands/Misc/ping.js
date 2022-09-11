/* global botNum */
import moment from 'moment-timezone';

const calculate = (t, n) => moment.duration(n - moment(t * 1000)).asSeconds();

export default {
	name: 'ping',
	description: 'Ping the bot or Show bot latency',
	usage: '!ping',
	aliases: ['pong'],
	category: 'Misc',
	cooldown: 8,
	limit: 0,
	status: 'enable',
	async run({ from, message }, client) {
		client[botNum].reply({ from, quoted: message }, `Pong! ${calculate(message.messageTimestamp, Date.now())} seconds`);
	},
};
