import { Aki } from "aki-api";

const ANSWERS = {
	1: 0, // IYA
	2: 1, // TIDAK
	3: 2, // TIDAK TAHU
	4: 3, // MUNGKIN
	5: 4, // MUNGKIN TIDAK
	6: 5, // EXIT
};

export const startAkinator = async (key) => {
	if (getSession(key)) return { error: "You already have a game running." };
	setSession(key);
	const session = getSession(key);
	await session.start();
	return session;
};

export const getSession = (key) => {
	const session = games.akinator.get(key);
	return session;
};

const setSession = (key) => {
	const session = games.akinator.set(key, new Aki({ region: "id" }));
	return session;
};

const deleteSession = async (key) => {
	const session = getSession(key);
	if (!session) return { error: "You don't have a game running." };
	games.akinator.delete(key);
	return session;
};

export const handleAnswer = async (key, answer) => {
	const session = getSession(key);
	if (!session) return;
	if (!answer) return true;
	if (isNaN(answer)) {
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
		} else if (/^((e(xit)?|out|b(a?|t(a)?)l))/i.test(answer)) {
			await session.win();
			await deleteSession(key);
			return { status: "exitted", ...session };
		} else {
			return { status: "invalid" };
		}
	} else {
		answer = ANSWERS[parseInt(answer)];
	}
	await session.step(answer);
	if (session.progress >= 70 || session.currentStep >= 78) {
		await session.win();
		await deleteSession(key);
		return { status: "win", ...session };
	}
	return { status: "playing", ...session };
};
