export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		providePattern: 'Penggunaan: {prefix}autoreply add "kata kunci" "respons"',
		provideId: 'Berikan ID auto-reply. Gunakan *{prefix}autoreply list* untuk melihat ID.',
		notFound: 'Auto-reply tidak ditemukan.'
	},
	autoreply: {
		title: '*Sistem Auto-Reply*',
		usage: 'Penggunaan:\n• {prefix}autoreply add "halo" "Halo juga!"\n• {prefix}autoreply add "harga" "Cek website kami!"\n• {prefix}autoreply add regex "\\d{4}" "Itu angka!"\n• {prefix}autoreply add "test" "Respons" --cd 60\n• {prefix}autoreply list\n• {prefix}autoreply remove <id>\n• {prefix}autoreply removeall\n\nOpsi:\n• regex — Gunakan pencocokan regex\n• --cd <detik> — Cooldown antar trigger',
		added: '✅ Auto-reply ditambahkan!\n\nPola: "{0}"{1}\nRespons: "{2}"{3}\nID: {4}',
		regex: ' [regex]',
		cooldown: ' [cooldown: {0}s]',
		noReplies: 'Tidak ada auto-reply di chat ini.',
		listTitle: '*Auto-Replies*',
		listItem: '{0}. "{1}" → "{2}"{3}{4} [ID: {5}]',
		removed: 'Auto-reply dihapus.',
		removedAll: 'Menghapus {0} auto-reply.'
	}
});
