import { Aki } from 'aki-api';

import configuration from '../../helper/config/connect.js';

const TOTAL_ANSWER = 7;
const ANSWERS = {
	1: 0, // IYA
	2: 1, // TIDAK
	3: 2, // TIDAK TAHU
	4: 3, // MUNGKIN
	5: 4, // MUNGKIN TIDAK
	6: 5, // EXIT
	7: 6 // BACK
};

const BARS = {
	1: '▓',
	2: '░'
};

const progressBar = (progress) => {
	const bar = BARS[1].repeat(10);
	const filled = Math.floor(progress / 10);
	const empty = bar.length - filled;

	return `${BARS[1].repeat(filled)}${BARS[2].repeat(empty)}`;
};

export const getSession = (key) => {
	return configuration.games.akinator.get(key) || null;
};

const setSession = (key) => {
	return configuration.games.akinator.set(key, new Aki({ region: 'id' }));
};

export const setMessages = (key, message) => {
	const session = getSession(key);

	return configuration.games.akinator.set(key, Object.assign(session, message));
};

const deleteSession = async (key) => {
	const session = getSession(key);

	if (!session) {
		return { error: "You don't have a game running." }; /* eslint-disable-line */
	}

	configuration.games.akinator.delete(key);
	return session;
};

export const startAkinator = async (key) => {
	if (getSession(key)) {
		return { error: 'You already have a game running.' };
	}

	setSession(key);
	const session = getSession(key);

	await session.start();
	return { progressBar: progressBar(0), arrow: '⇵', ...session };
};

export const handleAnswer = async (key, answer) => {
	const session = getSession(key);

	if (!session) {
		return;
	}

	if (!answer) {
		return true;
	}

	let progress;
	let arrow;
	const tempProgress = session.progress;

	if (parseInt(answer) > TOTAL_ANSWER) {
		return { status: 'waiting' };
	}

	if (isNaN(answer) || answer === 6) {
		if (/^((t(?:rue)?|i?y(ak?|e)?(?:es|p)?|ok(?:ay)?)|(be?(tul|n(a|e)?r)))$/i.test(answer)) {
			answer = ANSWERS[1];
		} else if (/^((t(i?da?k|dk))|g(a?|k)?|n(o?|ope))$/i.test(answer)) {
			answer = ANSWERS[2];
		} else if (/^(((t(i?da?k|dk))|g(a?|k)?) (t(a?|h?|w)u?)|nt(a?h))/i.test(answer)) {
			answer = ANSWERS[3];
		} else if (/^(((m(u?ng?k(i)?n|a?(y)?b(e|i))?) ((t(i?da?k|dk))|g(a?|k)?|n(o?|ope))))/i.test(answer)) {
			answer = ANSWERS[5];
		} else if (/^((m(u?ng?k(i)?n|a?(y)?b(e|i))?))/i.test(answer)) {
			answer = ANSWERS[4];
		} else if (/^(b(a?c?)k|undo|k(e?mb(a?)li))$/i.test(answer)) {
			answer = ANSWERS[7];
		} else if (/^((e(xit)?|out|b(a?|t(a)?)l))$/i.test(answer) || answer === 6) {
			await session.win();

			if (session.progress === 0) {
				arrow = '⇵';
			} else if (session.progress > tempProgress) {
				arrow = '↑';
			} else {
				arrow = '↓';
			}

			progress = progressBar(session.progress);
			await deleteSession(key);
			return { status: 'exitted', arrow, progressBar: progress, ...session };
		} else {
			return { status: 'invalid' };
		}
	} else {
		answer = ANSWERS[parseInt(answer)];
	}

	if (answer === 6) {
		if (session.currentStep === 0) {
			return { status: 'back', arrow: '⇵', isFailed: true, ...session };
		}

		await session.back();

		if (session.progress === 0) {
			arrow = '⇵';
		} else if (session.progress > tempProgress) {
			arrow = '↑';
		} else {
			arrow = '↓';
		}

		progress = progressBar(session.progress);
		return { status: 'back', arrow, progressBar: progress, isFailed: false, ...session };
	}

	try {
		await session.step(answer);
	} catch (e) {
		console.log(e);
		return { status: 'waiting' };
	}

	if (session.progress === 0) {
		arrow = '⇵';
	} else if (session.progress > tempProgress) {
		arrow = '↑';
	} else {
		arrow = '↓';
	}

	progress = progressBar(session.progress);

	if (session.progress >= 90 || session.currentStep >= 87) {
		await session.win();
		await deleteSession(key);
		return { status: 'win', arrow, progressBar: progress, ...session };
	}

	return { status: 'playing', arrow, progressBar: progress, ...session };
};
