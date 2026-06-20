export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Invalid arguments.',
		alreadyPlaying: 'You already have a game in progress.',
		notPlaying: 'You are not currently playing.',
		provideLetter: 'Please provide a letter to guess.\nExample: {prefix}hangman guess a',
		provideWord: 'Please provide a word to guess.\nExample: {prefix}hangman word hello',
		invalidLetter: 'Please guess a single letter (a-z).',
		alreadyGuessed: 'You already guessed "{letter}".'
	},
	game: {
		title: '*HANGMAN GAME*',
		guessLetter: 'Guess a letter or the whole word!',
		usage: 'Usage:\n• {prefix}hangman guess <letter>\n• {prefix}hangman word <word>\n• {prefix}hangman exit',
		win: '*YOU WIN!*',
		lose: '*GAME OVER*',
		wrongWord: '*WRONG WORD*',
		correct: '✅',
		wrong: '❌',
		wordLabel: 'Word:',
		wrongGuessesLabel: 'Wrong guesses:',
		guessedLettersLabel: 'Guessed letters:',
		remainingLabel: 'Remaining attempts:',
		durationLabel: 'Duration:',
		theWordWas: 'The word was:',
		none: 'None'
	},
	info: {
		title: '*HANGMAN GAME*',
		description: 'Guess the hidden word by suggesting letters one at a time.',
		howToPlay: '*How to play:*',
		startGame: '• Start a game: {prefix}hangman play',
		guessLetterCmd: '• Guess a letter: {prefix}hangman guess <letter>',
		guessWordCmd: '• Guess the whole word: {prefix}hangman word <word>',
		exitGame: '• Exit game: {prefix}hangman exit',
		rules: '*Rules:*',
		rule1: '• You have 6 wrong guesses before the game ends',
		rule2: '• Correct letters are revealed in the word',
		rule3: '• Wrong letters are tracked',
		rule4: '• Guess the full word to win instantly',
		example: '*Example:*',
		example1: '{prefix}hangman play',
		example2: '{prefix}hangman guess a',
		example3: '{prefix}hangman word hello'
	}
});
