export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		groupOnly: 'Perintah ini hanya bisa digunakan di grup.',
		adminOnly: 'Hanya admin yang bisa menggunakan perintah ini.',
		invalidDuration: 'Tentukan durasi antara 1 dan 3600 detik.',
		notSet: 'Slow mode belum diatur untuk grup ini.'
	},
	slowmode: {
		title: '*Slow Mode*',
		usage: 'Penggunaan:\n• {prefix}slowmode set 30 — 30 detik antar pesan\n• {prefix}slowmode off — Nonaktifkan slow mode\n• {prefix}slowmode on — Aktifkan kembali slow mode\n• {prefix}slowmode remove — Hapus slow mode sepenuhnya\n• {prefix}slowmode status — Tampilkan pengaturan saat ini\n\nAnggota non-admin akan dibatasi kecepatannya.',
		enabled: 'Slow mode diaktifkan!\n\nDurasi: {0} detik antar pesan\nAdmin dikecualikan: Ya',
		disabled: 'Slow mode dinonaktifkan.',
		removed: 'Slow mode dihapus.',
		enabledStatus: 'Slow mode diaktifkan.',
		statusTitle: '*Status Slow Mode*',
		status: 'Status: {0}\nDurasi: {1} detik\nAdmin dikecualikan: {2}',
		active: '✅ Aktif',
		inactive: '❌ Nonaktif',
		yes: 'Ya',
		no: 'Tidak',
		rateLimited: '⏳ Slow mode aktif. Tunggu {0} detik.'
	}
});
