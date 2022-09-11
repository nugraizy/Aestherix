/* global log */
import { instafier } from '../../Utils/Instagram Notifier/index.js';

export const handler = async () => {
	try {
		const client = await instafier.ev();

		client.fbns.on('onDeleted', (message) => {
			log(message);
		});

		client.realtime.on('onMessage', (message) => {
			log(message);
		});
	} catch (err) {
		log(err);
	}
};
