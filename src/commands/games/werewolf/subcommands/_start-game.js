import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

import { buildComposition } from '../../../../utils/games/werewolf/config/balance.js';
import { dealRoles, setPhase } from '../../../../utils/games/werewolf/state/session.js';
import { repository } from '../../../../utils/games/werewolf/state/repository.js';
import { getScheduler } from '../../../../utils/games/werewolf/logic/scheduler-singleton.js';
import { buildDealAnnouncement } from '../ui/summaries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEDIA_DIR = path.resolve(__dirname, '../../../../media/werewolf');

const ROLE_STICKER_FILE = {
	villager: 'villager.webp',
	werewolf: 'werewolf.webp',
	'alpha-werewolf': 'alpha_werewolf.webp',
	seer: 'seer.webp',
	guard: 'guard.webp',
	hunter: 'hunter.webp',
	witch: 'witch.webp',
	cupid: 'cupid.webp',
	'little-girl': 'little_girl.webp',
	jester: 'jester.webp'
};

const sendRoleStickers = async (clientInstance, session, locale) => {
	const promises = session.playersData.map(async (player) => {
		const file = ROLE_STICKER_FILE[player.role];

		if (!file) {
			return;
		}

		try {
			const buffer = await fs.readFile(path.join(MEDIA_DIR, file));
			const roleName = player.role.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			const caption =
				locale === 'en'
					? `🐺 Your role: *${roleName}*\nKeep it secret!`
					: `🐺 Peranmu: *${roleName}*\nRahasiakan!`;

			await clientInstance.send(player.id, { sticker: buffer }, {});
			await clientInstance.send(player.id, { text: caption });
		} catch {
			const roleName = player.role.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
			const caption =
				locale === 'en'
					? `🐺 Your role: *${roleName}*\nKeep it secret!`
					: `🐺 Peranmu: *${roleName}*\nRahasiakan!`;

			await clientInstance.send(player.id, { text: caption });
		}
	});

	await Promise.allSettled(promises);
};

export const finalizeStart = async (session, clientInstance, locale, { quoted } = {}) => {
	const composition = buildComposition(session.playersData.length);

	dealRoles(session, composition);
	setPhase(session, 'deal');
	session.gameTimeStarted = Date.now();

	repository.save(session);

	const announcement = buildDealAnnouncement(session, locale);

	await clientInstance.send(
		session.roomId,
		{ text: announcement.body, mentions: announcement.mentions },
		quoted ? { quoted } : {}
	);

	await sendRoleStickers(clientInstance, session, locale);

	const scheduler = getScheduler();

	if (scheduler) {
		scheduler.start(session.roomId, 0);
	}
};
