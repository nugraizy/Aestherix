import { loggers, color } from '../utils/modules/index.js';
import { pollManager } from './poll-manager.js';

export class PollVoteHandler {
	#socket;
	#store;

	constructor(socket, store) {
		this.#socket = socket;
		this.#store = store;
	}

	async handlePollUpdate(msg) {
		const { decryptPollVote, getKeyAuthor, jidNormalizedUser } = await import('baileys');
		const pollKey = msg?.pollUpdateMessage?.pollCreationMessageKey;

		if (!pollKey?.remoteJid || !pollKey?.id) {
			return;
		}

		const botJid = this.#socket.user?.id;

		if (!botJid) {
			return;
		}

		const originalPoll = await this.#store.loadMessage(pollKey.remoteJid, pollKey.id);

		if (!originalPoll) {
			return;
		}

		const pollEncKey = originalPoll.message?.messageContextInfo?.messageSecret;

		if (!pollEncKey) {
			return;
		}

		const poll = pollManager.get(pollKey.id);

		if (!poll) {
			return;
		}

		const meIdNormalised = jidNormalizedUser(botJid);
		const addressingMode = msg.msg?.key?.addressingMode;

		let pollCreatorJid;

		if (addressingMode === 'lid') {
			pollCreatorJid = pollKey.participant || getKeyAuthor(pollKey, meIdNormalised);
		} else {
			pollCreatorJid = getKeyAuthor(pollKey, meIdNormalised);
		}

		let voterJid;

		if (addressingMode === 'lid') {
			voterJid = msg.msg?.key?.participant || getKeyAuthor(msg.msg.key, meIdNormalised);
		} else {
			voterJid = getKeyAuthor(msg.msg.key, meIdNormalised);
		}

		const encKey = Buffer.isBuffer(pollEncKey) ? pollEncKey : Buffer.from(pollEncKey.data || pollEncKey);

		try {
			const voteMsg = decryptPollVote(
				msg.pollUpdateMessage.vote,
				{
					pollEncKey: encKey,
					pollCreatorJid,
					pollMsgId: pollKey.id,
					voterJid
				}
			);

			this.#socket.ev.emit('messages.update', [
				{
					key: pollKey,
					update: {
						pollUpdates: [
							{
								pollUpdateMessageKey: msg.msg.key,
								vote: voteMsg,
								senderTimestampMs: msg.pollUpdateMessage.senderTimestampMs
							}
						]
					}
				}
			]);
		} catch (error) {
			loggers.error(color('[PollVoteHandler] Error decrypting vote:', 'red'), color(error.message, 'white'));
		}
	}

	async handleMessagesUpdate(updates) {
		const { getAggregateVotesInPollMessage } = await import('baileys');

		for (const { key, update } of updates) {
			if (!update.pollUpdates) {
				continue;
			}

			const poll = pollManager.get(key.id);

			if (!poll) {
				continue;
			}

			const originalPoll = await this.#store.loadMessage(key.remoteJid, key.id);

			if (!originalPoll) {
				continue;
			}

			try {
				const aggregated = getAggregateVotesInPollMessage({
					message: originalPoll.message,
					pollUpdates: update.pollUpdates
				}, this.#socket.user?.id);

				if (aggregated && aggregated.length > 0) {
					for (const vote of aggregated) {
						if (vote.voters && vote.voters.length > 0) {
							for (const voter of vote.voters) {
								pollManager.updateVote(key.id, voter, [vote.name]);
							}
						}
					}
				}

				await pollManager.checkActions(poll);
			} catch (error) {
				loggers.error(color('[PollVoteHandler] Error aggregating votes:', 'red'), color(error.message, 'white'));
			}
		}
	}
}

export const createPollVoteHandler = (socket, store) => {
	return new PollVoteHandler(socket, store);
};
