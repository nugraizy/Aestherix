export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		groupOnly: 'Perintah ini hanya bisa digunakan di grup.',
		adminOnly: 'Hanya admin yang bisa menggunakan perintah ini.',
		provideQuestion: 'Berikan pertanyaan dan minimal 2 opsi dalam tanda kutip.\n\nContoh: {prefix}poll "Bahasa terbaik?" "JavaScript" "Python"',
		provideMention: 'Sebutkan pengguna yang akan di-kick.\n\nPenggunaan: {prefix}poll kick @user "Haruskah kita kick?"',
		minOptions: 'Berikan minimal 2 opsi.',
		maxOptions: 'Maksimal 12 opsi.',
		failedCreate: 'Gagal membuat polling: {0}'
	},
	poll: {
		title: '*Sistem Polling*',
		usage: 'Penggunaan:\n• {prefix}poll "Pertanyaan" "Opsi 1" "Opsi 2"\n• {prefix}poll "Pertanyaan" "Opsi 1" "Opsi 2" --announce 10\n• {prefix}poll "Pertanyaan" "Opsi 1" "Opsi 2" --close 20\n• {prefix}poll "Pertanyaan" "Opsi 1" "Opsi 2" --msg 5 "Mencapai {votes} suara!"\n• {prefix}poll kick @user "Haruskah kita kick?" --votes 5\n\nAksi:\n• --announce <suara> — Umumkan hasil saat X suara tercapai\n• --close <suara> — Tutup polling saat X suara tercapai\n• --msg <suara> "pesan" — Kirim pesan kustom saat X suara tercapai\n• --votes <min> — Minimal suara yang diperlukan untuk kick',
		createdWithActions: '📊 Polling dibuat dengan aksi:\n{0}',
		announceAction: '• Umumkan hasil pada {0} suara',
		closeAction: '• Tutup polling pada {0} suara',
		messageAction: '• Pesan pada {0} suara: "{1}"',
		results: '📊 *Hasil Polling*\n\n{0}\n\n{1}\n\nTotal suara: {2}',
		closed: '🔒 Polling ditutup!\n\n{0}\n\nTotal suara: {1}',
		kickCreated: '🗳️ Polling vote kick dibuat!\n\nTarget: @{0}\nPertanyaan: {1}\nMinimal suara: {2}\n\nJika "Ya" mendapat lebih banyak suara dari "Tidak", pengguna akan di-kick.',
		kickQuestion: 'Haruskah kita kick @{0}?',
		kickResults: '🗳️ *Hasil Vote Kick*\n\n{0}\n\n✅ Ya: {1}\n❌ Tidak: {2}\n\n{3}',
		kicked: '@{0} telah di-kick!',
		stays: 'Pengguna tetap tinggal!',
		failedKick: 'Gagal kick pengguna: {0}',
		yes: 'Ya',
		no: 'Tidak'
	}
});
