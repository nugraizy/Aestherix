import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId, getPrefix } from '../../helper/modules/prefix.js';
import { Trivia } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

const OPTION_LETTERS = ['a', 'b', 'c', 'd'];

export default defineCommand({
	name: 'trivia',
	minifiedDescription: 'Play Trivia',
	description: 'Play Trivia quiz with friends.',
	usage: '!trivia `<new/join/start/stop/del/info>`',
	category: 'Games',
	aliases: ['quiz'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, pushname }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const T = useLocale(locale, 'trivia', { prefix });

		const playerMention = (jid) => `@${jid.split('@')[0]}`;

		const formatLeaderboard = (standings) => {
			const medals = ['🥇', '🥈', '🥉'];

			return standings
				.map(
					(p, i) =>
						`${medals[i] || '▫️'} ${t(locale, 'trivia.game.leaderboardEntry', { prefix, 0: playerMention(p.id), 1: String(p.score), 2: String(p.correct), 3: String(p.correct + p.wrong) })}`
				)
				.join('\n');
		};

		const buildQuestionMessage = (q, number, total, timeLimit, questionId, ctx) => {
			const buttons = q.options.map((opt, i) => ({
				display: opt,
				id: cmdId('trivia', `${OPTION_LETTERS[i]} ${questionId}`, ctx)
			}));

			return {
				body: `${t(locale, 'trivia.game.title', { prefix })}\n\n${t(locale, 'trivia.game.questionHeader', { prefix, 0: String(number), 1: String(total) })}\n📂 ${q.categoryName}\n\n${q.question}`,
				footer: `⏱️ ${timeLimit}s | ${T.game.questionHint}`,
				buttons
			};
		};

		const sendQuestion = async (jid, q, number, total, timeLimit, questionId, ctx) => {
			const prompt = buildQuestionMessage(q, number, total, timeLimit, questionId, ctx);

			const builder = new client.TemplateBuilder.Native();

			await builder
				.destination(jid)
				.body(prompt.body)
				.footer(prompt.footer)
				.buttons(...prompt.buttons.map((b) => builder.button.reply(b)))
				.send();
		};

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'new' || args[1] === 'play') {
			const existing = Trivia.getSession(from);

			if (existing) {
				return await client.reply(from, T.errors.gameAlreadyActive, message);
			}

			const game = new Trivia(from, sender, locale);

			game.addPlayer(sender, pushname);
			game.play();

			loggers.info(`${color('Trivia game created by', 'pink')} ${color(pushname, 'white')}`);

			const categories = Trivia.getCategories(locale);
			const categoryList = Object.values(categories).map((c) => `• ${c}`).join('\n');

			await client.send(
				from,
				{
					text: `${t(locale, 'trivia.game.title', { prefix })}\n\n${t(locale, 'trivia.game.created', { prefix, 0: playerMention(sender) })}\n\n${t(locale, 'trivia.game.players', { prefix, 0: '1' })}\n${t(locale, 'trivia.game.questions', { prefix, 0: String(game.totalQuestions) })}\n\n${T.game.joinPrompt}\n${T.game.startPrompt}\n\n${T.game.categories}\n${categoryList}\n\n${T.game.startCategory}\n*!trivia start <category>*`,
					mentions: [sender]
				},
				{ quoted: message }
			);
		} else if (args[1] === 'join') {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			const result = game.addPlayer(sender, pushname);

			if (result.error) {
				return await client.reply(from, T.errors.alreadyJoined, message);
			}

			const mentions = [...game.players.keys()];
			const playerList = [...game.players.values()].map((p) => `• ${p.name}`).join('\n');

			await client.send(
				from,
				{
					text: `${t(locale, 'trivia.game.title', { prefix })}\n\n${t(locale, 'trivia.game.joined', { prefix, 0: playerMention(sender) })}\n\n${t(locale, 'trivia.game.players', { prefix, 0: String(game.players.size) })}\n${playerList}\n\n${T.game.joinPrompt}\n${T.game.startPrompt}`,
					mentions
				},
				{ quoted: message }
			);
		} else if (args[1] === 'start') {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, T.errors.onlyHostStart, message);
			}

			const categoryInput = args.slice(2).join(' ') || null;
			let category = null;

			if (categoryInput) {
				const categories = Trivia.getCategories(locale);
				const categoryKey = Object.keys(categories).find(
					(key) => categories[key].toLowerCase() === categoryInput.toLowerCase()
				);

				if (categoryKey) {
					category = categoryKey;
				}
			}

			const result = game.start(category);

			if (result.error) {
				return await client.reply(from, T.errors.needPlayers, message);
			}

			if (result.status === 'ended') {
				Trivia.deleteSession(from);

				return await client.send(
					from,
					{
						text: `${T.game.results}\n\n${formatLeaderboard(result.standings)}\n\n${t(locale, 'trivia.game.duration', { prefix, 0: result.duration })}`,
						mentions: result.standings.map((p) => p.id)
					}
				);
			}

			if (result.status === 'question') {
				const q = result.question;
				const qId = result.questionId;
				const ctx = { prefix: args[0]?.charAt(0) || '.' };

				await sendQuestion(from, q, result.number, result.total, result.timeLimit, qId, ctx);

				game.questionTimer = setTimeout(async () => {
					if (game.phase === 'playing' && game.currentQuestion) {
						const correctAnswer = q.options[q.correct];
						const next = game.nextQuestion();

						await client.send(from, { text: t(locale, 'trivia.game.timeUp', { prefix, 0: correctAnswer }) });

						if (next.status === 'question') {
							await sendQuestion(from, next.question, next.number, next.total, next.timeLimit, next.questionId, ctx);
						} else if (next.status === 'ended') {
							Trivia.deleteSession(from);

							await client.send(from, {
								text: `${T.game.results}\n\n${formatLeaderboard(next.standings)}\n\n${t(locale, 'trivia.game.duration', { prefix, 0: next.duration })}`,
								mentions: next.standings.map((p) => p.id)
							});
						}
					}
				}, 15000);
			}
		} else if (args[1] === 'answer' || args[1] === 'ans' || ['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(args[1]?.toLowerCase())) {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			let answerIndex;
			let questionId = null;

			if (args[1] === 'answer' || args[1] === 'ans') {
				const answer = args[2];

				if (!answer) {
					return await client.reply(from, T.errors.provideAnswer, message);
				}

				if (['1', '2', '3', '4'].includes(answer)) {
					answerIndex = parseInt(answer, 10) - 1;
				} else if (['a', 'b', 'c', 'd'].includes(answer.toLowerCase())) {
					answerIndex = answer.toLowerCase().charCodeAt(0) - 97;
				} else {
					return await client.reply(from, T.errors.invalidAnswer, message);
				}

				questionId = args[3] || null;
			} else {
				const answer = args[1]?.toLowerCase();

				if (['1', '2', '3', '4'].includes(answer)) {
					answerIndex = parseInt(answer, 10) - 1;
				} else if (['a', 'b', 'c', 'd'].includes(answer)) {
					answerIndex = answer.charCodeAt(0) - 97;
				}

				questionId = args[2] || null;
			}

			if (answerIndex === undefined) {
				return await client.reply(from, T.errors.invalidAnswer, message);
			}

			const result = game.answer(sender, answerIndex, questionId);

			if (result.error) {
				if (result.error === 'Question has changed.') {
					return await client.reply(from, T.errors.questionChanged, message);
				}

				return await client.reply(from, T.errors.alreadyAnswered, message);
			}

			if (result.status === 'correct') {
				let response = t(locale, 'trivia.game.correct', { prefix, 0: String(result.points) });

				if (result.streak > 1) {
					response += ` ${t(locale, 'trivia.game.streak', { prefix, 0: String(result.streak) })}`;
				}

				response += `\n${t(locale, 'trivia.game.time', { prefix, 0: result.timeTaken })}`;

				await client.reply(from, response, message);
			} else {
				await client.reply(from, t(locale, 'trivia.game.wrong', { prefix, 0: result.correctAnswer }), message);
			}

			if (game.getAllAnswered()) {
				if (game.questionTimer) {
					clearTimeout(game.questionTimer);
					game.questionTimer = null;
				}

				const next = game.nextQuestion();
				const ctx = { prefix: args[0]?.charAt(0) || '.' };

				if (next.status === 'question') {
					await sendQuestion(from, next.question, next.number, next.total, next.timeLimit, next.questionId, ctx);

					game.questionTimer = setTimeout(async () => {
						if (game.phase === 'playing' && game.currentQuestion) {
							const correctAnswer = next.question.options[next.question.correct];
							const nextQ = game.nextQuestion();

					await client.send(from, { text: t(locale, 'trivia.game.timeUp', { prefix, 0: correctAnswer }) });

							if (nextQ.status === 'question') {
								await sendQuestion(from, nextQ.question, nextQ.number, nextQ.total, nextQ.timeLimit, nextQ.questionId, ctx);
							} else if (nextQ.status === 'ended') {
								Trivia.deleteSession(from);

								await client.send(from, {
									text: `${T.game.results}\n\n${formatLeaderboard(nextQ.standings)}\n\n${t(locale, 'trivia.game.duration', { prefix, 0: nextQ.duration })}`,
									mentions: nextQ.standings.map((p) => p.id)
								});
							}
						}
					}, 15000);
				} else if (next.status === 'ended') {
					Trivia.deleteSession(from);

					await client.send(from, {
						text: `${T.game.results}\n\n${formatLeaderboard(next.standings)}\n\n${t(locale, 'trivia.game.duration', { prefix, 0: next.duration })}`,
						mentions: next.standings.map((p) => p.id)
					});
				}
			}
		} else if (args[1] === 'scores' || args[1] === 'scoreboard') {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			const standings = game.getScoreboard();

			await client.send(
				from,
				{
					text: `${T.game.scoreboard}\n\n${formatLeaderboard(standings)}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'stop' || args[1] === 'end') {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, T.errors.onlyHostStop, message);
			}

			if (game.questionTimer) {
				clearTimeout(game.questionTimer);
			}

			const standings = game.getScoreboard();

			Trivia.deleteSession(from);

			await client.send(
				from,
				{
					text: `${T.game.gameEnded}\n\n${formatLeaderboard(standings)}\n\n${t(locale, 'trivia.game.duration', { prefix, 0: game.getGameDuration() })}`
				},
				{ quoted: message }
			);
		} else if (args[1] === 'del' || args[1] === 'delete') {
			const game = Trivia.getSession(from);

			if (!game) {
				return await client.reply(from, T.errors.noActiveGame, message);
			}

			if (game.host !== sender) {
				return await client.reply(from, T.errors.onlyHostDelete, message);
			}

			if (game.questionTimer) {
				clearTimeout(game.questionTimer);
			}

			Trivia.deleteSession(from);

			await client.reply(from, T.game.gameDeleted, message);
		} else if (args[1] === 'categories') {
			const categories = Trivia.getCategories(locale);
			const categoryList = Object.entries(categories)
				.map(([key, name]) => `• ${name} (${t(locale, 'trivia.game.questionsCount', { prefix, 0: String(Trivia.getCategoryQuestionsCount(locale, key)) })})`)
				.join('\n');

			await client.reply(from, `${T.game.categoriesTitle}\n\n${categoryList}`, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${T.info.title}\n\n${T.info.description}\n\n${T.info.commands}\n${T.info.newGame}\n${T.info.joinGame}\n${T.info.startGame}\n${T.info.startCategory}\n${T.info.answer}\n${T.info.scores}\n${T.info.categories}\n${T.info.stopGame}\n${T.info.deleteGame}\n\n${T.info.scoring}\n${T.info.basePoints}\n${T.info.timeBonus}\n${T.info.streakBonus}\n\n${T.info.howToPlay}\n${T.info.step1}\n${T.info.step2}\n${T.info.step3}\n${T.info.step4}`,
				message
			);
		}
	}
});
