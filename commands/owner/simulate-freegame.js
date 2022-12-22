/* global botNum, log */
import mqtt from 'mqtt';

import configuration from '../../connect.js';
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
				JSON.stringify({ data, from: configuration.intervals.from, status: true }),
			);
		} catch (error) {
			clearInterval(configuration.intervals.freegame);
			delete configuration.intervals.freegame;
		}
	}, 3 * 60 * 1000);
}

export default {
	name: 'freegame',
	description: 'Fetch freegames from games platform.',
	usage: '!freegame <enable|disable>',
	aliases: ['f2p'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, args, message, query }, client) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'You must provide a status to simulate');
		}

		try {
			switch (args[1]?.toLowerCase()) {
				case 'status':
				case 'stats':
					{
						await client[botNum].reply(
							{ from, quoted: message },
							configuration.intervals.from.includes(from) ? 'Enabled' : 'Disabled',
						);
					}

					break;
				case 'disable':
				case 'off':
					{
						if (!configuration.intervals.from.includes(from)) {
							return await client[botNum].reply({ from, quoted: message }, 'Already disabled');
						}

						configuration.intervals.from.splice(configuration.intervals.from.indexOf(from), 1);
						await client[botNum].reply({ from, quoted: message }, 'Simulate Freegame Disabled');
					}

					break;
				case 'enable':
				case 'on':
					{
						if (configuration.intervals.from.includes(from)) {
							return await client[botNum].reply({ from, quoted: message }, 'Already enabled');
						}

						configuration.intervals.from.push(from);

						if (!configuration.intervals.freegame) {
							await updateGames();
						}

						await client[botNum].reply({ from, quoted: message }, 'Simulate Freegame Enabled');
					}

					break;
				default:
					{
						await client[botNum].reply({ from, quoted: message }, 'Usage: !spotifyplayer [enable|disable|status]');
					}

					break;
			}
		} catch (e) {
			log(e);
		}
	},
};
