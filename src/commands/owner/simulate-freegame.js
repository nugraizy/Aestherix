import configuration from '../../helper/config/connect.js';
import { getNewGames } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

let lastGames = {};

function startFreeGamePolling() {
	configuration.timers.freegame = setInterval(async () => {
		try {
			const data = await getNewGames();

			if (JSON.stringify(data) === JSON.stringify(lastGames)) {
				return;
			}

			lastGames = data;
			configuration.mqtt?.publish(
				process.env.MQTT_FREEGAME,
				JSON.stringify({ data, from: configuration.timers.from, status: true })
			);
		} catch {
			clearInterval(configuration.timers.freegame);
			delete configuration.timers.freegame;
		}
	}, 3 * 60 * 1000);
}

export default defineCommand({
	name: 'freegame',
	minifiedDescription: 'Simulate Freegame',
	description: 'Fetch freegames from games platform.',
	usage: '!freegame `<enable/disable>`',
	aliases: ['f2p'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message, query }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a status to simulate', message);
		}

		const action = args[1]?.toLowerCase();

		if (['status', 'stats'].includes(action)) {
			return await client.reply(from, configuration.timers.from.includes(from) ? 'Enabled' : 'Disabled', message);
		}

		if (['disable', 'off'].includes(action)) {
			if (!configuration.timers.from.includes(from)) {
				return await client.reply(from, 'Already disabled', message);
			}

			configuration.timers.from.splice(configuration.timers.from.indexOf(from), 1);
			return await client.reply(from, 'Simulate Freegame Disabled', message);
		}

		if (['enable', 'on'].includes(action)) {
			if (configuration.timers.from.includes(from)) {
				return await client.reply(from, 'Already enabled', message);
			}

			configuration.timers.from.push(from);

			if (!configuration.timers.freegame) {
				startFreeGamePolling();
			}

			return await client.reply(from, 'Simulate Freegame Enabled', message);
		}

		await client.reply(from, 'Usage: !freegame [enable|disable|status]', message);
	}
});
