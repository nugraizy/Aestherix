export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		alreadyPlaying: 'Anda sudah memiliki permainan yang berlangsung.',
		notPlaying: 'Anda tidak sedang bermain.',
		noPendingGame: 'Tidak ada game yang menunggu pemain. Buat dengan *{prefix}c4 new*',
		cannotJoinOwn: 'Anda tidak bisa bergabung dengan game sendiri.',
		gameFull: 'Game sudah penuh.',
		notYourTurn: 'Bukan giliran Anda!',
		waitingForOpponent: 'Menunggu lawan bergabung. Ketik *{prefix}c4 join*',
		invalidColumn: 'Kolom tidak valid. Pilih 1-7.',
		columnFull: 'Kolom sudah penuh. Pilih kolom lain.',
		gameOver: 'Game sudah berakhir.'
	},
	game: {
		title: '*CONNECT FOUR*',
		wins: '🎉 {0} menang!',
		aiWins: '🤖 Bot menang! Semoga beruntung lain kali!',
		draw: '🤝 Seri!',
		duration: '⏱️ Durasi: {0}',
		waitingForOpponent: '{0} menunggu lawan.',
		joinPrompt: 'Ketik *{prefix}c4 join* untuk bergabung!',
		turn: 'Giliran {0}!',
		vs: 'vs',
		bot: 'Bot',
		botThinking: 'Bot sedang berpikir...',
		gameDeleted: 'Game Connect Four dihapus.'
	},
	info: {
		title: '*CONNECT FOUR*',
		description: 'Jatuhkan cakram ke salah satu dari 7 kolom. Pemain pertama yang menghubungkan 4 cakram berturut-turut (horizontal, vertikal, atau diagonal) menang!',
		commands: '*Perintah:*',
		newGame: '• *{prefix}c4 new* — Buat game baru',
		aiGame: '• *{prefix}c4 ai* — Main melawan bot',
		joinGame: '• *{prefix}c4 join* — Bergabung dengan game',
		dropDisc: '• *{prefix}c4 <1-7>* — Jatuhkan cakram di kolom',
		deleteGame: '• *{prefix}c4 del* — Hapus game',
		showInfo: '• *{prefix}c4 info* — Tampilkan bantuan',
		howToPlay: '*Cara bermain:*',
		step1: '1. Buat game: *{prefix}c4 new* atau main vs bot: *{prefix}c4 ai*',
		step2: '2. Tunggu lawan bergabung: *{prefix}c4 join*',
		step3: '3. Bergantian menjatuhkan cakram: *{prefix}c4 4*',
		step4: '4. Pertama yang menghubungkan 4 menang!'
	}
});
