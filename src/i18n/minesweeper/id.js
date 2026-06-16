export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		notPlaying: 'Anda tidak sedang bermain.',
		invalidCell: 'Format sel tidak valid. Gunakan: A1, B2, C3, dll.',
		cellRevealed: 'Sel sudah terbuka.',
		cannotFlag: 'Tidak bisa memberi bendera pada sel terbuka.',
		removeFlag: 'Hapus bendera terlebih dahulu.',
		gameOver: 'Game sudah berakhir.'
	},
	game: {
		title: '*MINESWEEPER*',
		difficulty: 'Kesulitan',
		size: 'Ukuran',
		mines: 'Tambang',
		flags: 'Bendera',
		duration: 'Durasi',
		won: '🎉 Anda menang!',
		lost: '💥 Game over! Anda mengenai tambang!',
		gameDeleted: 'Game Minesweeper dihapus.',
		moreButtons: 'Sel lainnya...'
	},
	info: {
		title: '*MINESWEEPER*',
		description: 'Buka semua sel tanpa mengenai tambang! Angka menunjukkan berapa tambang yang berdekatan.',
		commands: '*Perintah:*',
		newGame: '• *!ms new* atau *!ms easy* — Mulai game mudah (9x9, 10 tambang)',
		mediumGame: '• *!ms medium* — Mulai game sedang (16x16, 40 tambang)',
		hardGame: '• *!ms hard* — Mulai game sulit (16x30, 99 tambang)',
		reveal: '• *!ms r <sel>* — Buka sel (contoh: !ms r A1)',
		flag: '• *!ms f <sel>* — Toggle bendera pada sel',
		status: '• *!ms status* — Tampilkan status game',
		deleteGame: '• *!ms del* — Hapus game',
		howToPlay: '*Cara bermain:*',
		step1: '1. Mulai game: *!ms new*',
		step2: '2. Buka sel: *!ms r A1*',
		step3: '3. Beri bendera pada tambang: *!ms f B2*',
		step4: '4. Angka menunjukkan tambang berdekatan',
		step5: '5. Buka semua sel aman untuk menang!'
	}
});
