export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		noActiveGame: 'No blackjack game active. Create one with *{prefix}bj new*',
		alreadyJoined: 'Already joined.',
		needPlayers: 'Need at least 1 player to start.',
		onlyHostStart: 'Only the host can start the game.',
		onlyHostDelete: 'Only the host can delete the game.'
	},
	game: {
		title: '*BLACKJACK*',
		created: '{0} created a blackjack game!',
		joined: '{0} joined!',
		players: 'Players',
		joinPrompt: 'Type *{prefix}bj join* to join!',
		startPrompt: 'Type *{prefix}bj start* to begin!',
		dealerHand: 'Dealer',
		yourHand: 'Your hand',
		value: 'Value',
		turn: "{0}'s turn.",
		hitOrStand: 'Type *{prefix}bj hit* to draw or *{prefix}bj stand* to stay.',
		bust: '💥 Bust!',
		blackjack: '🎉 Blackjack!',
		stand: '✋ Stand',
		results: {
			win: 'Win',
			lose: 'Lose',
			push: 'Push',
			bust: 'Bust'
		},
		duration: '⏱️ Duration: {0}',
		gameDeleted: 'Blackjack game deleted.'
	},
	info: {
		title: '*BLACKJACK*',
		description: 'Get as close to 21 as possible without going over! Beat the dealer to win.',
		commands: '*Commands:*',
		newGame: '• *{prefix}bj new* — Create a new game',
		joinGame: '• *{prefix}bj join* — Join the game',
		startGame: '• *{prefix}bj start* — Start the game (host only)',
		hit: '• *{prefix}bj hit* — Draw a card',
		stand: '• *{prefix}bj stand* — Keep your hand',
		deleteGame: '• *{prefix}bj del* — Delete game (host only)',
		howToPlay: '*How to play:*',
		step1: '1. Create game: *{prefix}bj new*',
		step2: '2. Others join: *{prefix}bj join*',
		step3: '3. Host starts: *{prefix}bj start*',
		step4: '4. Hit to draw, Stand to keep',
		step5: '5. Closest to 21 wins!'
	}
});
