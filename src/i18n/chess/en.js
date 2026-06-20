export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		noActiveGame: 'No chess game active. Create one with *{prefix}chess new*',
		gameFull: 'Game is already full.',
		cannotJoinOwn: 'You cannot join your own game.',
		gameNotStarted: 'Game has not started yet. Wait for opponent to join.',
		invalidMove: 'Invalid move format. Use: *{prefix}chess move e2 e4*',
		noMoves: 'No moves have been made yet.'
	},
	game: {
		title: '*CHESS*',
		created: '{0} created a chess game!',
		joinPrompt: 'Type *{prefix}chess join* to play!',
		started: 'Game started!',
		turn: "{0}'s turn.",
		check: '⚠️ Check!',
		checkmate: '🏆 Checkmate! {0} wins!',
		stalemate: '🤝 Stalemate! The game is a draw.',
		drawOffered: '{0} offers a draw.',
		drawAcceptPrompt: 'Type *{prefix}chess draw* to accept.',
		drawAccepted: '🤝 Draw accepted!',
		resigned: '{0} resigned. {1} wins!',
		moveHistory: '*Move History:*',
		duration: '⏱️ Duration: {0}',
		gameDeleted: 'Chess game deleted.'
	},
	info: {
		title: '*CHESS*',
		description: 'Classic board game for two players. Checkmate the opponent\'s king to win!',
		commands: '*Commands:*',
		newGame: '• *{prefix}chess new* — Create a new game',
		joinGame: '• *{prefix}chess join* — Join the game (as black)',
		move: '• *{prefix}chess move <from> <to>* — Make a move (e.g., {prefix}chess move e2 e4)',
		board: '• *{prefix}chess board* — Show the board',
		resign: '• *{prefix}chess resign* — Resign the game',
		draw: '• *{prefix}chess draw* — Offer/accept draw',
		history: '• *{prefix}chess history* — Show move history',
		deleteGame: '• *{prefix}chess del* — Delete the game',
		howToPlay: '*How to play:*',
		step1: '1. Create game: *{prefix}chess new*',
		step2: '2. Opponent joins: *{prefix}chess join*',
		step3: '3. Make moves: *{prefix}chess move e2 e4*',
		step4: '4. Checkmate the king to win!',
		step5: '5. Or resign/draw if needed',
		notation: '*Notation:*\n• Columns: a-h (left to right)\n• Rows: 1-8 (bottom to top)\n• Example: e2 → e4 (pawn forward)'
	}
});
