export default /** @type {const} */ ({
	success: {
		join: 'Kamu berhasil join ke permainan Werewolf! Silahkan tunggu saat room master memulai permainan.',
		starting:
			'Permainan berhasil dimulai. Tunggu sebentar. Bot sedang mengacak peran dan membuat nya se-balance mungkin! Jika sudah selesai, Bot akan memberi tahu peran yang telah dibagikan di private chat!',
		killWerewolf: 'Kamu berhasil membunuh {0}.',
		killedByWerewolf:
			'Kamu dibunuh oleh Werewolf! Untuk waktu setelah itu kamu harus ditetapkan untuk diam sampai permainan selesai!',
		voted: 'Kamu berhasil melakukan voting! Tunggu sebentar.',
		exit: 'Kamu berhasil keluar dari permainan Werewolf!',
		delete: 'Sukses menghapus sesi permainan Werewolf!',
		guarded: 'Sukses menjaga {0}. Ia akan tidur nyenyak malam ini!',
		exitAndDelete: 'Karena pemain di sesi ini tidak ada, Maka permainan otomatis dibubarkan.',
		healed: 'Kamu berhasil menggunakan ramuan penyelamat pada {0}. Ia akan selamat malam ini.',
		poisoned: 'Kamu berhasil meracuni {0}. Ia akan meninggal malam ini.',
		loversPicked: 'Kamu berhasil mengikat {0} dan {1} sebagai pasangan kekasih.',
		loverNotice:
			'Kamu telah diikat sebagai kekasih dengan {0} oleh Cupid. Jika salah satu dari kalian mati, yang lain akan ikut mati karena patah hati.',
		shotFired: 'Kamu menembak {0} dengan nafas terakhirmu. Ia ikut tewas.',
		peekAttempt: 'Kamu mengintip obrolan Werewolf malam ini.',
		convertCast: 'Kamu berhasil merubah {0} menjadi Werewolf. Sekarang ia berada di pihakmu.',
		langChanged: 'Bahasa permainan diatur ke {0}.'
	},
	errors: {
		afk: [
			'Sesi ini sudah berakhir. Dikarenakan sesi ini sudah 3x tidak mengambil keputusan pada saat sesi Voting.',
			'Sesi permainan berakhir, Sesi ini diakhiri dikarenakan sudah 3x pemain-pemain tidak mengambil keputusan saat sesi Voting.',
			'Permainan diakhiri. Sesi Voting sudah berlangsung dan permainan sudah 3x tidak ada pengambilan keputusan suara.'
		],
		notRoomMaster: 'Kamu bukan merupakan room master!',
		notEnoughPlayer: 'Room belum cukup! Tunggu sampai {0} orang atau lebih (sekarang {1}).',
		tooManyPlayers: 'Room sudah penuh ({0}/{1}).',
		started: 'Permainan telah dimulai! Tunggu permainan sampai selesai.',
		joined: 'Kamu telah bergabung ke room ini!',
		full: 'Room telah penuh! Tunggu permainan sampai selesai.',
		wrongRole: 'Peranmu bukanlah {0}. Melainkan {1}.',
		wrongKill: 'Kamu tidak dapat membunuh sesama Werewolf.',
		alreadyAction: 'Kamu telah bertindak sebelumnya! Tunggu malam selanjutnya untuk bertindak sesuai peran mu.',
		protected:
			'Kamu berusaha membunuh seseorang yang dilindungi. Sekarang posisi mu terbongkar! Bohongi warga lain jika orang yang kamu berusaha bunuh menuduhmu!',
		protectedMessage:
			'Serigala berusaha membunuh mu malam ini, tetapi Penjaga melindungimu. Kamu selamat untuk malam ini — tetap waspada!',
		wrongKillProtected:
			'Serigala {0} berusaha membunuh mu! Tetapi karena kamu lagi di Jaga, kamu tidak mati pada malam ini! Tetap Hati-hati untuk malam selanjutnya!',
		dead: 'Kamu sudah mati! Tunggu sesi permainan berikutnya. Untuk sekarang silahkan tonton permainan. Tetaplah diam!',
		wrongTime: 'Belum saatnya mengambil tindakan! Tunggu waktu yang tepat ({0}, sekarang {1}).',
		victimAlreadyDead: 'Orang yang ingin kamu {0} sudah mati!',
		alreadyVoted: 'Kamu sudah pernah memberi suara pada sesi ini! Tunggu sesi berikutnya.',
		gameStarted: 'Permainan sudah dimulai. Kamu dilarang keluar dari game.',
		noSessionExist: 'Sesi permainan tidak ada! Silahkan buat permainan baru.',
		gameStartedTryingToDelete: 'Sesi permainan Werewolf sudah dimulai. Tunggu permainan selesai.',
		gameStartedTryingToMakeNewOne: 'Sesi permainan Werewolf sudah dimulai. Tunggu permainan selesai lalu buat baru.',
		gameExistsTryingToMakeNewOne:
			'Sesi permainan Werewolf sudah ada. Kamu tidak bisa membuat baru. Hapus dahulu sesi lalu buat baru.',
		notJoined: 'Kamu belum bergabung ke dalam sesi permainan Werewolf!',
		cantActionSelf: 'Kamu tidak bisa mengambil tindakan {0} pada diri sendiri!',
		targetMissing: 'Target yang kamu maksud tidak ada di permainan.',
		targetDead: 'Target yang kamu maksud sudah mati.',
		guardRepeatTarget: 'Kamu tidak bisa menjaga orang yang sama dua malam berturut-turut.',
		witchHealUsed: 'Ramuan penyelamatmu sudah habis.',
		witchPoisonUsed: 'Ramuan racunmu sudah habis.',
		cupidFirstNightOnly: 'Cupid hanya bisa memilih pasangan di malam pertama.',
		alphaConvertUsed: 'Kamu sudah pernah merubah seseorang menjadi Werewolf.',
		wrongAction: 'Aksi yang kamu kirim tidak sesuai dengan perannmu.',
		groupOnly: 'Command ini hanya bisa digunakan di group.',
		unknownLocale: 'Bahasa tidak dikenali. Gunakan "id" atau "en".'
	},
	nightTime: [
		'Malam telah datang, pergilah ke tempat tidur mu. Tetap berhati-hati dengan Werewolf yang berkeliaran!\n\nPemain malam: Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!',
		'Tidur dan beristirahatlah sejenak.\n\nPemain malam: Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!',
		'Pergilah tidur dan tetaplah berhati-hati dengan Werewolf yang berkeliaran.\n\nPemain malam: Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!'
	],
	dayTime: {
		kill: [
			'Pagi telah tiba, warga sekitar mencium bau {0} yang tergeletak dijalan meninggal.',
			'Matahari telah terbit, Saat warga sedang mencium bau menyengat lalu menemukan {0} meninggal dengan kepala terpotong.',
			'Pagi telah tiba, warga sekitar melihat jejak Werewolf yang memiliki bercak darah. Warga mengikuti jejak tersebut lalu menemukan {0} meninggal dengan tubuh tercabik-cabik.'
		],
		noKill: [
			'Pagi telah tiba, Matahari terbit dengan cuaca yang cerah tanpa tanda-tanda warga yang dibunuh.',
			'Hari ini cuacanya sangat cerah. Warga tidak menemukan siapapun yang hilang atau dibunuh oleh Werewolf.',
			'Warga sekitar telah pada bangun. Mereka sadar tidak ada yang dibunuh oleh Werewolf.'
		],
		voting: [
			'Saat nya Warga berkumpul untuk pengambilan suara. Vote seseorang untuk di hukum!\n\nCheck private chat mu bot telah mengirim tombol untuk memudahkan pengambilan suara. Hasil pungutan suara akan dikirimkan kembali ke group.',
			'Warga diwajibkan untuk berkumpul dan melakukan pengambilan suara. Gunakan tindakan mu segera! Bot akan mengirimkan tombol pengambilan suara di private chat mu. Hasil pungutan suara akan dikirimkan kembali ke group.'
		]
	},
	lynchKillNotWerewolf: [
		'Penduduk telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia bukan Werewolf, melainkan {1}.',
		'Warga telah setuju untuk melempar {0} ke gunung merapi karena diduga sebagai Werewolf. Yang aslinya dia adalah {1}.',
		'{0} diduga sebagai Werewolf. Warga pun melakukan suntik mati terhadapnya. Warga menyadari bahwa {0} meninggal seketika. Dan warga menduga dia bukan Werewolf melainkan {1}.',
		'Warga setuju untuk menghukum gantung {0} karena diduga sebagai Werewolf. Warga menyadari bahwa {0} bukan lah Werewolf, melainkan {1}.'
	],
	lynchKillWerewolf: [
		'Penduduk sekitar telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia emang benar Werewolf. Selamat warga.',
		'{0} merupakan Werewolf, karena Warga sadar saat ia di lempar ke gunung merapi, ia tidak langsung meninggal.',
		'{0} di setujui untuk dihukum gantung. Warga mengetahui kalau ia adalah Werewolf. Dan emang benar ia merupakan Werewolf.'
	],
	lynchDraws: [
		'Sayang sekali pungutan suara yang dilakukan hari ini mengalami Draw! Warga tidak dapat memutuskan siapa yang akan dihukum. Pastikan orang yang kamu hukum adalah Werewolf dan pastikan kamu berbincang dahulu.',
		'Sesi Voting hari ini hasilnya adalah Draw! Tidak ada yang dihukum. Pastikan kamu berbincang dahulu untuk menyetujui seseorang untuk dihukum.'
	],
	lynchNoOne: ['Warga sama sekali tidak ada mengambil suara. Jika sudah 3x maka permainan akan berakhir.'],
	roleDialogue: {
		villager:
			'Kamu berperan sebagai Penduduk. Tindakan yang bisa kamu lakukan hanya menjadi orang biasa tanpa keahlian lain. Ikuti permainannya dan tunggu waktu pagi hari untuk memungut suara untuk memutuskan siapa yang akan dihukum.',
		werewolf:
			'Kamu berperan sebagai Werewolf. Tindakan yang kamu lakukan setiap malam adalah membunuh salah satu player lain. Berhati-hati saat berpura-pura baik! Agar peran lainnya tidak mengetahui peranmu. Teman Werewolf mu yang lain adalah {0}.',
		'alpha-werewolf':
			'Kamu berperan sebagai Alpha Werewolf. Selain bisa membunuh bersama serigala lain, sekali seumur permainan kamu bisa merubah satu Penduduk menjadi Werewolf.',
		seer: 'Kamu berperan sebagai Seer atau Penerawang. Tindakan yang bisa kamu lakukan ialah menerawang seseorang tiap malam untuk mengetahui apakah ia adalah Werewolf atau merupakan peran lain.',
		guard:
			'Kamu berperan sebagai Guard atau Penjaga. Tindakan yang bisa kamu lakukan tiap malam ialah memilih salah satu player untuk dijadikan teman Penjaga. Player yang kamu pilih tidak akan bisa dibunuh, tetapi kamu bisa. Jadi berhati-hati lah! Kamu tidak boleh menjaga orang yang sama dua malam berturut-turut.',
		witch:
			'Kamu berperan sebagai Witch atau Penyihir. Sekali seumur permainan kamu bisa menyelamatkan korban serigala malam ini (heal), dan sekali seumur permainan kamu bisa meracuni siapapun (poison).',
		hunter:
			'Kamu berperan sebagai Hunter atau Pemburu. Jika kamu mati (baik di malam hari atau karena digantung), kamu boleh menembak satu pemain lain sebagai balas dendam.',
		cupid:
			'Kamu berperan sebagai Cupid. Di malam pertama kamu memilih dua pemain untuk diikat sebagai pasangan kekasih. Jika salah satu dari mereka mati, yang lain ikut mati.',
		'little-girl':
			'Kamu berperan sebagai Little Girl atau Gadis Kecil. Kamu bisa mengintip obrolan para Werewolf di malam hari, tetapi ada risiko tertangkap dan terbunuh (25%).',
		jester:
			'Kamu berperan sebagai Jester atau Badut. Kamu tidak memiliki aksi malam, namun jika kamu berhasil digantung oleh warga, kamu menang sendirian.'
	},
	roleAction: {
		seer: {
			guessing: [
				'Kamu menerawang {0} dan mengetahui bahwa ia adalah {1}.',
				'Kamu bermimpi dan melihat kilasan-kilasan dari mimpi mu dan melihat {0} adalah {1}.',
				'Pada malam hari kamu terbangun dari tempat tidur dan sempat termenung. Saat itu juga firasat mu mengatakan bahwa {0} adalah {1}.'
			],
			notGuessingWerewolf: [
				'Kamu menerawang bahwa {0} bukanlah Werewolf.',
				'Kamu sempat bermimpi lima menit yang lalu dan melihat {0} bukan lah Werewolf.',
				'Mimpi mu mengatakan jika {0} bukanlah Werewolf, tapi kamu tidak yakin dengan hal itu.'
			]
		},
		guard: [
			'Kamu beruntung malam ini Penjaga menjaga mu. Kamu tidak akan bisa dibunuh oleh Werewolf.',
			'Malam ini kamu tidak akan bisa dibunuh oleh Werewolf dikarenakan kamu telah dijaga oleh Penjaga.'
		],
		littleGirlCaught: 'Kamu tertangkap basah saat mengintip obrolan Werewolf. Mereka mencabikmu seketika.',
		hunterRevengePrompt: 'Nafas terakhirmu tiba. Tembak satu pemain sebagai balas dendam — atau kamu mati begitu saja.'
	},
	prompts: {
		nightActionTitle: '🌙 Malam hari',
		nightActionFooter: 'Aksi malam hari — pilih target.',
		votingTitle: '☀️ Waktu voting',
		votingFooter: 'Pilih satu pemain untuk digantung.',
		lobbyNewGame: 'Permainan Werewolf berhasil dibuat.',
		lobbyAlreadyExists: 'Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan.',
		lobbyJoin: 'Join',
		lobbyStart: 'Mulai',
		lobbyExit: 'Keluar',
		lobbyDelete: 'Hapus Sesi',
		buttonNext: '➡️ Lanjut',
		buttonPrev: '⬅️ Kembali',
		buttonCancel: 'Batal'
	},
	winner: {
		werewolf: 'Werewolf memenangkan Permainan ini. Selamat kepada pihak Werewolf!',
		village: 'Pihak Warga memenangkan Permainan ini. Selamat kepada pihak Warga!',
		jester: 'Jester berhasil dihukum warga dan memenangkan permainan sendirian!',
		lovers: 'Pasangan kekasih menjadi satu-satunya yang tersisa dan memenangkan permainan bersama!'
	},
	warning: {
		nightIdle: 'Tidak ada pemain yang bertindak malam ini. Tolong lebih aktif, atau permainan akan melambat.'
	},
	help: 'Cara bermain Werewolf:\n• {0} {1} — buat lobby\n• {0} {2} — gabung ke lobby\n• {0} {3} — mulai permainan (hanya room master)\n• {0} {4} — keluar (hanya saat lobby)\n• {0} {5} — hapus sesi (hanya saat lobby)\n• {0} {6} <nomor> — serigala membunuh\n• {0} {7} <nomor> — peramal menerawang\n• {0} {8} <nomor> — penjaga melindungi\n• {0} {9} <nomor> / {0} {10} <nomor> — aksi witch\n• {0} {11} <nomor> — tembakan balas dendam hunter\n• {0} {12} <nomor1> <nomor2> — cupid memilih pasangan\n• {0} {13} — little girl mengintip\n• {0} {14} <nomor> — alpha merubah penduduk\n• {0} {15} <nomor> — vote menggantung\n• {0} {16} <id|en> — ganti bahasa'
});
