import mqtt from 'mqtt';

import configuration from '../../helper/config/connect.js';
import { getNewGames } from '../../utils/index.js';

const clientMqttListen = mqtt.connect(process.env.MQTT_URL);

let games = {};

async function updateGames() {
	configuration.intervals.freegame = setInterval(async () => {
		try {
			const data = await getNewGames();

			if (JSON.stringify(data) === JSON.stringify(games)) {
				return;
			}

			games = data;

			clientMqttListen.publish(
				process.env.FREEGAME_TOPIC,
				JSON.stringify({ data, from: configuration.intervals.from, status: true })
			);
		} catch (error) {
			clearInterval(configuration.intervals.freegame);
			delete configuration.intervals.freegame;
		}
	}, 3 * 60 * 1000);
}

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'freegame',
	description: 'Fetch freegames from games platform.',
	usage: '!freegame <enable|disable>',
	aliases: ['f2p'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, args, message, query, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a status to simulate', { from, quoted: message, groupMetadata });
		}

		try {
			switch (args[1]?.toLowerCase()) {
				case 'status':
				case 'stats':
					{
						await client[botNum].reply(configuration.intervals.from.includes(from) ? 'Enabled' : 'Disabled', {
							from,
							quoted: message,
							groupMetadata
						});
					}

					break;
				case 'disable':
				case 'off':
					{
						if (!configuration.intervals.from.includes(from)) {
							return await client[botNum].reply('Already disabled', { from, quoted: message, groupMetadata });
						}

						configuration.intervals.from.splice(configuration.intervals.from.indexOf(from), 1);
						await client[botNum].reply('Simulate Freegame Disabled', { from, quoted: message, groupMetadata });
					}

					break;
				case 'enable':
				case 'on':
					{
						if (configuration.intervals.from.includes(from)) {
							return await client[botNum].reply('Already enabled', { from, quoted: message, groupMetadata });
						}

						configuration.intervals.from.push(from);

						if (!configuration.intervals.freegame) {
							await updateGames();
						}

						await client[botNum].reply('Simulate Freegame Enabled', { from, quoted: message, groupMetadata });
					}

					break;
				default:
					{
						await client[botNum].reply('Usage: !freegame [enable|disable|status]', {
							from,
							quoted: message,
							groupMetadata
						});
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	}
};
