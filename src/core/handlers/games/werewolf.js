import { getLocale } from '../../../helper/i18n/index.js';
import { EVENTS } from '../../../utils/games/werewolf/events.js';
import { repository } from '../../../utils/games/werewolf/state/repository.js';
import { getAlivePlayers } from '../../../utils/games/werewolf/state/session.js';
import { initScheduler } from '../../../utils/games/werewolf/logic/scheduler-singleton.js';
import { initLobbyTimer } from '../../../utils/games/werewolf/logic/lobby-timer-singleton.js';
import { MIN_PLAYERS } from '../../../utils/games/werewolf/config/constants.js';
import { finalizeStart } from '../../../commands/games/werewolf/subcommands/_start-game.js';
import {
	buildWerewolfPrompt,
	buildSeerPrompt,
	buildGuardPrompt,
	buildWitchHealPrompt,
	buildWitchPoisonPrompt,
	buildHunterRevengePrompt,
	buildCupidPrompt,
	buildLittleGirlPrompt,
	buildAlphaConvertPrompt,
	buildVotingPrompt
} from '../../../commands/games/werewolf/ui/prompts.js';
import {
	buildMorningReport,
	buildVotingClosedAnnouncement,
	buildGameOverSummary,
	buildNightKickoff
} from '../../../commands/games/werewolf/ui/summaries.js';

const sendButtons = async (clientInstance, jid, prompt) => {
	if (!prompt) {
		return;
	}

	if (prompt.buttons?.length > 0) {
		const builder = new clientInstance.TemplateBuilder.Native();

		await builder
			.destination(jid)
			.body(prompt.body)
			.footer(prompt.footer || '')
			.buttons(...prompt.buttons.map((b) => builder.button.reply(b)))
			.send();
	} else {
		await clientInstance.send(jid, { text: prompt.body });
	}
};

const sendNightPrompts = async (clientInstance, session, locale) => {
	const alive = getAlivePlayers(session);

	for (const player of alive) {
		switch (player.role) {
			case 'werewolf':
			case 'alpha-werewolf': {
				const prompt = buildWerewolfPrompt(session, locale);

				await sendButtons(clientInstance, player.id, prompt);

				if (player.role === 'alpha-werewolf' && !session.alphaConverted) {
					const convertPrompt = buildAlphaConvertPrompt(session, locale);

					await sendButtons(clientInstance, player.id, convertPrompt);
				}

				break;
			}
			case 'seer': {
				const prompt = buildSeerPrompt(session, locale);

				await sendButtons(clientInstance, player.id, prompt);
				break;
			}
			case 'guard': {
				const prompt = buildGuardPrompt(session, locale);

				await sendButtons(clientInstance, player.id, prompt);
				break;
			}
			case 'witch': {
				const healPrompt = buildWitchHealPrompt(session, locale);

				await sendButtons(clientInstance, player.id, healPrompt);

				const poisonPrompt = buildWitchPoisonPrompt(session, locale);

				await sendButtons(clientInstance, player.id, poisonPrompt);
				break;
			}
			case 'hunter': {
				const text =
					locale === 'en'
						? '🏹 You are the Hunter. Wait for daytime.'
						: '🏹 Kamu adalah Pemburu. Tunggu sampai pagi.';

				await clientInstance.send(player.id, { text });
				break;
			}
			case 'cupid': {
				if (session.firstNight && session.loverIds.length === 0) {
					const prompt = buildCupidPrompt(session, locale);

					await sendButtons(clientInstance, player.id, prompt);
				}

				break;
			}
			case 'little-girl': {
				const prompt = buildLittleGirlPrompt(session, locale);

				await sendButtons(clientInstance, player.id, prompt);
				break;
			}
			case 'villager': {
				const text =
					locale === 'en'
						? '🌙 Night falls. Wait until morning.'
						: '🌙 Malam tiba. Tunggu sampai pagi.';

				await clientInstance.send(player.id, { text });
				break;
			}
			case 'jester': {
				const text =
					locale === 'en'
						? '🃏 Night falls. Plot your scheme for tomorrow.'
						: '🃏 Malam tiba. Rencanakan strategimu untuk besok.';

				await clientInstance.send(player.id, { text });
				break;
			}
		}
	}
};

const handlePhaseChanged = async (clientInstance, payload) => {
	const session = await repository.load(payload.roomId);

	if (!session) {
		return;
	}

	const locale = getLocale(session.roomId);

	if (payload.phase === 'night') {
		const nightText = buildNightKickoff(session, locale);

		await clientInstance.send(session.roomId, { text: nightText });
		await sendNightPrompts(clientInstance, session, locale);
	}

	if (payload.phase === 'day' && payload.previousPhase !== 'night') {
		const dayText = locale === 'en' ? '☀️ Day has come. Discuss!' : '☀️ Pagi telah tiba. Diskusikan!';

		await clientInstance.send(session.roomId, { text: dayText });
	}
};

