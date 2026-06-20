export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		alreadyPlaying: 'You already have a game in progress.',
		notPlaying: 'You are not currently playing.',
		noPendingGame: 'No game waiting for players. Create one with *{prefix}c4 new*',
		cannotJoinOwn: 'You cannot join your own game.',
		gameFull: 'Game is already full.',
		notYourTurn: 'Not your turn!',
		waitingForOpponent: 'Waiting for opponent to join. Type *{prefix}c4 join*',
		invalidColumn: 'Invalid column. Choose 1-7.',
		columnFull: 'Column is full. Choose another column.',
		gameOver: 'Game is already over.'
	},
	game: {
		title: '*CONNECT FOUR*',
		wins: '🎉 {0} wins!',
		aiWins: '🤖 Bot wins! Better luck next time!',
		draw: "🤝 It's a draw!",
		duration: '⏱️ Duration: {0}',
		waitingForOpponent: '{0} is waiting for an opponent.',
		joinPrompt: 'Type *{prefix}c4 join* to join the game!',
		turn: "{0}'s turn!",
		vs: 'vs',
		bot: 'Bot',
		botThinking: 'Bot is thinking...',
		gameDeleted: 'Connect Four game deleted.'
	},
	info: {
		title: '*CONNECT FOUR*',
		description: 'Drop your disc into one of 7 columns. First player to connect 4 discs in a row (horizontally, vertically, or diagonally) wins!',
		commands: '*Commands:*',
		newGame: '• *{prefix}c4 new* — Create a new game',
		aiGame: '• *{prefix}c4 ai* — Play against bot',
		joinGame: '• *{prefix}c4 join* — Join an existing game',
		dropDisc: '• *{prefix}c4 <1-7>* — Drop disc in column',
		deleteGame: '• *{prefix}c4 del* — Delete current game',
		showInfo: '• *{prefix}c4 info* — Show this help',
		howToPlay: '*How to play:*',
		step1: '1. Create a game: *{prefix}c4 new* or play vs bot: *{prefix}c4 ai*',
		step2: '2. Wait for opponent to join: *{prefix}c4 join*',
		step3: '3. Take turns dropping discs: *{prefix}c4 4*',
		step4: '4. First to connect 4 wins!'
	}
});
