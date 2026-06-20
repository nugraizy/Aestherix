export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		noActiveGame: 'Tidak ada game blackjack aktif. Buat dengan *{prefix}bj new*',
		alreadyJoined: 'Sudah bergabung.',
		needPlayers: 'Butuh minimal 1 pemain untuk memulai.',
		onlyHostStart: 'Hanya host yang bisa memulai game.',
		onlyHostDelete: 'Hanya host yang bisa menghapus game.'
	},
	game: {
		title: '*BLACKJACK*',
		created: '{0} membuat game blackjack!',
		joined: '{0} bergabung!',
		players: 'Pemain',
		joinPrompt: 'Ketik *{prefix}bj join* untuk bergabung!',
		startPrompt: 'Ketik *{prefix}bj start* untuk memulai!',
		dealerHand: 'Dealer',
		yourHand: 'Kartu Anda',
		value: 'Nilai',
		turn: 'Giliran {0}.',
		hitOrStand: 'Ketik *{prefix}bj hit* untuk ambil kartu atau *{prefix}bj stand* untuk bertahan.',
		bust: '💥 Bust!',
		blackjack: '🎉 Blackjack!',
		stand: '✋ Stand',
		results: {
			win: 'Menang',
			lose: 'Kalah',
			push: 'Seri',
			bust: 'Bust'
		},
		duration: '⏱️ Durasi: {0}',
		gameDeleted: 'Game blackjack dihapus.'
	},
	info: {
		title: '*BLACKJACK*',
		description: 'Dekati 21 tanpa melebihi! Kalahkan dealer untuk menang.',
		commands: '*Perintah:*',
		newGame: '• *{prefix}bj new* — Buat game baru',
		joinGame: '• *{prefix}bj join* — Gabung game',
		startGame: '• *{prefix}bj start* — Mulai game (host saja)',
		hit: '• *{prefix}bj hit* — Ambil kartu',
		stand: '• *{prefix}bj stand* — Pertahankan kartu',
		deleteGame: '• *{prefix}bj del* — Hapus game (host saja)',
		howToPlay: '*Cara bermain:*',
		step1: '1. Buat game: *{prefix}bj new*',
		step2: '2. Yang lain gabung: *{prefix}bj join*',
		step3: '3. Host mulai: *{prefix}bj start*',
		step4: '4. Hit untuk ambil, Stand untuk bertahan',
		step5: '5. Terdekat dengan 21 menang!'
	}
});
