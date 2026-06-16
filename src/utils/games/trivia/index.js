import configuration from '../../../helper/config/connect.js';
import { getQuestions, getCategories, getCategoryQuestionsCount } from './questions.js';

const QUESTION_TIME = 15;
const QUESTIONS_PER_ROUND = 10;

export class Trivia {
	constructor(roomId, host, locale = 'en') {
		this.roomId = roomId;
		this.host = host;
		this.locale = locale;
		this.players = new Map();
		this.phase = 'lobby';
		this.currentQuestion = null;
		this.questionIndex = 0;
		this.totalQuestions = QUESTIONS_PER_ROUND;
		this.questionTimer = null;
		this.questionStartTime = null;
		this.answeredThisRound = new Set();
		this.category = null;
		this.gameTimeStarted = new Date().getTime();
	}

	static getSession(roomId) {
		return configuration.games.trivia.get(roomId);
	}

	static deleteSession(roomId) {
		configuration.games.trivia.delete(roomId);
	}

	play() {
		configuration.games.trivia.set(this.roomId, this);
	}

	addPlayer(playerId, playerName) {
		if (this.phase !== 'lobby') {
			return { error: 'Game already started.' };
		}

		if (this.players.has(playerId)) {
			return { error: 'Already joined.' };
		}

		this.players.set(playerId, {
			name: playerName,
			score: 0,
			correct: 0,
			wrong: 0,
			streak: 0,
			bestStreak: 0
		});

		return { success: true };
	}

	removePlayer(playerId) {
		if (this.phase !== 'lobby') {
			return { error: 'Cannot leave during game.' };
		}

		if (playerId === this.host) {
			return { error: 'Host cannot leave. Delete the game instead.' };
		}

		this.players.delete(playerId);
		return { success: true };
	}

	start(category = null) {
		if (this.players.size < 1) {
			return { error: 'Need at least 1 player to start.' };
		}

		this.category = category;
		this.phase = 'playing';
		this.questionIndex = 0;

		return this.nextQuestion();
	}

	nextQuestion() {
		let questions = getQuestions(this.locale);

		if (this.category) {
			questions = questions.filter((q) => q.category === this.category);

			if (questions.length === 0) {
				questions = getQuestions(this.locale);
			}
		}

		const shuffled = [...questions].sort(() => Math.random() - 0.5);

		if (this.questionIndex >= this.totalQuestions || this.questionIndex >= shuffled.length) {
			return this.endGame();
		}

		this.currentQuestion = shuffled[this.questionIndex];
		this.currentQuestionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
		this.questionIndex++;
		this.answeredThisRound.clear();
		this.questionStartTime = Date.now();

		return {
			status: 'question',
			question: this.currentQuestion,
			questionId: this.currentQuestionId,
			number: this.questionIndex,
			total: this.totalQuestions,
			timeLimit: QUESTION_TIME
		};
	}

	answer(playerId, answerIndex, questionId = null) {
		if (this.phase !== 'playing' || !this.currentQuestion) {
			return { error: 'No active question.' };
		}

		if (questionId && questionId !== this.currentQuestionId) {
			return { error: 'Question has changed.' };
		}

		if (!this.players.has(playerId)) {
			return { error: 'Not in the game.' };
		}

		if (this.answeredThisRound.has(playerId)) {
			return { error: 'Already answered this question.' };
		}

		this.answeredThisRound.add(playerId);

		const player = this.players.get(playerId);
		const timeTaken = (Date.now() - this.questionStartTime) / 1000;
		const isCorrect = answerIndex === this.currentQuestion.correct;

		if (isCorrect) {
			const timeBonus = Math.max(0, Math.floor((QUESTION_TIME - timeTaken) * 10));
			const streakBonus = player.streak * 5;
			const points = 100 + timeBonus + streakBonus;

			player.score += points;
			player.correct++;
			player.streak++;
			player.bestStreak = Math.max(player.bestStreak, player.streak);

			return {
				status: 'correct',
				points,
				timeTaken: timeTaken.toFixed(1),
				streak: player.streak,
				score: player.score
			};
		}

		player.wrong++;
		player.streak = 0;

		return {
			status: 'wrong',
			correctAnswer: this.currentQuestion.options[this.currentQuestion.correct],
			score: player.score
		};
	}

	getAllAnswered() {
		return this.answeredThisRound.size >= this.players.size;
	}

	endGame() {
		this.phase = 'ended';

		const standings = [...this.players.entries()]
			.map(([id, data]) => ({
				id,
				...data
			}))
			.sort((a, b) => b.score - a.score);

		return {
			status: 'ended',
			standings,
			duration: this.getGameDuration()
		};
	}

	getScoreboard() {
		const standings = [...this.players.entries()]
			.map(([id, data]) => ({
				id,
				...data
			}))
			.sort((a, b) => b.score - a.score);

		return standings;
	}

	getGameDuration() {
		const endTime = new Date().getTime();
		const durationMs = endTime - this.gameTimeStarted;

		const seconds = Math.floor((durationMs / 1000) % 60);
		const minutes = Math.floor((durationMs / (1000 * 60)) % 60);

		const parts = [];

		if (minutes > 0) {
			parts.push(`${minutes}m`);
		}

		if (seconds > 0 || parts.length === 0) {
			parts.push(`${seconds}s`);
		}

		return parts.join(' ');
	}

	static getCategories(locale) {
		return getCategories(locale);
	}

	static getCategoryQuestionsCount(locale, category) {
		return getCategoryQuestionsCount(locale, category);
	}
}
