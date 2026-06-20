export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		notPlaying: 'You are not currently playing.',
		invalidCell: 'Invalid cell format. Use: A1, B2, C3, etc.',
		cellRevealed: 'Cell already revealed.',
		cannotFlag: 'Cannot flag revealed cell.',
		removeFlag: 'Remove flag first.',
		gameOver: 'Game is already over.'
	},
	game: {
		title: '*MINESWEEPER*',
		difficulty: 'Difficulty',
		size: 'Size',
		mines: 'Mines',
		flags: 'Flags',
		duration: 'Duration',
		won: '🎉 You won!',
		lost: '💥 Game over! You hit a mine!',
		gameDeleted: 'Minesweeper game deleted.',
		moreButtons: 'More cells...'
	},
	info: {
		title: '*MINESWEEPER*',
		description: 'Reveal all cells without hitting a mine! Numbers show how many mines are adjacent.',
		commands: '*Commands:*',
		newGame: '• *{prefix}ms new* or *{prefix}ms easy* — Start easy game (9x9, 10 mines)',
		mediumGame: '• *{prefix}ms medium* — Start medium game (16x16, 40 mines)',
		hardGame: '• *{prefix}ms hard* — Start hard game (16x30, 99 mines)',
		reveal: '• *{prefix}ms r <cell>* — Reveal a cell (e.g., {prefix}ms r A1)',
		flag: '• *{prefix}ms f <cell>* — Toggle flag on cell',
		status: '• *{prefix}ms status* — Show game status',
		deleteGame: '• *{prefix}ms del* — Delete current game',
		howToPlay: '*How to play:*',
		step1: '1. Start game: *{prefix}ms new*',
		step2: '2. Reveal cells: *{prefix}ms r A1*',
		step3: '3. Flag suspected mines: *{prefix}ms f B2*',
		step4: '4. Numbers show adjacent mines',
		step5: '5. Reveal all safe cells to win!'
	}
});
