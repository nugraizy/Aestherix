export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		provideNameContent: 'Penggunaan: {prefix}template save "nama" "konten"',
		provideName: 'Penggunaan: {prefix}template use "nama" kunci1="nilai1"',
		notFound: 'Template "{0}" tidak ditemukan.'
	},
	template: {
		title: '*Template Pesan*',
		usage: 'Penggunaan:\n• {prefix}template save "nama" "konten dengan {placeholder}"\n• {prefix}template use "nama" kunci1="nilai1" kunci2="nilai2"\n• {prefix}template list\n• {prefix}template remove "nama"\n\nContoh:\n• {prefix}template save "rapat" "📅 Rapat: {judul}\n🕐 {waktu}\n📍 {lokasi}"\n• {prefix}template use "rapat" judul="Standup" waktu="9am" lokasi="Zoom"',
		saved: 'Template "{0}" disimpan!',
		updated: 'Template "{0}" diperbarui.',
		noTemplates: 'Tidak ada template di chat ini.',
		listTitle: '*Template*',
		listItem: '{0}. "{1}" (digunakan {2}x) [ID: {3}]',
		removed: 'Template "{0}" dihapus.'
	}
});
