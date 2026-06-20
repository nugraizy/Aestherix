export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		noActiveGame: 'Tidak ada game catur aktif. Buat dengan *{prefix}chess new*',
		gameFull: 'Game sudah penuh.',
		cannotJoinOwn: 'Anda tidak bisa bergabung dengan game sendiri.',
		gameNotStarted: 'Game belum dimulai. Tunggu lawan bergabung.',
		invalidMove: 'Format langkah tidak valid. Gunakan: *{prefix}chess move e2 e4*',
		noMoves: 'Belum ada langkah yang dilakukan.'
	},
	game: {
		title: '*CATUR*',
		created: '{0} membuat game catur!',
		joinPrompt: 'Ketik *{prefix}chess join* untuk bermain!',
		started: 'Game dimulai!',
		turn: 'Giliran {0}.',
		check: '⚠️ Skak!',
		checkmate: '🏆 Skakmat! {0} menang!',
		stalemate: '🤝 Stalemate! Game seri.',
		drawOffered: '{0} menawarkan seri.',
		drawAcceptPrompt: 'Ketik *{prefix}chess draw* untuk menerima.',
		drawAccepted: '🤝 Seri diterima!',
		resigned: '{0} menyerah. {1} menang!',
		moveHistory: '*Riwayat Langkah:*',
		duration: '⏱️ Durasi: {0}',
		gameDeleted: 'Game catur dihapus.'
	},
	info: {
		title: '*CATUR*',
		description: 'Permainan papan klasik untuk dua pemain. Skakmat raja lawan untuk menang!',
		commands: '*Perintah:*',
		newGame: '• *{prefix}chess new* — Buat game baru',
		joinGame: '• *{prefix}chess join* — Gabung game (sebagai hitam)',
		move: '• *{prefix}chess move <dari> <ke>* — Buat langkah (contoh: {prefix}chess move e2 e4)',
		board: '• *{prefix}chess board* — Tampilkan papan',
		resign: '• *{prefix}chess resign* — Menyerah',
		draw: '• *{prefix}chess draw* — Tawarkan/terima seri',
		history: '• *{prefix}chess history* — Tampilkan riwayat langkah',
		deleteGame: '• *{prefix}chess del* — Hapus game',
		howToPlay: '*Cara bermain:*',
		step1: '1. Buat game: *{prefix}chess new*',
		step2: '2. Lawan bergabung: *{prefix}chess join*',
		step3: '3. Buat langkah: *{prefix}chess move e2 e4*',
		step4: '4. Skakmat raja untuk menang!',
		step5: '5. Atau menyerah/seri jika diperlukan',
		notation: '*Notasi:*\n• Kolom: a-h (kiri ke kanan)\n• Baris: 1-8 (bawah ke atas)\n• Contoh: e2 → e4 (pion maju)'
	}
});
