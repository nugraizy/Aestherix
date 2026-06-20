export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		provideTime: 'Berikan waktu dan pesan.\nContoh: {prefix}remind 30m Cek oven',
		invalidTime: 'Format waktu tidak valid. Gunakan: 30m, 1h, 2d, dll.',
		minTime: 'Waktu reminder minimal 1 detik.',
		maxTime: 'Waktu reminder maksimal 30 hari.',
		provideId: 'Berikan ID reminder. Gunakan *{prefix}remind list* untuk melihat ID.',
		notFound: 'Reminder tidak ditemukan.'
	},
	reminder: {
		title: '*Sistem Reminder*',
		usage: 'Penggunaan:\n• {prefix}remind 30m Cek oven\n• {prefix}remind 1h Rapat dengan tim\n• {prefix}remind 2d Bayar tagihan\n• {prefix}remind list\n• {prefix}remind cancel <id>\n• {prefix}remind cancelall\n\nSatuan waktu: s (detik), m (menit), h (jam), d (hari)',
		set: '⏰ Reminder diatur!\n\nPesan: {0}\nWaktu: {1}\nID: {2}',
		noReminders: 'Anda tidak memiliki reminder aktif.',
		listTitle: '*Reminder Anda*',
		listItem: '{0}. {1} ({2}) [ID: {3}]',
		dueNow: 'Jatuh tempo',
		cancelled: 'Reminder dibatalkan.',
		cancelledAll: 'Membatalkan {0} reminder.',
		reminderFor: 'Untuk: {0}'
	}
});
