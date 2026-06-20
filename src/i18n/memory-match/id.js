export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		notPlaying: 'Anda tidak sedang bermain.',
		invalidCard: 'Format kartu tidak valid. Gunakan: A1, B2, C3, dll.'
	},
	game: {
		title: '*MEMORY MATCH*',
		difficulty: 'Kesulitan',
		size: 'Ukuran',
		pairs: 'Pasangan',
		moves: 'Langkah',
		duration: 'Durasi',
		match: '✅ Cocok!',
		noMatch: '❌ Tidak cocok!',
		won: '🎉 Anda menemukan semua pasangan!',
		gameDeleted: 'Game memory match dihapus.'
	},
	info: {
		title: '*MEMORY MATCH*',
		description: 'Temukan semua pasangan emoji yang cocok! Balik kartu untuk mengungkapnya.',
		commands: '*Perintah:*',
		newGame: '• *{prefix}memory new* atau *{prefix}memory easy* — Mulai game mudah (3x4)',
		mediumGame: '• *{prefix}memory medium* — Mulai game sedang (4x4)',
		hardGame: '• *{prefix}memory hard* — Mulai game sulit (4x5)',
		flip: '• *{prefix}memory f <kartu>* — Balik kartu (contoh: {prefix}memory f A1)',
		status: '• *{prefix}memory status* — Tampilkan status game',
		deleteGame: '• *{prefix}memory del* — Hapus game',
		howToPlay: '*Cara bermain:*',
		step1: '1. Mulai game: *{prefix}memory new*',
		step2: '2. Balik kartu: *{prefix}memory f A1*',
		step3: '3. Temukan pasangan yang cocok',
		step4: '4. Kartu yang cocok tetap terbuka',
		step5: '5. Temukan semua pasangan untuk menang!'
	}
});
