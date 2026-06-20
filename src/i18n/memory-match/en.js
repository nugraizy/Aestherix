export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		notPlaying: 'You are not currently playing.',
		invalidCard: 'Invalid card format. Use: A1, B2, C3, etc.'
	},
	game: {
		title: '*MEMORY MATCH*',
		difficulty: 'Difficulty',
		size: 'Size',
		pairs: 'Pairs',
		moves: 'Moves',
		duration: 'Duration',
		match: '✅ Match!',
		noMatch: '❌ No match!',
		won: '🎉 You found all pairs!',
		gameDeleted: 'Memory match game deleted.'
	},
	info: {
		title: '*MEMORY MATCH*',
		description: 'Find all matching pairs of emojis! Flip cards to reveal them.',
		commands: '*Commands:*',
		newGame: '• *{prefix}memory new* or *{prefix}memory easy* — Start easy game (3x4)',
		mediumGame: '• *{prefix}memory medium* — Start medium game (4x4)',
		hardGame: '• *{prefix}memory hard* — Start hard game (4x5)',
		flip: '• *{prefix}memory f <card>* — Flip a card (e.g., {prefix}memory f A1)',
		status: '• *{prefix}memory status* — Show game status',
		deleteGame: '• *{prefix}memory del* — Delete current game',
		howToPlay: '*How to play:*',
		step1: '1. Start game: *{prefix}memory new*',
		step2: '2. Flip cards: *{prefix}memory f A1*',
		step3: '3. Find matching pairs',
		step4: '4. Matched cards stay revealed',
		step5: '5. Find all pairs to win!'
	}
});
