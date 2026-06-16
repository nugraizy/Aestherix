export const COLORS = ['🔴', '🔵', '🟢', '🟡'];
export const COLOR_NAMES = {
	'🔴': 'Red',
	'🔵': 'Blue',
	'🟢': 'Green',
	'🟡': 'Yellow'
};

export const WILD = '🌈';
export const WILD_NAME = 'Wild';

export const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Reverse', '+2'];
export const SPECIAL_VALUES = ['Skip', 'Reverse', '+2'];

export const createCard = (color, value) => ({
	color,
	value,
	id: `${color}${value}`,
	display: `${color} ${value}`
});

export const createDeck = () => {
	const deck = [];

	for (const color of COLORS) {
		deck.push(createCard(color, '0'));

		for (let i = 0; i < 2; i++) {
			for (let num = 1; num <= 9; num++) {
				deck.push(createCard(color, String(num)));
			}

			for (const special of SPECIAL_VALUES) {
				deck.push(createCard(color, special));
			}
		}
	}

	for (let i = 0; i < 4; i++) {
		deck.push(createCard(WILD, 'Wild'));
		deck.push(createCard(WILD, 'Wild +4'));
	}

	return deck;
};

export const shuffleDeck = (deck) => {
	const shuffled = [...deck];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
};

export const canPlayCard = (card, topCard, chosenColor = null) => {
	if (card.color === WILD) {
		return true;
	}

	const activeColor = chosenColor || topCard.color;

	if (card.color === activeColor) {
		return true;
	}

	if (card.value === topCard.value) {
		return true;
	}

	return false;
};

export const getCardEffect = (card) => {
	if (card.value === 'Skip') {
		return { type: 'skip' };
	}

	if (card.value === 'Reverse') {
		return { type: 'reverse' };
	}

	if (card.value === '+2') {
		return { type: 'draw', amount: 2 };
	}

	if (card.value === 'Wild') {
		return { type: 'wild' };
	}

	if (card.value === 'Wild +4') {
		return { type: 'wild_draw' };
	}

	return { type: 'none' };
};

export const formatHand = (hand) => {
	return hand.map((card, i) => `${i + 1}. ${card.display}`).join('\n');
};

export const formatCard = (card) => card.display;

export const getCardColor = (card) => {
	if (card.color === WILD) {
		return '🌈';
	}

	return card.color;
};
