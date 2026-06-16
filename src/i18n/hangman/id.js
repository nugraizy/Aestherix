export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		alreadyPlaying: 'Anda sudah memiliki permainan yang berlangsung.',
		notPlaying: 'Anda tidak sedang bermain.',
		provideLetter: 'Masukkan huruf untuk ditebak.\nContoh: !hangman guess a',
		provideWord: 'Masukkan kata untuk ditebak.\nContoh: !hangman word halo',
		invalidLetter: 'Masukkan satu huruf (a-z).',
		alreadyGuessed: 'Anda sudah menebak "{letter}".'
	},
	game: {
		title: '*GAME HANGMAN*',
		guessLetter: 'Tebak huruf atau seluruh kata!',
		usage: 'Penggunaan:\n• !hangman guess <huruf>\n• !hangman word <kata>\n• !hangman exit',
		win: '*KAMU MENANG!*',
		lose: '*GAME OVER*',
		wrongWord: '*KATA SALAH*',
		correct: '✅',
		wrong: '❌',
		wordLabel: 'Kata:',
		wrongGuessesLabel: 'Tebakan salah:',
		guessedLettersLabel: 'Huruf yang ditebak:',
		remainingLabel: 'Sisa percobaan:',
		durationLabel: 'Durasi:',
		theWordWas: 'Kata yang benar:',
		none: 'Tidak ada'
	},
	info: {
		title: '*GAME HANGMAN*',
		description: 'Tebak kata tersembunyi dengan mengusulkan huruf satu per satu.',
		howToPlay: '*Cara bermain:*',
		startGame: '• Mulai game: !hangman play',
		guessLetterCmd: '• Tebak huruf: !hangman guess <huruf>',
		guessWordCmd: '• Tebak seluruh kata: !hangman word <kata>',
		exitGame: '• Keluar game: !hangman exit',
		rules: '*Aturan:*',
		rule1: '• Kamu punya 6 tebakan salah sebelum game berakhir',
		rule2: '• Huruf benar akan ditampilkan di kata',
		rule3: '• Huruf salah dilacak',
		rule4: '• Tebak kata lengkap untuk menang instan',
		example: '*Contoh:*',
		example1: '!hangman play',
		example2: '!hangman guess a',
		example3: '!hangman word halo'
	}
});