const handleMorningReport = async (clientInstance, payload) => {
	const session = await repository.load(payload.roomId);

	if (!session) {
		return;
	}

	const locale = getLocale(session.roomId);
	const report = buildMorningReport(session, payload, locale);

	await clientInstance.send(session.roomId, {
		text: report.body,
		mentions: report.mentions
	});
};

const handleVotingOpened = async (clientInstance, payload) => {
	const session = await repository.load(payload.roomId);

	if (!session) {
		return;
	}

	const locale = getLocale(session.roomId);
	const alive = getAlivePlayers(session);

	for (const player of alive) {
		const prompt = buildVotingPrompt(session, player.id, locale);

		await sendButtons(clientInstance, player.id, prompt);
	}
};

const handleVotingClosed = async (clientInstance, payload) => {
	const session = await repository.load(payload.roomId);

	if (!session) {
		return;
	}

	const locale = getLocale(session.roomId);
	const announcement = buildVotingClosedAnnouncement(session, payload, locale);

	if (announcement.body) {
		await clientInstance.send(session.roomId, {
			text: announcement.body,
			mentions: announcement.mentions
		});
	}
};

const handleHunterRevenge = async (clientInstance, payload) => {
	const session = await repository.load(payload.roomId);

	if (!session) {
		return;
	}

	const locale = getLocale(session.roomId);
	const prompt = buildHunterRevengePrompt(session, payload.actorId, locale);

	await sendButtons(clientInstance, payload.actorId, prompt);
};

const handleGameEnded = async (clientInstance, payload) => {
	const locale = getLocale(payload.roomId);
	const summary = buildGameOverSummary(
		payload.stats,
		payload.winner,
		payload.reason,
		locale
	);

	await clientInstance.send(payload.roomId, {
		text: summary.body,
		mentions: summary.mentions
	});
};

const handleWarning = async (clientInstance, payload) => {
	const locale = getLocale(payload.roomId);
	const text =
		locale === 'en'
			? '⚠️ No night actions received. Phase will advance soon.'
			: '⚠️ Tidak ada aksi malam. Fase akan berlanjut.';

	await clientInstance.send(payload.roomId, { text });
};

export const initWerewolfHandler = (clientInstance, logger) => {
	const emit = (eventName, payload) => {
		switch (eventName) {
			case EVENTS.PHASE_CHANGED:
				handlePhaseChanged(clientInstance, payload).catch((e) => logger?.error?.('ww:phaseChanged', e));
				break;
			case EVENTS.MORNING_REPORT:
				handleMorningReport(clientInstance, payload).catch((e) => logger?.error?.('ww:morningReport', e));
				break;
			case EVENTS.VOTING_OPENED:
				handleVotingOpened(clientInstance, payload).catch((e) => logger?.error?.('ww:votingOpened', e));
				break;
			case EVENTS.VOTING_CLOSED:
				handleVotingClosed(clientInstance, payload).catch((e) => logger?.error?.('ww:votingClosed', e));
				break;
			case EVENTS.HUNTER_REVENGE:
				handleHunterRevenge(clientInstance, payload).catch((e) => logger?.error?.('ww:hunterRevenge', e));
				break;
			case EVENTS.GAME_ENDED:
				handleGameEnded(clientInstance, payload).catch((e) => logger?.error?.('ww:gameEnded', e));
				break;
			case EVENTS.WARNING:
				handleWarning(clientInstance, payload).catch((e) => logger?.error?.('ww:warning', e));
				break;
		}
	};

	const scheduler = initScheduler({ emit, logger });

	initLobbyTimer({
		onAutoStart: async (session) => {
			const locale = getLocale(session.roomId);
			const text =
				locale === 'en'
					? '⏰ Lobby time is up! Starting the game automatically…'
					: '⏰ Waktu lobi habis! Permainan dimulai otomatis…';

			await clientInstance.send(session.roomId, { text });
			await finalizeStart(session, clientInstance, locale);
		},
		onDisband: async (session) => {
			const locale = getLocale(session.roomId);
			const text =
				locale === 'en'
					? `⏰ Lobby disbanded — not enough players (need ≥ ${MIN_PLAYERS}).`
					: `⏰ Lobi dibubarkan — pemain kurang (butuh ≥ ${MIN_PLAYERS}).`;

			await clientInstance.send(session.roomId, { text });
			await repository.delete(session.roomId).catch(() => {});
		},
		logger
	});

	return scheduler;
};
