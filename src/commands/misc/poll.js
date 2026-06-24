import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { pollManager } from '../../helper/poll-manager.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

export default defineCommand({
	name: 'poll',
	minifiedDescription: 'Create a poll',
	description: 'Create a native WhatsApp poll with optional actions.',
	usage: '!poll "Question" "Option 1" "Option 2" [--action <type> <threshold>]',
	category: 'Misc',
	aliases: [],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, query, sender, mention, isGroup, isAdmin }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const P = useLocale(locale, 'poll', { prefix });

		if (!query) {
			return await client.reply(from, P.poll.usage, message);
		}

		const isKick = query.startsWith('kick');

		if (isKick) {
			if (!isGroup) {
				return await client.reply(from, P.errors.groupOnly, message);
			}

			if (!isAdmin) {
				return await client.reply(from, P.errors.adminOnly, message);
			}

			if (!mention || mention.length === 0) {
				return await client.reply(from, P.errors.provideMention, message);
			}

			const targetJid = mention[0];
			const questionMatch = query.match(/kick\s+@\S+\s+"([^"]+)"/);
			const question = questionMatch ? questionMatch[1] : t(locale, 'poll.poll.kickQuestion', [targetJid.split('@')[0]]);

			const minVotesMatch = query.match(/--votes\s+(\d+)/);
			const minVotes = minVotesMatch ? parseInt(minVotesMatch[1], 10) : 3;

			const options = [P.poll.yes, P.poll.no];

			const actions = [
				{
					id: `kick_${targetJid}_${Date.now()}`,
					type: 'kick_vote',
					minVotes,
					type_action: 'kick',
					targetJid
				}
			];

			try {
				const pollMessage = {
					poll: {
						name: question,
						values: options,
						selectableCount: 1
					},
					mentions: [targetJid]
				};

				const sent = await client.send(from, pollMessage, { quoted: message });

				if (sent && sent.key) {
					pollManager.create(sent.key.id, from, sender, question, options, actions);

					if (client.store) {
						client.store.storeMessage(from, sent);
					}

					await client.send(
						from,
						{
							text: t(locale, 'poll.poll.kickCreated', [targetJid.split('@')[0], question, String(minVotes)]),
							mentions: [targetJid]
						},
						{ quoted: message }
					);
				}
			} catch (error) {
				await client.reply(from, t(locale, 'poll.errors.failedCreate', [error.message]), message);
			}
		} else {
			const matches = query.match(/"([^"]+)"/g);

			if (!matches || matches.length < 3) {
				return await client.reply(from, P.errors.provideQuestion, message);
			}

			const cleaned = matches.map((m) => m.replace(/"/g, ''));
			const question = cleaned[0];
			const options = cleaned.slice(1);

			if (options.length < 2) {
				return await client.reply(from, P.errors.minOptions, message);
			}

			if (options.length > 12) {
				return await client.reply(from, P.errors.maxOptions, message);
			}

			const actions = [];
			const actionMatches = query.match(/--(announce|close|msg)\s+(\d+)(?:\s+"([^"]+)")?/g);

			if (actionMatches) {
				for (const match of actionMatches) {
					const parts = match.match(/--(announce|close|msg)\s+(\d+)(?:\s+"([^"]+)")?/);

					if (parts) {
						const actionType = parts[1];
						const threshold = parseInt(parts[2], 10);
						const customMessage = parts[3] || null;

						const action = {
							id: `${actionType}_${threshold}_${Date.now()}`,
							type: 'total_votes',
							threshold,
							type_action: actionType === 'msg' ? 'message' : actionType,
							message: customMessage || `Threshold reached: {votes} votes`
						};

						actions.push(action);
					}
				}
			}

			try {
				const pollMessage = {
					poll: {
						name: question,
						values: options,
						selectableCount: 1
					}
				};

				const sent = await client.send(from, pollMessage, { quoted: message });

				if (sent && sent.key) {
					pollManager.create(sent.key.id, from, sender, question, options, actions);

					if (client.store) {
						client.store.storeMessage(from, sent);
					}

					const actionsText = actions
						.map((a) => {
							if (a.type_action === 'announce') {
								return t(locale, 'poll.poll.announceAction', [String(a.threshold)]);
							} else if (a.type_action === 'close') {
								return t(locale, 'poll.poll.closeAction', [String(a.threshold)]);
							} else if (a.type_action === 'message') {
								return t(locale, 'poll.poll.messageAction', [String(a.threshold), a.message]);
							}

							return '';
						})
						.filter(Boolean)
						.join('\n');

					await client.reply(from, t(locale, 'poll.poll.createdWithActions', [actionsText]), message);
				}
			} catch (error) {
				await client.reply(from, t(locale, 'poll.errors.failedCreate', [error.message]), message);
			}
		}
	}
});
