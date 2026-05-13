import configuration from '../../helper/config/connect.js';
import { getNewGames } from '../../utils/index.js';

let games = {};

async function updateGames() {
	configuration.timers.freegame = setInterval(
		async () => {
			try {
				const data = await getNewGames();

				if (JSON.stringify(data) === JSON.stringify(games)) {
					return;
				}

				const clientMqttListen = configuration.mqtt;

				games = data;

				clientMqttListen?.publish(
					process.env.MQTT_FREEGAME,
					JSON.stringify({ data, from: configuration.timers.from, status: true })
				);
			} catch {
				clearInterval(configuration.timers.freegame);
				delete configuration.timers.freegame;
			}
		},
		3 * 60 * 1000
	);
}

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
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

		try {
			switch (args[1]?.toLowerCase()) {
				case 'status':
				case 'stats':
					{
						await client.reply(from, configuration.timers.from.includes(from) ? 'Enabled' : 'Disabled', message);
					}

					break;
				case 'disable':
				case 'off':
					{
						if (!configuration.timers.from.includes(from)) {
							return await client.reply(from, 'Already disabled', message);
						}

						configuration.timers.from.splice(configuration.timers.from.indexOf(from), 1);
						await client.reply(from, 'Simulate Freegame Disabled', message);
					}

					break;
				case 'enable':
				case 'on':
					{
						if (configuration.timers.from.includes(from)) {
							return await client.reply(from, 'Already enabled', message);
						}

						configuration.timers.from.push(from);

						if (!configuration.timers.freegame) {
							await updateGames();
						}

						await client.reply(from, 'Simulate Freegame Enabled', message);
					}

					break;
				default:
					{
						await client.reply(from, 'Usage: !freegame [enable|disable|status]', message);
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
