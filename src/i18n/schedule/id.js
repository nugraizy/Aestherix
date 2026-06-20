export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		provideSchedule: 'Penggunaan: {prefix}schedule add <waktu> "pesan"\nContoh: {prefix}schedule add 9:00 "Selamat pagi!"',
		invalidTime: 'Format waktu tidak valid. Gunakan: 9:00, daily, hourly, 14:30 mon, dll.',
		provideId: 'Berikan ID jadwal. Gunakan *{prefix}schedule list* untuk melihat ID.',
		notFound: 'Jadwal tidak ditemukan.',
		failedCreate: 'Gagal membuat jadwal. Ekspresi cron tidak valid.'
	},
	schedule: {
		title: '*Penjadwal Pesan*',
		usage: 'Penggunaan:\n• {prefix}schedule add 9:00 "Selamat pagi semuanya!"\n• {prefix}schedule add daily "Pengingat harian"\n• {prefix}schedule add 14:30 mon "Rapat Senin"\n• {prefix}schedule list\n• {prefix}schedule cancel <id>\n• {prefix}schedule cancelall\n\nFormat waktu:\n• 9:00 — Setiap hari jam 9:00\n• daily — Setiap hari jam 9:00\n• hourly — Setiap jam\n• 14:30 mon — Setiap Senin jam 14:30\n• weekly — Setiap Senin jam 9:00\n• monthly — Tanggal 1 setiap bulan jam 9:00',
		created: '📅 Pesan dijadwalkan!\n\nPesan: {0}\nJadwal: {1} ({2})\nID: {3}',
		noSchedules: 'Tidak ada pesan terjadwal di chat ini.',
		listTitle: '*Pesan Terjadwal*',
		listItem: '{0}. "{1}" ({2}) [ID: {3}]',
		cancelled: 'Jadwal dibatalkan.',
		cancelledAll: 'Membatalkan {0} jadwal.'
	}
});
