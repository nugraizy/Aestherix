import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loggers, color } from '../utils/modules/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLLS_FILE = path.join(__dirname, '../../databases/polls.json');

export class PollManager {
	#polls = new Map();
	#client = null;

	constructor() {
		this.#load();
	}

	init(client) {
		this.#client = client;
	}

	#load() {
		try {
			if (fs.existsSync(POLLS_FILE)) {
				const data = fs.readJsonSync(POLLS_FILE);

				for (const [id, poll] of Object.entries(data)) {
					this.#polls.set(id, poll);
				}
			}
		} catch {
			this.#polls = new Map();
		}
	}

	#save() {
		try {
			const data = Object.fromEntries(this.#polls);

			fs.writeJsonSync(POLLS_FILE, data, { spaces: '\t' });
		} catch (error) {
			loggers.error(color('Failed to save polls:', 'red'), color(error.message, 'white'));
		}
	}

	create(messageId, chatId, sender, question, options, actions = []) {
		const poll = {
			messageId,
			chatId,
			sender,
			question,
			options,
			votes: {},
			totalVotes: 0,
			actions,
			triggeredActions: [],
			createdAt: Date.now()
		};

		this.#polls.set(messageId, poll);
		this.#save();

		return poll;
	}

	get(messageId) {
		return this.#polls.get(messageId) || null;
	}

	getByChat(chatId) {
		for (const [, poll] of this.#polls) {
			if (poll.chatId === chatId) {
				return poll;
			}
		}

		return null;
	}

	updateVote(messageId, voterJid, selectedOptions) {
		const poll = this.#polls.get(messageId);

		if (!poll) {
			return null;
		}

		poll.votes[voterJid] = selectedOptions;
		poll.totalVotes = Object.keys(poll.votes).length;
		this.#save();

		return poll;
	}

	remove(messageId) {
		this.#polls.delete(messageId);
		this.#save();
	}

	getOptionVotes(poll) {
		const counts = {};

		for (const option of poll.options) {
			counts[option] = 0;
		}

		for (const [, selectedOptions] of Object.entries(poll.votes)) {
			for (const option of selectedOptions) {
				if (counts[option] !== undefined) {
					counts[option]++;
				}
			}
		}

		return counts;
	}

	getResults(poll) {
		const optionVotes = this.getOptionVotes(poll);

		return poll.options.map((option) => ({
			option,
			votes: optionVotes[option] || 0,
			percentage: poll.totalVotes > 0 ? Math.round(((optionVotes[option] || 0) / poll.totalVotes) * 100) : 0
		}));
	}

	async checkActions(poll) {
		if (!poll.actions || poll.actions.length === 0) {
			return;
		}

		for (const action of poll.actions) {
			if (poll.triggeredActions.includes(action.id)) {
				continue;
			}

			let shouldTrigger = false;

			if (action.type === 'total_votes' && poll.totalVotes >= action.threshold) {
				shouldTrigger = true;
			} else if (action.type === 'option_votes') {
				const optionVotes = this.getOptionVotes(poll);

				if (optionVotes[action.option] >= action.threshold) {
					shouldTrigger = true;
				}
			} else if (action.type === 'kick_vote') {
				const optionVotes = this.getOptionVotes(poll);
				const yesOption = poll.options[0] || 'Yes';
				const noOption = poll.options[1] || 'No';
				const yesVotes = optionVotes[yesOption] || 0;
				const noVotes = optionVotes[noOption] || 0;

				if (poll.totalVotes >= action.minVotes && yesVotes > noVotes) {
					shouldTrigger = true;
				}
			}

			if (shouldTrigger) {
				poll.triggeredActions.push(action.id);
				this.#save();

				await this.executeAction(poll, action);
			}
		}
	}

	async executeAction(poll, action) {
		if (!this.#client) {
			return;
		}

		try {
			const { useLocale } = await import('./i18n/index.js');

			const locale = 'en';
			const T = useLocale(locale, 'poll');

			if (action.type_action === 'announce') {
				const results = this.getResults(poll);
				const resultsText = results.map((r) => `${r.option}: ${r.votes} votes (${r.percentage}%)`).join('\n');

				await this.#client.send(poll.chatId, {
					text: T.poll.results
						.replace('{0}', poll.question)
						.replace('{1}', resultsText)
						.replace('{2}', String(poll.totalVotes))
				});
			} else if (action.type_action === 'close') {
				await this.#client.send(poll.chatId, {
					text: T.poll.closed.replace('{0}', poll.question).replace('{1}', String(poll.totalVotes))
				});

				this.remove(poll.messageId);
			} else if (action.type_action === 'message') {
				await this.#client.send(poll.chatId, {
					text: action.message.replace('{votes}', String(poll.totalVotes))
				});
			} else if (action.type_action === 'kick') {
				const targetJid = action.targetJid;
				const optionVotes = this.getOptionVotes(poll);
				const yesOption = poll.options[0] || 'Yes';
				const noOption = poll.options[1] || 'No';
				const yesVotes = optionVotes[yesOption] || 0;
				const noVotes = optionVotes[noOption] || 0;

				const mention = targetJid.split('@')[0];
				const resultText = yesVotes > noVotes ? T.poll.kicked.replace('{0}', mention) : T.poll.stays;

				await this.#client.send(poll.chatId, {
					text: T.poll.kickResults
						.replace('{0}', poll.question)
						.replace('{1}', String(yesVotes))
						.replace('{2}', String(noVotes))
						.replace('{3}', resultText),
					mentions: [targetJid]
				});

				if (yesVotes > noVotes) {
					try {
						await this.#client.groupParticipantsUpdate(poll.chatId, [targetJid], 'remove');
					} catch (error) {
						await this.#client.send(poll.chatId, {
							text: T.poll.failedKick.replace('{0}', error.message)
						});
					}
				}

				this.remove(poll.messageId);
			}
		} catch (error) {
			loggers.error(color('Failed to execute poll action:', 'red'), color(error.message, 'white'));
		}
	}
}

export const pollManager = new PollManager();
