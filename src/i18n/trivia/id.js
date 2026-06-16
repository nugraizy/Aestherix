export default /** @type {const} */ ({
	errors: {
		invalidArgs: 'Argumen tidak valid.',
		noActiveGame: 'Tidak ada game trivia aktif. Buat dengan *!trivia new*',
		gameAlreadyActive: 'Game trivia sudah aktif di grup ini.',
		gameAlreadyStarted: 'Game sudah dimulai.',
		alreadyJoined: 'Sudah bergabung.',
		needPlayers: 'Butuh minimal 1 pemain untuk memulai.',
		notInGame: 'Tidak dalam game.',
		alreadyAnswered: 'Sudah menjawab pertanyaan ini.',
		noActiveQuestion: 'Tidak ada pertanyaan aktif.',
		hostCannotLeave: 'Host tidak bisa keluar. Hapus game dengan *!trivia del*',
		cannotLeaveDuringGame: 'Tidak bisa keluar saat game berlangsung.',
		onlyHostStart: 'Hanya host yang bisa memulai game.',
		onlyHostStop: 'Hanya host yang bisa menghentikan game.',
		onlyHostDelete: 'Hanya host yang bisa menghapus game.',
		invalidAnswer: 'Jawaban tidak valid. Gunakan 1-4 atau a-d.',
		provideAnswer: 'Berikan jawaban (1-4 atau a-d).',
		questionChanged: 'Pertanyaan ini sudah berakhir. Tunggu pertanyaan berikutnya!'
	},
	game: {
		title: '*KUIS TRIVIA*',
		created: '{0} membuat game trivia!',
		joined: '{0} bergabung!',
		players: '*Pemain:* {0}',
		questions: '*Pertanyaan:* {0}',
		categories: '*Kategori:*',
		startCategory: 'Atau mulai dengan kategori tertentu:',
		joinPrompt: 'Ketik *!trivia join* untuk bergabung!',
		startPrompt: 'Ketik *!trivia start* untuk memulai!',
		questionHeader: '*Pertanyaan {0}/{1}*',
		questionHint: '💡 Balas dengan *!trivia <1-4>* atau *!trivia a/b/c/d*',
		correct: '✅ Correct! +{0} pts',
		streak: '🔥 {0} pukulan beruntun!',
		time: '⏱️ {0}dtk',
		wrong: '❌ Salah! Jawabannya adalah: *{0}*',
		timeUp: '⏰ Waktunya habis! Jawabannya adalah: *{0}*',
		gameDeleted: 'Permainan trivia dihapus.',
		gameEnded: '*KUIS TRIVIA - SELESAI*',
		results: '*KUIS TRIVIA - HASIL*',
		scoreboard: '*PAPAN SKOR TRIVIA*',
		categoriesTitle: '*KATEGORI TRIVIA*',
		questionsCount: '{0} pertanyaan',
		leaderboardEntry: '{0} - {1} poin ({2}/{3})',
		duration: '⏱️ Durasi: {0}',
		noGameActive: 'Tidak ada permainan trivia yang aktif.',
		hostOnly: 'Hanya tuan rumah yang dapat memulai permainan.'
	},
	info: {
		title: '*KUIS TRIVIA*',
		description:
			'Jawab pertanyaan dengan benar untuk mendapatkan poin! Jawaban yang lebih cepat menghasilkan poin bonus. Bangun coretan untuk bonus ekstra!',
		commands: '*Perintah:*',
		newGame: '• *!trivia new* — Membuat game baru',
		joinGame: '• *!trivia join* — Bergabung dalam permainan',
		startGame: '• *!trivia start* — Memulai permainan (khusus host)',
		startCategory: '• *!trivia start <category>* — Memulai dengan kategori tertentu',
		answer: '• *!trivia <1-4>* atau *!trivia ad* — Jawab pertanyaan',
		scores: '• *!skor trivia* — Tampilkan papan skor',
		categories: '• *!trivia kategori* — Daftar kategori',
		stopGame: '• *!trivia stop* — Mengakhiri permainan lebih awal (khusus tuan rumah)',
		deleteGame: '• *!trivia del* — Menghapus game (khusus host)',
		scoring: '*Skor:*',
		basePoints: '• Basis: 100 poin untuk setiap jawaban yang benar',
		timeBonus: '• Bonus waktu: Hingga 150 poin (lebih cepat = lebih banyak)',
		streakBonus: '• Bonus coretan: +5 poin untuk setiap jawaban benar berturut-turut',
		howToPlay: '*Cara bermain:*',
		step1: '1. Buat: *!trivia baru*',
		step2: '2. Yang lain bergabung: *!trivia bergabung*',
		step3: '3. Pembawa acara dimulai: *!trivia start*',
		step4: '4. Jawab dengan cepat: *!trivia 1* atau *!trivia a*'
	},
	categories: {
		SCIENCE: 'Sains',
		HISTORY: 'Sejarah',
		GEOGRAPHY: 'Geografi',
		ENTERTAINMENT: 'Hiburan',
		SPORTS: 'Olahraga',
		TECHNOLOGY: 'Teknologi',
		NATURE: 'Alam',
		GENERAL: 'Pengetahuan Umum',
		MYTHOLOGY: 'Mitologi',
		ART: 'Seni',
		VEHICLES: 'Kendaraan',
		BOOKS: 'Buku',
		MUSIC: 'Musik',
		TELEVISION: 'Televisi',
		VIDEOGAMES: 'Video Game',
		BOARDGAMES: 'Permainan Papan',
		MATHEMATICS: 'Matematika',
		POLITICS: 'Politik',
		CELEBRITIES: 'Selebriti',
		COMICS: 'Komik',
		ANIME: 'Anime & Manga',
		CARTOONS: 'Kartun & Animasi'
	},
	questions: [
		{
			category: 'SCIENCE',
			question: 'Apa lambang kimia air?',
			options: ['H2O', 'CO2', 'NaCl', 'O2'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Planet apa yang disebut Planet Merah?',
			options: ['Venus', 'Mars', 'Jupiter', 'Saturnus'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa bahan alami yang paling keras di bumi?',
			options: ['Emas', 'Besi', 'Berlian', 'Platinum'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa organ terbesar dalam tubuh manusia?',
			options: ['Jantung', 'Hati', 'Otak', 'Kulit'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Gas apa yang diserap tumbuhan dari atmosfer?',
			options: ['Oksigen', 'Nitrogen', 'Karbon Dioksida', 'Hidrogen'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Berapa jumlah tulang pada tubuh manusia dewasa?',
			options: ['186', '206', '226', '256'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Berapa kira-kira kecepatan cahaya?',
			options: ['300.000 km/detik', '150.000 km/detik', '500.000 km/detik', '100.000 km/detik'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Unsur apa yang diwakili oleh "O" pada tabel periodik?',
			options: ['Osmium', 'Oganesson', 'Oksigen', 'Olivin'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa perang dunia ke 2 berakhir?',
			options: ['1943', '1944', '1945', '1946'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Siapa Presiden pertama Amerika Serikat?',
			options: ['John Adams', 'Thomas Jefferson', 'George Washington', 'Benyamin Franklin'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Keajaiban kuno apa yang terletak di Alexandria, Mesir?',
			options: ['Taman Gantung', 'Patung raksasa', 'Mercu suar', 'Kuil Artemis'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Tahun berapa kapal Titanic tenggelam?',
			options: ['1910', '1911', '1912', '1913'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis Mona Lisa?',
			options: ['Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet', 'Vincent van Gogh'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Kerajaan apa yang diperintah oleh Jenghis Khan?',
			options: ['Utsmaniyah', 'Roma', 'Mongol', 'Persia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa benua terluas berdasarkan luasnya?',
			options: ['Afrika', 'Amerika Utara', 'Eropa', 'Asia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota Australia?',
			options: ['Sidney', 'Melbourne', 'Canberra', 'Brisbane'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Sungai manakah yang terpanjang di dunia?',
			options: ['Amazon', 'Nil', 'Mississippi', 'Yangtze'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa negara terkecil di dunia?',
			options: ['Monako', 'Kota Vatikan', 'San Marino', 'Liechtenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara mana yang memiliki danau paling alami?',
			options: ['Amerika Serikat', 'Rusia', 'Kanada', 'Brazil'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa gunung tertinggi di dunia?',
			options: ['K2', 'Kangchenjunga', 'Gunung Everest', 'Lhotse'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film apa yang menampilkan karakter "Forrest Gump"?',
			options: ['Membuang', 'Forrest Gump', 'Mil Hijau', 'Menyelamatkan Prajurit Ryan'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang menulis serial Harry Potter?',
			options: ['J.R.R. Tolkien', 'J.K. Rowling', 'George RR Martin', 'CS Lewis'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Band apa yang membawakan "Bohemian Rhapsody"?',
			options: ['The Beatles', 'Led Zeppelin', 'Ratu', 'Pink Floyd'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa film terlaris sepanjang masa (tidak disesuaikan)?',
			options: ['Pembalas dendam: Permainan Akhir', 'Avatar', 'Raksasa', 'Star Wars: Kekuatan Membangkitkan'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang memerankan Jack Sparrow di Pirates of the Caribbean?',
			options: ['Orlando Bloom', 'Johnny Depp', 'Geoffrey terburu-buru', 'Keira Knightley'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak pemain dalam tim sepak bola standar di lapangan?',
			options: ['9', '10', '11', '12'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Dalam olahraga apa Anda akan melakukan slam dunk?',
			options: ['Bola voli', 'Bola basket', 'Tenis', 'Bulutangkis'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Negara mana yang menjadi tuan rumah Olimpiade Musim Panas 2016?',
			options: ['Cina', 'Inggris Raya', 'Brazil', 'Jepang'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak turnamen tenis Grand Slam yang diadakan setiap tahun?',
			options: ['2', '3', '4', '5'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Olahraga apa yang menggunakan istilah "birdie"?',
			options: ['Tenis', 'Golf', 'Bulutangkis', 'Jangkrik'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Siapa yang ikut mendirikan Apple Inc.?',
			options: ['Bill Gates', 'Steve Jobs', 'Mark Zuckerberg', 'Jeff Bezos'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari "HTTP"?',
			options: [
				'Protokol Transfer Hiperteks',
				'Protokol Transfer Teknologi Tinggi',
				'Program Transmisi HyperTeks',
				'Protokol Teks Transfer Tinggi'
			],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Tahun berapa iPhone pertama dirilis?',
			options: ['2005', '2006', '2007', '2008'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa pemrograman apa yang dikenal sebagai "bahasa web"?',
			options: ['ular piton', 'Jawa', 'JavaScript', 'C++'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari "AI"?',
			options: ['Kecerdasan Otomatis', 'Kecerdasan Buatan', 'Integrasi Tingkat Lanjut', 'Antarmuka Otomatis'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Apa mamalia terbesar di dunia?',
			options: ['Gajah', 'Paus Biru', 'Jerapah', 'Kuda nil'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Berapa banyak kaki yang dimiliki laba-laba?',
			options: ['6', '8', '10', '12'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Hewan darat apa yang tercepat?',
			options: ['Singa', 'kijang', 'Cheetah', 'Kuda'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa hutan hujan terbesar di dunia?',
			options: ['Kongo', 'Amazon', 'Pohon Dain', 'Tongass'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Hewan apa yang dijuluki "Raja Hutan"?',
			options: ['Harimau', 'Gajah', 'Singa', 'Beruang'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Berapa banyak benua yang ada di bumi?',
			options: ['5', '6', '7', '8'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa mata uang Jepang?',
			options: ['Yuan', 'Won', 'Yen', 'Ringgit'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa warna bintang pada bendera Amerika?',
			options: ['Putih', 'Emas', 'Perak', 'Biru'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Berapa hari dalam satu tahun kabisat?',
			options: ['364', '365', '366', '367'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa utama yang digunakan di Brasil?',
			options: ['Spanyol', 'Portugis', 'Perancis', 'Bahasa inggris'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: '"Tibia" ditemukan di bagian tubuh manakah?',
			options: ['Lengan', 'Tangan', 'Kaki', 'Kepala'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari pilihan berikut yang bukan merupakan salah satu fase mitosis?',
			options: ['Metafase', 'Anafase', 'Telofase', 'Diplofase'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa satuan SI standar untuk massa?',
			options: ['Kilogram', 'Ton', 'Pound', 'Gram'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari tulang berikut yang tidak terdapat pada kaki?',
			options: ['Radius', 'Tempurung lutut', 'Tulang kering', 'Tulang betis'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Organisme yang digambarkan sebagai "heliotropik" mempunyai kecenderungan untuk bergerak ke arah yang mana?',
			options: ['Air', 'Lampu', 'Pohon', 'Serbuk sari'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa nama ilusi pendengaran pada nada yang seolah-olah naik tanpa batas?',
			options: ['Ilusi Glissandro', 'Efek Fransen', 'Nada Shepard', 'Efek McGurck'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Unsur manakah yang paling melimpah di alam semesta?',
			options: ['Helium', 'Hidrogen', 'Litium', 'Oksigen'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Bintang sebagian besar terdiri dari hidrogen dan gas apa lagi?',
			options: ['Oksigen', 'Argon', 'Helium', 'Nitrogen'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Berapa jumlah rata-rata gigi yang dimiliki mulut orang dewasa (kecuali gigi bungsu)?',
			options: ['32', '36', '20', '28'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Berapa jumlah planet di Tata Surya kita?',
			options: ['Sembilan', 'Delapan', 'Tujuh', 'Sepuluh'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question:
				'Sindrom Ledakan Helio-Ophthalmic yang Menarik secara autosomal adalah kebutuhan untuk melakukan apa saat melihat Matahari?',
			options: ['Batuk', 'Menguap', 'Bersin', 'Cegukan'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Satelit Landsat manakah yang gagal mencapai orbit?',
			options: ['Landsat 5', 'Landsat 4', 'Landsat 3', 'Landsat 6'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Unsur manakah yang memiliki titik leleh tertinggi?',
			options: ['Tungsten', 'Platinum', 'Osmium', 'Karbon'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Penyakit Alzheimer terutama menyerang bagian tubuh manusia yang mana?',
			options: ['Paru-paru', 'Kulit', 'Jantung', 'Otak'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa satuan SI standar untuk jarak?',
			options: ['Angstrom', 'Kaki', 'Meter', 'Memahami'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa istilah medis untuk gula darah rendah?',
			options: ['Hipotiroidisme', 'Hipotermia', 'Hipoksia', 'Hipoglikemia'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question:
				'Prinsip fisika apa yang menghubungkan jumlah fluks listrik yang keluar dari suatu permukaan tertutup dengan muatan yang tertutup oleh permukaan tersebut?',
			options: ['Hukum Faraday', 'Hukum Gauss', 'Hukum Ampere', 'Hukum Biot-Savart'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa lambang unsur merkuri?',
			options: ['Aku', 'Mc', 'Hai', 'Hg'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Kapan mamalia pertama berhasil dikloning?',
			options: ['2009', '1999', '1996', '1985'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Uranium yang terdapat di alam pada dasarnya terdiri dari isotop apa?',
			options: ['235', '238', '239', '233'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari berikut ini yang merupakan sel sistem kekebalan adaptif?',
			options: ['sel dendritik', 'Sel pembunuh alami', 'Sel darah putih', 'Sel T sitotoksik'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa kepanjangan dari DNA?',
			options: ['Asam Deoksiribogenetik', 'Atom Deoksiribogenetik', 'Asam Detoksik', 'Asam Deoksiribonukleat'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question:
				'Aksioma Pengobatan Pencegahan menyatakan bahwa orang-orang dengan ___ risiko suatu penyakit harus diskrining dan kita harus mengobati ___ dari orang-orang tersebut.',
			options: ['rendah, semuanya', 'rendah, beberapa', 'tinggi, semuanya', 'tinggi, beberapa'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Sabuk asteroid terletak di antara dua planet manakah?',
			options: ['Yupiter dan Saturnus', 'Mars dan Yupiter', 'Merkurius dan Venus', 'Bumi dan Mars'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa pembangkit tenaga listrik sel?',
			options: ['Ribosom', 'Mitokondria', 'banteng merah', 'Inti'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Berapa banyak benda yang setara dengan satu mol?',
			options: ['6,002x10^22', '6,022x10^22', '6,022x10^23', '6,002x10^23'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa unsur pertama pada tabel periodik?',
			options: ['Helium', 'Oksigen', 'Hidrogen', 'Litium'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Unsur yang menyebabkan darah manusia menjadi merah adalah berikut ini?',
			options: ['Tembaga', 'Iridium', 'Kobalt', 'Besi'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Siapa yang pertama kali berhasil mengembangkan vaksin polio pada tahun 1950an?',
			options: ['John F. Enders', 'Thomas Weller', 'Frederick Robbins', 'Jonas Salk'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Gurun manakah yang merupakan satu-satunya gurun di dunia yang menjadi tempat tumbuhnya kaktus "Saguaro"?',
			options: ['Gurun Gobi', 'Gurun Yuma', 'Gurun Arab', 'Gurun Sonora'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Asam isobutilfenilpropanoat lebih dikenal sebagai apa?',
			options: ['Morfin', 'Ibuprofen', 'Ketamin', 'Aspirin'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Gannymede adalah bulan terbesar di planet manakah?',
			options: ['Uranus', 'Neptunus', 'Jupiter', 'Mars'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Dalam skala Scoville, bahan kimia apa yang paling panas?',
			options: ['Capsaicin', 'Dihidrokapsaisin', 'racun kecil', 'Resiniferatoksin'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa yang dimaksud dengan istilah "isolasi" dalam mikrobiologi?',
			options: [
				'Kurangnya nutrisi di lingkungan mikro',
				'Tingkat nitrogen dalam tanah',
				'Menguji efek mikroorganisme tertentu di lingkungan terisolasi, seperti gua',
				'Pemisahan suatu strain dari populasi mikroba hidup yang tercampur secara alami'
			],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa rumus kimia amonia?',
			options: ['CO2', 'NH3', 'NO3', 'CH4'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question:
				'Berapa banyak planet kerdil yang diakui secara resmi di tata surya yang diberi nama sesuai nama dewa Polinesia?',
			options: ['0', '1', '5', '2'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Psikolog Swiss manakah yang identik dengan konsep kepribadian introvert dan ekstrovert?',
			options: ['Jean Piaget', 'Carl Jung', 'Alice Miller', 'Hermann Rorschach'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa racun paling ampuh yang diketahui?',
			options: ['Risin', 'racun botulinum', 'Sianida', 'Asbes'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa nama ilmiah hominin punah yang dikenal sebagai "Lucy"?',
			options: [
				'Australopithecus Africanus',
				'Australopithecus Afarensis',
				'Australopithecus Architeuthis',
				'Australopithecus Antaris'
			],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari berikut ini yang merupakan kodon stop dalam DNA?',
			options: ['BERTINDAK', 'ACA', 'GTA', 'TAA'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Selubung gas komet (yang membentuk ekor) disebut?',
			options: ['Bangunnya', 'Koma', 'Pencucian balik', 'Ablatif'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Berapa banyak planet yang menyusun Tata Surya kita?',
			options: ['7', '9', '8', '6'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Hati manusia mempunyai berapa ruangan?',
			options: ['2', '6', '3', '4'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Es kering merupakan bentuk padat dari zat apa?',
			options: ['Karbon dioksida', 'Nitrogen', 'Amonia', 'Oksigen'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Berapa banyak hati yang dimiliki gurita?',
			options: ['Tiga', 'Satu', 'Dua', 'Empat'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Nama apa yang diberikan untuk semua bayi marsupial?',
			options: ['Anak sapi', 'Anak anjing', 'Joey', 'Anak'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa itu "Stenoma"?',
			options: ['Stimulan tempur dari WW2', 'Genus ngengat', 'Suatu jenis bumbu', 'Sebuah kota pelabuhan di Karibia'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa yang menghasilkan warna hijau pada sebagian besar daun tumbuhan?',
			options: ['Pembiasan cahaya', 'Pigmen alami', 'Klorofil', 'radiasi UV'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Kondisi medis osteoporosis mempengaruhi bagian tubuh mana?',
			options: ['Kulit', 'Otak', 'Tulang', 'Jantung'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari bintang berikut yang terbesar?',
			options: ['VY Canis Majoris', 'Betelgeuse', 'UY Scuti', 'RW Cephei'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak bintang yang ditampilkan di bendera Selandia Baru?',
			options: ['4', '5', '2', '0'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama ibu kota Turki?',
			options: ['Istambul', 'Izmir', 'Ankara', 'Bursa'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara bagian AS manakah yang juga dikenal sebagai "Negara Bagian Lone Star"?',
			options: ['Alabama', 'Tennessee', 'Kentucky', 'Texas'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa kota Polandia yang dikenal oleh orang Jerman sebagai Danzig?',
			options: ['Warsawa', 'Zakopane', 'Gdańsk', 'Poznan'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kota apa yang dikenal sebagai Ibu Kota Mawar Dunia?',
			options: ['San Diego, Kalifornia', 'Miami, Florida', 'Tyler, Texas', 'Anaheim, Kalifornia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara bagian manakah yang merupakan negara bagian terbesar di Amerika Serikat?',
			options: ['Kalifornia', 'Texas', 'Washington', 'Alaska'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Provinsi-provinsi Spanyol berikut ini terletak di wilayah utara Spanyol, kecuali:',
			options: ['Asturias', 'Navarra', 'Leon', 'Murcia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota Bermuda?',
			options: ['Hamilton', 'Santo Dominigo', 'San Juan', 'Havana'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa bahasa resmi di Liechtenstein?',
			options: ['Jerman', 'Perancis', 'Bahasa inggris', 'Italia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara Eropa mana yang bukan bagian dari UE?',
			options: ['Lithuania', 'Irlandia', 'Ceko', 'Norwegia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak negara bagian di Australia?',
			options: ['7', '6', '8', '5'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara Belize berbatasan dengan negara mana?',
			options: ['Laos', 'Guatemala', 'Peru', 'Kenya'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama penduduk asli Selandia Baru?',
			options: ['Viking', 'Polinesia', 'orang Samoa', 'Maori'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Universitas Harvard terletak di kota manakah?',
			options: ['Cambridge', 'Takdir', 'New York', 'Washington D.C.'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara berikut yang TIDAK mengakui Armenia sebagai negara merdeka?',
			options: ['Iran', 'Pakistan', 'Turki', 'Azerbaijan'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara berikut yang merupakan pulau?',
			options: ['Azerbaijan', 'Siprus', 'El Salvador', 'Djibouti'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di wilayah Inggris manakah Stonehenge?',
			options: ['Wiltshire', 'Somerset', 'Cumbria', 'Herefordshire'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa jalur pendakian gunung tertinggi kedua di dunia, K2 yang paling umum?',
			options: ['Garis Ajaib', 'Rute Cesen', 'Abruzzi Memacu', 'Garis Polandia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara apa yang memiliki bendera dua warna merah putih horizontal?',
			options: ['Bahrain', 'Monako', 'Malta', 'Liechtenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara-negara Afrika berikut yang mencantumkan "Spanyol" sebagai bahasa resmi?',
			options: ['Guinea', 'Kamerun', 'Guinea Khatulistiwa', 'Angola'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara manakah yang BUKAN satu-satunya negara yang memulai dengan huruf alfabet tersebut?',
			options: ['Qatar', 'Yaman', 'Zambia', 'Oman'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara manakah yang BUKAN bagian dari Uni Soviet?',
			options: ['Rumania', 'Turkmenistan', 'Belarusia', 'Tajikistan'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Perbatasan bersama terpanjang di dunia dapat ditemukan antara dua negara?',
			options: ['Chili dan Argentina', 'Rusia dan Cina', 'India dan Pakistan', 'Kanada dan Amerika Serikat'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah di antara berikut ini yang BUKAN merupakan lempeng tektonik sungguhan?',
			options: ['Lempeng Amerika Utara', 'Lempeng Eurasia', 'Lempeng Atlantik', 'Piring Nazca'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara berikut yang memiliki jumlah penduduk terkecil?',
			options: ['Slowakia', 'Finlandia', 'Hongkong', 'Norwegia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari pulau-pulau Mediterania berikut yang berada di bawah kekuasaan kedaulatan Prancis?',
			options: ['Mallorca', 'Sardinia', 'Korsika', 'Malta'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari kota-kota Amerika berikut yang berpenduduk kurang dari 1.000.000 orang?',
			options: ['Phoenix, Arizona', 'San Antonio, Texas', 'San Fransisco, Kalifornia', 'Filadelfia, Pennsylvania'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question:
				'Manakah dari negara berikut ini yang bukan negara dengan keanekaragaman hayati besar (megadiverse) - negara yang memiliki banyak spesies endemik di bumi?',
			options: ['Peru', 'Meksiko', 'Thailand', 'Afrika Selatan'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota kabupaten King County, Washington?',
			options: ['Bellevue', 'cakar enum', 'Seattle', 'Skykomish'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di benua manakah negara Angola berada?',
			options: ['Afrika', 'Amerika Selatan', 'Eropa', 'Asia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Museum nasional apa yang akan Anda temukan di Cooperstown, New York?',
			options: [
				'Museum Seni Metropolitan',
				'Hall of Fame Mainan Nasional',
				'Hall of Fame Bisbol Nasional',
				'Museum Seni Modern'
			],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa cara yang benar untuk mengeja ibu kota Hongaria?',
			options: ['Budapest', 'paling baik', 'Bhudapest', 'Budapest'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah kota terbesar di Maroko?',
			options: ['Casablanca', 'Rabat', 'Fes', 'Penjualan'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama asli Kota Ho Chi Minh?',
			options: ['Hanoi', 'Dar Es Salaam', 'Saigon', 'Angkor Wat'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak negara yang berbatasan darat dengan Amerika Serikat?',
			options: ['1', '3', '2', '4'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak pulau yang dimiliki Kuwait?',
			options: ['3', '6', '2', '9'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak negara merdeka di benua Amerika Selatan?',
			options: ['8', '9', '12', '10'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa provinsi terkecil di Kanada?',
			options: ['Brunswick Baru', 'Nova Scotia', 'Yukon', 'Pulau Pangeran Edward'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara berikut yang TIDAK berlokasi di Afrika?',
			options: ['nama Suriname', 'Burkina Faso', 'Mozambik', 'Aljazair'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara manakah yang terkecil di dunia?',
			options: ['Lesoto', 'Kota Monako', 'Kota Vatikan', 'Titania'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa saja empat negara bagian penjuru Amerika?',
			options: [
				'Oregon, Idaho, Nevada, Utah',
				'Kansas, Oklahoma, Arkansas, Louisiana',
				'Utah, Colorado, Arizona, New Meksiko',
				'Dakota Selatan, Minnesota, Nebraska, Iowa'
			],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di manakah lokasi "Gurun Sonora"?',
			options: ['Amerika Utara', 'Amerika Selatan', 'Asia', 'Afrika'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama semenanjung yang berisi Spanyol dan Portugal?',
			options: ['Semenanjung Iberia', 'Semenanjung Eropa', 'Semenanjung Peloponnesia', 'Semenanjung Skandinavia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di Washington, D.C. apa kepanjangan dari "C"?',
			options: ['Kolumbia', 'Kaledonia', 'Korintus', 'Kota'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa kota terbesar dan ibu kota komersial Sri Lanka?',
			options: ['Moratuwa', 'Negombo', 'Kolombo', 'Kandy'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara bagian AS manakah yang paling timur laut?',
			options: ['New York', 'Georgia', 'Maine', 'Florida'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak negara bagian federal yang dimiliki Jerman?',
			options: ['13', '32', '16', '25'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kota Eropa manakah yang memiliki jarak tempuh kanal tertinggi di dunia?',
			options: ['Birmingham', 'Venesia', 'Amsterdam', 'Berlin'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Luas wilayah Turki modern disebut?',
			options: ['Ismuth dari Ottoman', 'Ottoman', 'Anatolia', 'Ismuth dari Anatolia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa kota terpadat di Amerika pada tahun 2015?',
			options: ['New York', 'Kota Meksiko', 'Sao Paulo', 'Los Angeles'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Jenis lemparan apa yang paling umum dilempar oleh pelempar dalam bisbol?',
			options: ['Lambat', 'Orang edan', 'Bola cepat', 'bola palem'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Pemain hoki Wayne Gretzky lahir di provinsi mana di Kanada?',
			options: ['British Columbia', 'Quebec', 'Alberta', 'Ontario'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Tim sepak bola mana yang memenangkan Kejuaraan Copa América 2015?',
			options: ['Chili', 'Argentina', 'Brazil', 'Paraguay'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Josh Mansour adalah bagian dari tim NRL apa?',
			options: ['Penrith Panther', 'Badai Melbourne', 'Ayam Sydney', 'Koboi Queensland Utara'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Di antara tim manakah Jaromir Jagr tidak pernah bermain?',
			options: ['Penduduk Pulau New York', 'Api Calgary', 'Setan New Jersey', 'Bintang Dallas'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Negara manakah yang menjadi tuan rumah Piala Dunia FIFA pada tahun 2006?',
			options: ['Inggris Raya', 'Jerman', 'Brazil', 'Afrika Selatan'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question:
				'Manajer sepak bola mana yang memenangkan lebih banyak trofi dibandingkan manajer lainnya selama masa jabatannya di klub sepak bola Inggris Manchester United?',
			options: ['David Moyes', 'Sir Alex Ferguson', 'Louis van Gaal', 'José Mourinho'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan Daytona 500 1998?',
			options: ['John Anderson', 'Dale Earnhardt', 'Jeff Gordon', 'Michael Walltrip'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari kota-kota Rusia berikut yang TIDAK memiliki stadion yang digunakan di Piala Dunia FIFA 2018?',
			options: ['Rostov-on-Don', 'Yekaterinburg', 'Kaliningrad', 'Vladivostok'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Apa nama afiliasi AHL dari Toronto Maple Leafs?',
			options: ['Toronto Marlies', 'Batu Toronto', 'Argonaut Toronto', 'Paket Serigala Toronto'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari olahraga berikut yang bukan bagian dari triathlon?',
			options: ['Bersepeda', 'Renang', 'Menunggang Kuda', 'Berlari'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Di jembatan manakah perlombaan perahu tahunan Oxford dan Cambridge dimulai?',
			options: ['Putney', 'Penempa', 'Vauxhall', 'Laut Batter'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: '"Stadium of Light" adalah stadion kandang tim sepak bola yang mana?',
			options: ['Sunderland FC', 'BarcelonaFC', 'Paris Saint-Germain', 'Manchester United'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question:
				'Pada tahun berapa Steaua București memenangkan Piala Eropa, sebenarnya Liga Champions UEFA, melawan FC Barcelona?',
			options: ['1986', '1990', '1982', '1989'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Dalam olahraga apa Fanny Chmelar berkompetisi untuk Jerman?',
			options: ['Renang', 'Pertunjukan', 'Bermain ski', 'Olahraga senam'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak trofi Liga Premier yang dimenangkan Sir Alex Ferguson selama berada di Manchester United?',
			options: ['11', '13', '20', '22'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan Grand Prix San Marino 1994, balapan yang menewaskan Ayrton Senna?',
			options: ['Michael Schumacher', 'Nicola Larini', 'Gerhard Berger', 'Mika Hakkinen'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang dilewati Drew Brees sepanjang masa passing NFL pada tahun 2018?',
			options: ['Peyton Manning', 'Tom Brady', 'Dan Marino', 'Joe Montana'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa pemenang Kejuaraan Dunia Formula 1 2015?',
			options: ['Nico Rosberg', 'Lewis Hamilton', 'Sebastian Vettel', 'Tombol Jenson'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Dalam Bisbol, berapa kali bola harus dilempar ke luar zona serang sebelum pemukul dilempar?',
			options: ['1', '2', '4', '3'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Mengapa The Green Monster di Fenway Park pertama kali dibangun?',
			options: [
				'Untuk membuat perjalanan pulang menjadi lebih sulit.',
				'Untuk mencegah melihat permainan dari luar taman.',
				'Untuk menampilkan iklan.',
				'Untuk menyediakan tempat duduk tambahan.'
			],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Tim sepak bola mana yang memenangkan Copa América Centenario 2016?',
			options: ['Argentina', 'Brazil', 'Chili', 'Kolumbia'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Siapa pemenang Kejuaraan Pembalap Dunia Formula 1 2016?',
			options: ['Nico Rosberg', 'Lewis Hamilton', 'Max Verstappen', 'Kimi Raikkonen'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Di negara manakah Olimpiade Musim Dingin 2014 diadakan di kota Sochi?',
			options: ['Korea Selatan', 'Rusia', 'Norwegia', 'Kanada'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang dianggap sebagai pesepakbola Rumania terbaik sepanjang masa?',
			options: ['Cristian Chivu', 'Gheorghe Hagi', 'Nicolae Dobrin', 'Gheorghe Popescu'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari cabang olahraga atletik berikut yang TIDAK termasuk dalam dasalomba putra Olimpiade?',
			options: ['Lompat galah', 'Lompat jauh', 'Lemparan palu', 'Tolak peluru'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak Prancis Terbuka yang dimenangkan Björn Borg?',
			options: ['4', '9', '6', '2'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: "Logo perusahaan pakaian olahraga Jerman manakah yang berlogo 'Formstripe'?",
			options: ['Nike', 'Adidas', 'Reebok', 'Puma'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Berapa kali Martina Navratilova memenangkan Kejuaraan Tunggal Wimbledon?',
			options: ['Sepuluh', 'Tujuh', 'Sembilan', 'Delapan'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Apa tim tertua di NFL?',
			options: ['Beruang Chicago', 'Kardinal Arizona', 'Pengemas Teluk Hijau', 'Raksasa New York'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapakah pemain putra peraih medali emas tunggal tenis meja Olimpiade 2016?',
			options: ['Zhang Jike (Tiongkok)', 'Jun Mizutani (Jepang)', 'Ma Long (Tiongkok)', 'Vladimir Samsonov (Belarus)'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Siapa pencetak gol terbanyak Manchester United di liga utama?',
			options: ['Tuan Bobby Charlton', 'Ryan Giggs', 'David Beckham', 'Wayne Rooney'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang paling banyak memainkan turnamen di tim nasional sepak bola Jerman?',
			options: ['Miroslav Klose', 'Philipp Lahm', 'Lothar Matthäus', 'Oliver Kahn'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Alat apa yang membuat namanya menjadi keunggulan terakhir dalam Curling?',
			options: ['Kunci', 'Palu', 'Mengebor', 'Obeng'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan Liga Champions UEFA pada tahun 2016?',
			options: ['FC Bayern Munchen', 'Real Madrid C.F.', 'Atlético Madrid', 'Manchester City F.C.'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa pemain yang paling banyak mencetak gol di Liga Utama Inggris (EPL)?',
			options: ['Wayne Rooney', 'Alan Shearer', 'Lionel Messi', 'Didier Drogba'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Dengan siapa Steven Gerrard memenangkan Liga Champions?',
			options: ['Real Madrid', 'Liverpool', 'Chelsea', 'Kota Man'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa pembalap Formula 1 yang berpindah tim pada pertengahan musim 2017?',
			options: ['Carlos Sainz Jr.', 'Daniil Kvyat', 'Jolyon Palmer', 'Rio Haryanto'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari pemain berikut yang mencetak hat-trick selama debut mereka di Manchester United?',
			options: ['Wayne Rooney', 'Cristiano Ronaldo', 'Robin Van Persie', 'David Beckham'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari turnamen tenis Grand Slam berikut yang berlangsung TERAKHIR?',
			options: ['AS Terbuka', 'Prancis Terbuka', 'Wimbledon', 'Australia Terbuka'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan gelar liga premier pada musim 2015-2016 setelah menjalankan kisah dongeng?',
			options: ['Tottenham Hotspur', 'Watford', 'Stoke City', 'Kota Leicester'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Pada tahun berapa Jenson Button memenangkan Kejuaraan Pembalap Dunia Formula Satu untuk pertama kalinya?',
			options: ['2010', '2007', '2009', '2006'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak pertandingan Arsenal FC yang tidak terkalahkan selama Liga Premier Inggris musim 2003-2004',
			options: ['51', '49', '22', '38'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Tim bola basket mana yang paling banyak menghadiri grand final NBA?',
			options: ['Boston Celtics', 'Filadelfia 76ers', 'Prajurit Negara Emas', 'Los Angeles Lakers'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan Liga Champions UEFA pada tahun 2017?',
			options: ['Real Madrid C.F.', 'Atlético Madrid', 'AS Monaco FC', 'Juventus F.C.'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Dalam permainan snooker, bola warna apa yang bernilai 3 poin?',
			options: ['Hijau', 'Kuning', 'Cokelat', 'Biru'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question:
				'Pada tahun 2016, siapa yang memenangkan Kejuaraan Konstruktor Dunia Formula 1 untuk ketiga kalinya berturut-turut?',
			options: ['Scuderia Ferrari', 'McLaren Honda', 'Mercedes-AMG Petronas', 'Renault Balap Banteng Merah'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Pada Piala Dunia FIFA 2014, berapa skor akhir pertandingan Brazil - Jerman?',
			options: ['1-5', '1-6', '1-7', '2-6'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Negara mana yang menjadi tuan rumah Piala Dunia FIFA 2022?',
			options: ['Amerika Serikat', 'Qatar', 'Jepang', 'Swiss'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Tim afiliasi AHL Boston Bruins diberi nama apa?',
			options: ['Bruin New Haven', 'Cambridge Bruins', 'Hartford Bruins', 'Providence Bruins'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Berapa banyak spesies hyena yang masih hidup dan diketahui?',
			options: ['8', '2', '4', '6'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Berapa jumlah gigi kelinci dewasa?',
			options: ['30', '26', '24', '28'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa kata benda kolektif untuk sekelompok burung gagak?',
			options: ['Mengemas', 'Pembunuhan', 'Kawanan', 'Kawanan'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Di antara hewan berikut, manakah yang BUKAN kadal?',
			options: ['Naga Komodo', 'Gila Rakasa', 'Iguana Hijau', 'Tuatara'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Spesies manakah yang termasuk "ayam gunung"?',
			options: ['Ayam', 'Kuda', 'Terbang', 'Katak'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa burung nasional Bahrain?',
			options: ['Bulbul', 'burung kolibri', 'Elang', 'Burung gereja'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Hewan darat apa yang tercepat?',
			options: ['Singa', 'Cheetah', 'Gazelle Thomson', 'Antelop Pronghorn'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Spesies Beruang Coklat manakah yang tidak punah?',
			options: ['Beruang Grizzly Kalifornia', 'Beruang Coklat Suriah', 'Beruang Atlas', 'Beruang Grizzly Meksiko'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Berapa banyak kaki yang dimiliki kupu-kupu?',
			options: ['6', '2', '4', '0'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Kelas hewan manakah yang termasuk dalam kadal air?',
			options: ['Ikan', 'Reptil', 'Mamalia', 'Amfibi'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa ular berbisa terpanjang di dunia?',
			options: ['Anakonda Hijau', 'Pedalaman Taipan', 'Raja Kobra', 'Ular Laut Perut Kuning'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Manakah dari spesies berikut yang tidak punah?',
			options: ['Singa laut Jepang', 'Harimau Tasmania', 'Komodo', 'Kijang Saudi'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah cheetah?',
			options: ['Panthera onca', 'Lynx rufus', 'Felis catus', 'Acinonyx jubatus'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa nama Serigala Etiopia sebelum mereka mengetahui hubungannya dengan serigala?',
			options: ['Simien Jackel', 'Coyote Etiopia', 'Rubah Amharik', 'Canis Simiensis'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Hewan apa yang tercepat?',
			options: ['Elang Peregrine', 'Elang Emas', 'Cheetah', 'Langau'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Jenis makhluk apakah Bonobo itu?',
			options: ['Singa', 'Burung beo', 'Kucing garong', 'Kera'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah Serigala Abu-abu?',
			options: ['Canis Aureus', 'Canis Latrans', 'Canis Lupus', 'Canis Lupus Lycaon'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Yang merupakan hewan nasional India?',
			options: ['Singa', 'Kuda', 'Harimau', 'Unta'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Hipokampus adalah nama latin makhluk laut yang manakah?',
			options: ['Lumba-lumba', 'Paus', 'Gurita', 'kuda laut'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa kata benda kolektif untuk beruang?',
			options: ['Melaju', 'Suku', 'Kemalasan', 'Sekam'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Wombat berasal dari negara mana?',
			options: ['Selandia Baru', 'Papua Nugini', 'Australia', 'Palau'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa nama tempat tinggal kelinci?',
			options: ['Liang', 'Sarang', 'Sarang', 'Gerobak'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Berbeda dengan salamander kebanyakan, bagian kadal air ini berbentuk datar?',
			options: ['Kepala', 'Gigi', 'Kaki', 'Ekor'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: '"Dekapoda" adalah ordo krustasea berkaki sepuluh.  Manakah dari berikut ini yang BUKAN berkaki sepuluh?',
			options: ['Lobster', 'Udang', 'Krill', 'Kepiting'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Spesies "Thylacine" yang sekarang sudah punah berasal dari mana?',
			options: ['Baluchistan, Pakistan', 'Tasmania, Australia', 'Wallachia, Rumania', 'Oregon, Amerika Serikat'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Kākāpō adalah burung beo besar, tidak bisa terbang, dan aktif di malam hari yang berasal dari negara mana?',
			options: ['Selandia Baru', 'Afrika Selatan', 'Australia', 'Madagaskar'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Ular dan Kadal Diketahui Menjentikkan Lidahnya, Inikah Perilakunya?',
			options: ['Menangkap partikel aroma', 'Rasakan udara manis', 'Mengancam spesies lain', 'Menarik pasangan wanita'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Manakah di antara koloni berikut yang merupakan koloni polip dan bukan ubur-ubur?',
			options: ['Tawon Laut', 'Irukandji', 'Jelatang Laut', 'Tokoh Perang Portugis'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa nama lebah jantan yang berasal dari telur yang tidak dibuahi?',
			options: ['Tentara', 'Pekerja', 'Dengung', 'Pria'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Berapa banyak makanan yang dimakan berang-berang laut dari berat badannya setiap hari?',
			options: ['10%', '80%', '45%', '25%'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa kata benda kolektif untuk tikus?',
			options: ['Mengemas', 'Balapan', 'Melayang', 'Kerusakan'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: "Apa warna Steller's Jay?",
			options: ['biru dan abu-abu', 'biru dan hitam', 'biru dan putih', 'abu-abu dan hitam'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Mengapa hyena tutul akan "tertawa"?',
			options: ['Kegembiraan', 'Gugup', 'Agresi', 'Kelelahan'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah "Beruang Kutub"?',
			options: ['Beruang Kutub', 'Ursus Maritimus', 'Ursus Spelaeus', 'Ursus Arctos'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Penyakit Wasting Kronis (CWD) hanya menginfeksi anggota famili hewan manakah?',
			options: ['Hominid', 'Felid', 'canids', 'Cervid'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Keluarga Hyaenidae termasuk dalam subordo ilmiah apa?',
			options: ['Feliformia', 'Haplorini', 'Kaniformia', 'Ciconiiformes'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Terbuat dari apakah sisik pada semua ular dan sebagian besar kadal?',
			options: ['Keratin', 'Eksdisis', 'Kulit ari', 'Ankyloglossia'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Masakan Fugu terbuat dari ikan keluarga apa?',
			options: ['Bas', 'Ikan salmon', 'Ikan kembung', 'Ikan buntal'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Ras anjing ini merupakan salah satu ras anjing tertua dan telah berkembang sejak sebelum tahun 400 SM.',
			options: ['Bulldog', 'anjing pug', 'petinju', 'Chihuahua'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Menurut definisinya, di mana hewan abisopelagis hidup?',
			options: ['Di dasar lautan', 'Di padang pasir', 'Di puncak gunung', 'Di dalam pohon'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Semua mamalia, burung, dan reptil termasuk dalam filum biologis?',
			options: ['Echinodermata', 'Annelida', 'Chordata', 'Placazoa'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Jenis hewan apa yang dimaksud dengan natterjack?',
			options: ['Burung', 'Ikan', 'Serangga', 'Katak'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa istilah umum untuk bovine spongiform encephalopathy (BSE)?',
			options: ['penyakit Weil', 'Penyakit Sapi Gila', 'Demam susu', 'Penyakit mulut dan kuku'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Apa nama keluarga yang menjadi anggota kucing peliharaan tersebut?',
			options: ['kucing', 'Felis', 'Felidae', 'Kucing'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Hewan apa yang menjadi bagian dari eksperimen domestikasi Rusia pada tahun 1959?',
			options: ['Merpati', 'Beruang', 'Buaya', 'Rubah'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa arti "kuda nil" dan dalam bahasa apa?',
			options: ['Kuda Sungai (Latin)', 'Babi Gemuk (Yunani)', 'Kuda Sungai (Yunani)', 'Babi Gemuk (Latin)'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Cula badak terbuat dari apa?',
			options: ['Tulang', 'Gading', 'Keratin', 'Kulit'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Manakah dari pernyataan berikut yang benar jika aligator berperilaku teritorial?',
			options: [
				'Buka rahangnya sambil mengeluarkan bunyi klik',
				'Mereka mengerahkan kekuatan penuh saat menghadapi ancaman',
				'Mereka berteriak sambil memperlihatkan ekor dan lehernya',
				'Menampar ekor mereka ke tanah'
			],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa warna burung hitam betina?',
			options: ['Hitam', 'Cokelat', 'Putih', 'Kuning'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Apa warna/warna kulit beruang kutub?',
			options: ['Hitam', 'Putih', 'Berwarna merah muda', 'Hijau'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Menurut cerita rakyat Algonquian, bagaimana seseorang bisa berubah menjadi Wendigo?',
			options: [
				'Berpartisipasi dalam kanibalisme.',
				'Mutilasi berlebihan terhadap bangkai hewan.',
				'Melakukan ritual yang melibatkan pembunuhan.',
				'Meminum darah banyak hewan yang disembelih.'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Tokoh mitologi Yunani ini antara lain adalah dewa/dewi strategi pertempuran.',
			options: ['Ares', 'Athena', 'Artemis', 'Apollo'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dewa Yunani Poseidon adalah dewa apa?',
			options: ['Laut', 'Perang', 'Matahari', 'Api'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa dalam mitologi Yunani yang memimpin para Argonaut mencari Bulu Domba Emas?',
			options: ['jarak', 'Daedalus', 'Jason', 'Odiseus'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Tokoh mana dalam mitologi Yunani yang melakukan perjalanan ke dunia bawah untuk mengembalikan istrinya Eurydice ke dunia orang hidup?',
			options: ['Hercules', 'Perseus', 'Orpheus', 'Daedalus'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Berapa banyak kepala yang dimiliki Cerberus?',
			options: ['2', '1', '5', '3'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam sebagian besar tradisi, siapakah istri Zeus?',
			options: ['Afrodit', 'Hera', 'Athena', 'Hestia'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Hera adalah dewa...',
			options: ['Pertanian', 'Pernikahan', 'Laut', 'Perang'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam mitologi Yunani, Persephone harus kembali ke dunia bawah karena dia telah memakan benih apa?',
			options: ['Bunga matahari', 'Oranye', 'Ara', 'Delima'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa yang dikalahkan Hippomenes dalam lomba lari?',
			options: ['Atalanta', 'Peleus', 'Theseus', 'Jason'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa nama manusia liar yang berteman dan bertualang dengan Gilgamesh?',
			options: ['Ishtar', 'Inanna', 'Aga', 'Enkidu'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam Mitologi Nordik, Baldr dibunuh oleh Loki dengan tombak ajaib yang terbuat dari tumbuhan apa?',
			options: ['Mistletoe', 'Kutukan Serigala', 'Buckthorn', 'hemlock'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari dewa-dewa Romawi berikut yang tidak memiliki padanannya dalam mitologi Yunani?',
			options: ['gunung berapi', 'Juno', 'Janus', 'Mars'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapakah putra Dewa Loki?',
			options: ['Odin', 'Fenrir', 'Halo', 'Sigin'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Menurut Mitos Mesir tentang Osiris, siapa yang membunuh Osiris?',
			options: ['Horus', 'Mengatur', 'Ra', 'Anhur'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari makhluk mitologi berikut yang dikatakan setengah manusia dan setengah kuda?',
			options: ['Minotaur', 'Pegasus', 'Gorgon', 'Centaurus'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Hippogriff, jangan bingung dengan Griffon, adalah makhluk ajaib dengan bagian depan elang, dan bagian belakang apa?',
			options: ['Seekor Naga', 'Seekor Kuda', 'Seekor Harimau', 'Seekor Singa'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Yang merupakan dewa kecil yang menjadi pelindung dan pencipta berbagai seni, seperti pembuatan keju dan pemeliharaan lebah.',
			options: ['otonom', 'Carme', 'Aristaeus', 'Cephisso'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Nama Yunani Neptunus adalah...',
			options: ['Ares', 'Zeus', 'Poseidon', 'Apollo'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dewa perang Romawi kuno umumnya dikenal sebagai dewa perang berikut ini?',
			options: ['Jupiter', 'Juno', 'Ares', 'Mars'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa Raja Para Dewa dalam mitologi Yunani Kuno?',
			options: ['Apollo', 'Hermes', 'Zeus', 'Poseidon'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari berikut ini yang BUKAN dewa dalam Mitologi Norse.',
			options: ['Loki', 'Jen', 'Tir', 'ingusan'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Nidhogg adalah makhluk mitos dari mitologi apa?',
			options: ['Mesir', 'Norse', 'Orang yunani', 'Hindu'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Menurut cerita rakyat Jepang, makanan apa yang menjadi favorit para Kappa.',
			options: ['mentimun', 'Kabocha', 'Nasu', 'Soba'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Hel adalah putri dari tokoh Mitologi Norse yang mana?',
			options: ['Thor', 'Loki', 'Odin', 'Botak'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Struktur raksasa apa yang disebut dalam Mitologi Norse sebagai Yggdrasil.',
			options: ['Gunung', 'Pohon', 'Kuil', 'Kastil'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam Mitologi Norse, apa nama simbol yang biasa disebut dengan "Pohon Kehidupan"?',
			options: ['Ymir', 'Pohon Bumi', 'Yggdrasil', 'Akar Odin'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Apa nama dewa kematian damai Yunani?',
			options: ['Thanatos', 'neraka', 'neraka', 'orang bodoh'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Talos, manusia perunggu raksasa dalam mitos, adalah pelindung pulau yang mana?',
			options: ['Sardinia', 'Kreta', 'Sisilia', 'Siprus'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapakah satu-satunya dewa dari Yunani yang tidak mendapat perubahan nama di Roma?',
			options: ['Demeter', 'Zeus', 'Athena', 'Apollo'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari berikut ini yang bukan merupakan salah satu Takdir Yunani?',
			options: ['pakaian', 'Atropos', 'Lachesis', 'Narsisis'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa dewa reproduksi dan selada Mesir?',
			options: ['Menu', 'Minimal', 'Mut', 'Meret'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Minotaur itu setengah manusia setengah apa?',
			options: ['Sapi', 'Kuda', 'Banteng', 'Burung rajawali'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam Mitologi Yunani, siapakah putri Raja Minos?',
			options: ['Athena', 'Ariel', 'Ariadne', 'Alana'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Dewa/dewi Yunani manakah yang melemparkan apel emas bertuliskan "untuk yang tercantik" di tengah pesta para dewa?',
			options: ['neraka', 'Ares', 'Artemis', 'Eris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Kelemahan Achilles apa yang diungkapkan oleh pangeran Troya, Paris?',
			options: ['Leher', 'Kembali', 'Anak sapi', 'Tumit'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam mitologi Afrika, Anansi adalah penipu dan pendongeng yang berwujud binatang apa?',
			options: ['Anjing liar', 'Monyet', 'Laba-laba', 'Buaya'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Ankh adalah Hieroglif Mesir untuk apa?',
			options: ['Cinta', 'Kehidupan', 'Kebencian', 'Racun'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Hewan apa yang ditiduri Ratu Pasipahe sebelum melahirkan Minotaur dalam Mitologi Yunani?',
			options: ['Banteng', 'Babi', 'Sapi', 'Kuda'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa dewa api Romawi?',
			options: ['gunung berapi', 'Apollo', 'Jupiter', 'Air raksa'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam mitologi Yunani, siapakah dewa anggur?',
			options: ['Hephaestus', 'Demeter', 'Apollo', 'Dionysus'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam Mitologi Yunani, siapa yang membunuh Achilles?',
			options: ['Hektor', 'Helen', 'Perikel', 'Paris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Merek pakaian dan alas kaki Nike mengambil namanya dari dewi Yunani apa?',
			options: ['Keberanian', 'Kemenangan', 'Kekuatan', 'Menghormati'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Suku Maori berpendapat negara kepulauan manakah yang didirikan oleh Kupe, yang menemukannya di bawah awan putih panjang?',
			options: ['Vanuatu', 'Selandia Baru', 'Fiji', 'Hawai'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapakah ayah Icarus yang terbang terlalu dekat dengan matahari?',
			options: ['Mino', 'Daedalus', 'Perseus', 'Zeus'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa dewa perang dalam mitologi Polinesia?',
			options: ['Hina', "'Oro", 'Kohara', 'Maui'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Makhluk mitologi apa yang memiliki wajah perempuan dan tubuh burung nasar?',
			options: ['Putri duyung', 'Harpy', 'Peri', 'Lilith'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dewa Norse manakah yang memiliki kuda bernama Sleipnir?',
			options: ['Thor', 'sialan', 'Botak', 'Odin'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dari mitologi manakah dewa "Apollo" berasal?',
			options: ['Yunani dan Romawi', 'Romawi dan Spanyol', 'Yunani dan Cina', 'Yunani, Romawi dan Norse'],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Siapa nama manusia pertama dalam mitologi Nordik?',
			options: ['Asmund', 'Bertanya', 'Ake', 'Asger'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Produsen mobil mana yang melepaskan hak paten sabuk pengamannya demi menyelamatkan nyawa?',
			options: ['Ferrari', 'volvo', 'Mengarungi', 'Renault'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Pabrikan mobil manakah yang menciptakan "Aventador"?',
			options: ['Ferrari', 'lamborghini', 'Pagani', 'Bugatti'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Di antara merek otomotif berikut, manakah yang berasal dari Swedia?',
			options: ['mercedes', 'volvo', 'Akura', 'Lincoln'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Hewan apa yang tergambar pada logo pabrikan mobil Porsche?',
			options: ['Banteng', 'Singa', 'Kuda', 'Cheetah'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Mesin LS2 berapa inci kubik?',
			options: ['346', '376', '402', '364'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Produsen mobil Italia Lamborghini menggunakan hewan apa sebagai logonya?',
			options: ['Banteng', 'Kelelawar', 'Kuda', 'Ular'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Dimana mobil merek "Ferrari" diproduksi?',
			options: ['Rumania', 'Jerman', 'Rusia', 'Italia'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Kapan Tesla didirikan?',
			options: ['2008', '2005', '2007', '2003'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Model mobil sport apa yang diberikan kepada Yuri Gagarin oleh pemerintah Prancis pada tahun 1965?',
			options: ['Matra Djet', 'Porsche 911', 'Alpen A110', 'AC Kobra'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Apa nama mobil listrik Nissan yang paling populer?',
			options: ['Daun', 'Pohon', 'Rusa', 'Akar'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari jet penumpang berikut yang paling panjang?',
			options: ['Airbus A350-1000', 'Airbus A330-200', 'Boeing 787-10', 'Boeing 747-8'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Mobil manakah yang merupakan kendaraan hybrid pertama yang diproduksi secara massal?',
			options: ['ToyotaPrius', 'Chevrolet Volt', 'Honda Fit', 'Peugeot 308 R hibrida'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Pada tahun 2014, lebih dari 6 juta kendaraan General Motors ditarik kembali karena cacat kritis apa?',
			options: ['Pedal gas tidak berfungsi', 'Memutuskan saluran bahan bakar', 'Saklar pengapian rusak', 'Bantalan rem rusak'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Perbedaan panjang Boeing 777-300ER dan Airbus A350-1000 paling mendekati:',
			options: ['1m', '10m', '100m', '0,1m'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Mesin LS1 berapa inci kubik?',
			options: ['350', '346', '355', '360'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Apa yang diwakili oleh 4 Cincin pada Logo Audi?',
			options: [
				'Negara tempat Audi menghasilkan penjualan terbanyak',
				'Kota-kota utama yang penting bagi Audi',
				'Negara tempat Audi menghasilkan penjualan terbanyak',
				'Produsen mobil yang sebelumnya independen'
			],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Mobil yang diproduksi oleh Tesla Motors beroperasi dengan bentuk energi apa?',
			options: ['Listrik', 'Bensin', 'solar', 'Nuklir'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question:
				'Bagian mana dari mesin mobil yang menggunakan lobus untuk membuka dan menutup katup masuk dan katup buang, serta memungkinkan campuran udara/bahan bakar masuk ke dalam mesin?',
			options: ['Piston', 'Batang penggerak', 'poros bubungan', 'Poros engkol'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question:
				'Manakah dari negara berikut yang secara resmi melarang penggunaan kamera dasbor oleh warga sipil di dalam mobil?',
			options: ['Amerika Serikat', 'Ceko', 'Korea Selatan', 'Austria'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Apa nama mobil berpenggerak roda depan pertama yang diproduksi oleh Datsun (sekarang Nissan)?',
			options: ['Ceri', 'Cerah', 'Blue Bird', 'Kaki langit'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari model mobil berikut yang diproduksi oleh Lamborghini?',
			options: ['Huayra', 'Aventador', '918', 'Chiron'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Manakah yang BUKAN fungsi oli mesin pada mesin mobil?',
			options: ['Pembakaran', 'Pelumasan', 'Pendinginan', 'Mengurangi korosi'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Mesin LS3 berapa inci kubik?',
			options: ['346', '376', '364', '427'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question:
				'Julukan apa yang diberikan kepada Air Canada Penerbangan 143 setelah kehabisan bahan bakar dan meluncur ke tempat aman pada tahun 1983?',
			options: ['Gimli Microlight', 'Gimli Chaser', 'Gimli Glider', 'Gimli Luar Biasa'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari produsen mobil berikut yang menamai perangnya dengan nama perang tersebut?',
			options: ['Toyota', 'Honda', 'Mengarungi', 'Volkswagen'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Di negara mana Trabant 601 diproduksi?',
			options: ['Uni Soviet', 'Hongaria', 'Jerman Timur', 'Perancis'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Apa registrasi pesawat untuk Concorde terakhir yang dibuat?',
			options: ['F-BTSC', 'G-BOAC', 'F-BVFF', 'G-BOAF'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Saat perang dunia ke 2, tank apa yang paling ditakuti oleh sekutu?',
			options: ['Marder III', 'Mks Matilda II', 'PanzerKampfwagen VI Harimau', 'PanzerKampfwagen V Panther'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari berikut ini yang BUKAN merupakan sub-perusahaan dari Grup Volkswagen?',
			options: ['opel', 'Porsche', 'Bugatti', 'Bentley'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari mobil berikut yang TIDAK dianggap sebagai salah satu dari 5 Supercar Modern karya Ferrari?',
			options: ['Enzo Ferrari', 'Testarossa', 'F40', '288 GTO'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Kapan Cadillac didirikan?',
			options: ['1902', '1964', '1898', '1985'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Tahun berapa truk mini Chevrolet LUV memulai debutnya?',
			options: ['1982', '1975', '1973', '1972'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: "Lokomotif 'Big Boy' Union Pacific berikut ini yang mana yang dikembalikan ke kondisi kerja pada tahun 2019?",
			options: ['4012', '4004', '4000', '4014'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question:
				'Enzo Ferrari awalnya adalah seorang pembalap mobil untuk pabrikan apa sebelum mendirikan perusahaan mobilnya sendiri?',
			options: ['Serikat Otomatis', 'Alfa Romeo', 'Mercedes-Benz', 'Bentley'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari berikut ini yang BUKAN merupakan pabrikan mobil Rusia?',
			options: ['BYD', 'diam', 'Naga', 'GAS'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Lengkapi analogi berikut: Audi dengan Volkswagen seperti Infiniti dengan ?',
			options: ['Nissan', 'Honda', 'Hyundai', 'Subaru'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Perusahaan Jepang manakah yang merupakan produsen sepeda motor terbesar di dunia?',
			options: ['yamaha', 'Suzuki', 'Kawasaki', 'Honda'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Berapa tenaga kuda yang dihasilkan Lokomotif SD40-2?',
			options: ['3.200', '2.578', '2.190', '3.000'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Di negara manakah supercar Hussarya buatan pabrikan mobil "Arrinera" dirakit?',
			options: ['Cina', 'Swedia', 'Italia', 'Polandia'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Teknologi Variable Valve Timing apa yang digunakan BMW?',
			options: ['VVT-iw', 'VANOS', 'VVEL', 'MultiUdara'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Kendaraan apa yang pertama kali dilengkapi AC sebagai standar pabrik?',
			options: ['Makanan', 'paket', 'Mengarungi', 'Hudson'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Merek mobil manakah yang BUKAN milik General Motors?',
			options: ['Mengarungi', 'Buick', 'mobil cadillac', 'Chevrolet'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Kereta Inggris apa yang TIDAK melebihi 125MPH?',
			options: ['Kelas 43', 'Lembing', 'Pendolino', 'Pelari cepat'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question:
				'Jenis kereta apa Stepney itu, kereta di Bluebell Railway yang terkenal karena penampilannya di "The Railway Series"?',
			options: ['LB&SCR E2', 'LB & SCR J1', 'LB&SCR D1', 'LB&SCR A1X'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Apa sajakah bagian seperti silinder yang memompa ke atas dan ke bawah di dalam mesin?',
			options: ['Piston', 'Mata Air Daun', 'Radiator', 'ABS'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Mesin LS7 berapa inci kubik?',
			options: ['346', '427', '364', '376'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari kode sasis berikut yang digunakan oleh BMW 3-series?',
			options: ['E39', 'E46', 'E85', 'F10'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Audi mana yang tidak menggunakan sistem penggerak semua roda berbasis Haldex?',
			options: ['Audi A8', 'Audi TT', 'Audi S3', 'Audi A3'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: "Kota Italia manakah yang menjadi rumah bagi produsen mobil 'Fiat'?",
			options: ['Maranello', 'Turin', 'Modena', 'Roma'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari sistem penghindaran tabrakan berikut yang membantu pesawat menghindari tabrakan satu sama lain?',
			options: ['GPWS', 'TCAS', 'OCAS', 'TAWS'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'Apa nama kapal mata-mata Angkatan Laut Amerika yang diserang dan ditangkap oleh pasukan Korea Utara pada tahun 1968?',
			options: ['USS Carolina Utara', 'USS Pueblo', 'Konstitusi USS', 'USS Indianapolis'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Siapa pencipta minuman ringan tersebut, Dr. Pepper?',
			options: ['James Wellington', 'Charles Alderton', 'Johnson Hinsin', 'Boris Heviltik'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa Kanada didirikan?',
			options: ['1867', '1798', '1859', '1668'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Marsekal lapangan Jerman manakah yang dikenal sebagai `Rubah Gurun`?',
			options: ['Ernst Busch', 'Erwin Rommel', 'Wolfram Freiherr von Richthofen', 'Daftar Wilhelm'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Kapan Revolusi Perancis dimulai?',
			options: ['05 Mei 1789', '12 April 1789', '05 April 1789', '06 Mei 1799'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Berapa umur Raja Henry V ketika dia meninggal?',
			options: ['62', '35', '87', '73'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Perang apa yang membuat George Orwell menjadi sukarelawan dan hampir mati di dalamnya?',
			options: ['Perang Dunia I', 'Perang Saudara Spanyol', 'Perang Dunia II', 'Perang Saudara Rusia'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Lambang Raja Spanyol berisi lambang raja Castilla, Leon, Aragon, dan bekas kerajaan Iberia lainnya?',
			options: ['Galicia', 'Granada', 'Catalonia', 'Navarra'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Apa pertempuran satu hari paling berdarah selama Perang Saudara Amerika?',
			options: ['Pengepungan Vicksburg', 'Pertempuran Gettysburg', 'Pertempuran Chancellorsville', 'Pertempuran Antietam'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question:
				'Negara manakah di Amerika Selatan yang berperang melawan Inggris Raya atas Kepulauan Falkland pada tahun 1982?',
			options: ['Brazil', 'Argentina', 'Chili', 'Venezuela'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa perusahaan video game Electronic Arts didirikan?',
			options: ['1982', '1999', '1981', '2005'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Siapakah kaisar Romawi terakhir pada Tahun Empat Kaisar (69 M)?',
			options: ['Vespasianus', 'Vitellius', 'Oto', 'Galba'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Di negara manakah Patung Liberty dibangun dan diekspor ke Amerika Serikat?',
			options: ['Perancis', 'Jerman', 'Spanyol', 'Inggris'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Peristiwa bersejarah apa yang dirujuk dalam Pembukaan Tchaikovsky tahun 1812?',
			options: ['Perang Napoleon', 'Perang Amerika tahun 1812', 'Revolusi Rusia', 'Tuduhan Brigade Cahaya (Perang Krimea)'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Negara manakah yang terpetakan lautnya pada tahun 1500 oleh penjelajahan maritim Portugis?',
			options: ['Brazil', 'India', 'Mozambik', 'Madagaskar'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa Perang Dunia Pertama dimulai?',
			options: ['1914', '1930', '1917', '1939'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Istilah Luddite awalnya diterapkan pada pekerja yang tidak puas di industri apa?',
			options: ['Tekstil', 'Pertanian', 'Pertambangan', 'Keramik'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Berapa lama Perang Dunia II berlangsung?',
			options: ['4 tahun', '5 tahun', '6 tahun', '7 tahun'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari enam istrinya yang paling lama dinikahi Henry VIII?',
			options: ['Anne Boleyn', 'Catherine dari Aragon', 'Jane Seymour', 'Catherine Parr'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Jenderal Nazi manakah yang dikenal sebagai "Rubah Gurun"?',
			options: ['Gerd von Rundstadt', 'Wilhelm Keitel', 'Erwin Rommel', 'Heinz Guderian'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question:
				'Perpindahan penyakit, tanaman, dan manusia melintasi Atlantik segera setelah ditemukannya benua Amerika disebut?',
			options: ['Perdagangan Segitiga', 'Perdagangan Budak Transatlantik', 'Pertukaran Kolombia', 'Jalur Sutra'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Manakah di antara berikut ini yang bukan merupakan lokasi pendaratan di pantai pada Invasi Normandia?',
			options: ['Emas', 'Juno', 'Pedang', 'Perak'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Kaisar Romawi manakah yang memimpin Kekaisaran Romawi mencapai wilayah maksimumnya?',
			options: ['Julius Kaisar', 'Trajan', 'Claudius', 'Konstantinus Agung'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Berapa banyak wanita yang bergabung dengan Angkatan Bersenjata Amerika Serikat selama Perang Dunia II?',
			options: ['225.000', '100.000', '500.000', '350.000'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Kapan Kekaisaran Bizantium runtuh?',
			options: ['1299', '1353', '1498', '1453'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Tahun berapa restoran Pizza Hut pertama kali dibuka?',
			options: ['1976', '1965', '1942', '1958'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Pada hari apa ARPANET mengalami gangguan jaringan selama 4 jam?',
			options: ['21 November 1969', '29 Oktober 1969', '9 Desember 1991', '27 Oktober 1980'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Apa mata uang resmi Jerman sampai tahun 2002?',
			options: ['Tanda', 'Jujur', 'Poundsterling', 'Token Reich'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari bangsa kuno berikut yang TIDAK diklasifikasikan sebagai Hellenic (Yunani)?',
			options: ['Dorian', 'orang Iliria', 'orang Akhaia', 'Ionia'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Perang Korea dimulai pada tahun berapa?',
			options: ['1945', '1950', '1960', '1912'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Tahun berapa Perang Dunia I dimulai?',
			options: ['1905', '1919', '1914', '1925'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Apa alat mnemonik untuk mengingat nasib istri Henry VIII?',
			options: [
				'Dipenggal, Meninggal, Bercerai, Bercerai, Dipenggal, Selamat',
				'Meninggal, Dipenggal, Bercerai, Dipenggal, Selamat, Bercerai',
				'Bercerai, Dipenggal, Meninggal, Bercerai, Dipenggal, Selamat',
				'Selamat, Dipenggal, Meninggal, Bercerai, Bercerai, Dipenggal'
			],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Pada perang manakah bom atom di Hiroshima dan Nagasaki terjadi?',
			options: ['Perang Dunia I', 'Perang Rusia-Jepang', 'Perang Dunia II', 'Perang Tiongkok-Jepang Pertama'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Siapa presiden pertama yang lahir di Amerika Serikat yang merdeka?',
			options: ['John Adams', 'George Washington', 'Martin Van Buren', 'James Monroe'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Di kapal induk manakah Doolitte Raid diluncurkan pada tanggal 18 April 1942 selama Perang Dunia II?',
			options: ['USS Tawon', 'USS Perusahaan', 'USS Lexington', 'USS Saratoga'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Abraham Lincoln berasal dari partai politik manakah ketika terpilih POTUS?',
			options: ['Demokrat', 'Mandiri', 'yang mana', 'Republik'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa Kecelakaan Video Game Amerika Utara terjadi?',
			options: ['1983', '1982', '1993', '1970'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Siapa Kanselir pertama Jerman bersatu pada tahun 1871?',
			options: ['Kaiser Wilhelm', 'Fredrick yang ke-2', 'Robert Koch', 'Otto Von Bismarck'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Negara apa yang bergabung dengan UE pada tahun 2013?',
			options: ['Bulgaria', 'Kroasia', 'Slovenia', 'Turki'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Apa nama ledakan budaya Afrika-Amerika yang berpusat di Manhattan bagian atas pada tahun 1920an dan 1930an?',
			options: ['Harlem Renaisans', 'Renaisans di Kayu', 'Renaisans Tempat Tidur-Stuy', 'Renaisans Timur Atas'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question:
				'Pada tahun 1720, Inggris terlilit hutang dalam jumlah besar dan terlibat dalam Gelembung Laut Selatan. Siapa dalang utama di baliknya?',
			options: ['John Blunt', 'Daniel Defoe', 'Robert Harley', 'John Churchill'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Siapa jenderal Konfederasi dalam Perang Saudara Amerika?',
			options: ['George A. Custer', 'Ulysses S.Hibah', 'George B. McClellan', 'Robert E. Lee'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Apa nama sandi invasi Sekutu ke Prancis Selatan pada tanggal 15 Agustus 1944?',
			options: ['Operasi Tuan', 'Taman Pasar Operasi', 'Operasi Dragoon', 'Operasi Obor'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Siapa orang Amerika pertama yang berada di luar angkasa?',
			options: ['Alan Shehard', 'Neil Amstrong', 'John Glenn', 'Jim Lovell'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari penembak jitu berikut yang memiliki jumlah pembunuhan terkonfirmasi tertinggi?',
			options: ['Simo Hayha', 'Chris Kyle', 'Vasily Zaytsev', 'Craig Harrison'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa Texas memisahkan diri dari Meksiko?',
			options: ['1838', '1845', '1844', '1836'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Tahun berapa gempa & tsunami Boxing Day terjadi di Samudera Hindia?',
			options: ['2006', '2004', '2008', '2002'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Berikut ini adalah nama-nama Tujuh Negara yang Bertikai, KECUALI:',
			options: ['Zhao (趙)', 'Qin (秦)', 'Qi (齊)', 'Zhai (翟)'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Sistem Pertahanan Strategis Amerika selama Perang Dingin dijuluki berdasarkan film terkenal ini.',
			options: ['Mulut', 'Perang Bintang', 'Pelari Pedang', 'Asing'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'Dalam Perang Pasifik (1879 - 1883), Bolivia kehilangan akses ke Samudera Pasifik setelah dikalahkan oleh negara Amerika Selatan yang mana?',
			options: ['Chili', 'Peru', 'Brazil', 'Argentina'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Aktor manakah di bawah ini yang tidak berperan dalam film "The Usual Suspects?"',
			options: ['Steve Buscemi', 'Kevin Spacey', 'Benicio Del Toro', 'Gabriel Byrne'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa frasa yang benar untuk pepatah Latin "Romanes Eunt Domus" dalam Life of Brian karya Monty Python?',
			options: ['Roma Pulang ke Rumah', 'Roxani Ite Domum', 'Tomate Ite Domum', 'Romani Ite Domum'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film manakah yang disutradarai oleh David Lynch, tetapi tidak ditulis oleh David Lynch?',
			options: ['Kisah Lurus', 'Kekaisaran Pedalaman', 'Jalan Raya Hilang', 'Jalan Api Puncak Kembar Bersamaku'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Manakah dari film berikut yang disutradarai oleh Ivan Reitman, ditulis oleh Gary Ross, menampilkan Kevin Kline, dan dirilis pada tahun 1993?',
			options: ['Yohanes', 'Akan', 'Karel', 'Dave'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Dalam film "Zulu" tahun 1964, lagu apa yang dinyanyikan oleh kompi Angkatan Darat Inggris sebelum pertempuran terakhir?',
			options: ['Orang-orang Harlech', 'Skotlandia yang Pemberani', 'Kolonel Bogey March', 'Grenadier Inggris'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di film tahun 1955 manakah Frank Sinatra berperan sebagai Nathan Detroit?',
			options: ['Jangkar Aweigh', 'Dari Sini ke Keabadian', 'Cowok dan Boneka', 'Masyarakat Tinggi'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa nama penjahat dalam Film Fiksi Ilmiah Rusia-Amerika tahun 2015 "Hardcore Henry"?',
			options: ['Estelle', 'Jimmy', 'Akan', 'Henry'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa nama karakter James Dean dalam film "Rebel Without a Cause" tahun 1955?',
			options: ['Jim Stark', 'Ned Stark', 'Jim Kane', 'Frank Stark'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film tahun 2002 "Kung Pow! Enter the Fist", Master Pain mengubah namanya menjadi apa?',
			options: ['Sally', 'Amy', 'Betty', 'kucing'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Dalam The Lord of the Rings: The Fellowship of the Ring, manakah karakter dari buku berikut yang tidak disertakan dalam film?',
			options: ['lebih cepat', 'Tom Bombadil', 'Barliman Butterbur', 'Seleborn'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film "Cast Away" disebutkan nama sahabat protagonis utama saat berada di pulau',
			options: ['Carson', 'Wilson', 'Jackson', 'Willy'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Jenis keju apa yang disukai Wallace dan Gromit yang harga jualnya naik setelah film pendek mereka sukses?',
			options: ['keju cheddar', 'Keju Bulan', 'Edam', 'Wensleydale'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang menyutradarai film "American Graffiti" tahun 1973?',
			options: ['Ron Howard', 'George Lucas', 'Francis Ford Coppola', 'Steven Spielberg'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Manakah dari film klasik Disney berikut yang dirilis pada tahun 1970?',
			options: ['Kaum Aristocat', 'Seratus Satu Dalmatians', 'Rubah dan Anjing', 'Putri Duyung Kecil'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Pada tahun berapa film "Police Academy" dirilis?',
			options: ['1986', '1984', '1985', '1983'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Siapa pembuat film dokumenter yang menulis dan membintangi film "My Scientology Movie" yang pertama kali debut pada tahun 2015?',
			options: ['Louis Theroux', 'Errol Morris', 'Joe Berlinger', 'Adam Curtis'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang memerankan Wakil Marsekal Samuel Gerard dalam film "The Fugitive" tahun 1993?',
			options: ['Harrison Ford', 'Tommy Lee Jones', 'Harvey Keitel', 'Martin Landau'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa nama lahir Michael Keaton?',
			options: ['Michael Douglas', 'Michael Rubah', 'Michael Richards', 'Michael Kane'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Dalam film Youtuber Jerma985 tahun 2014 "Rat Movie: Mystery of the Mayan Treasure", siapakah pria yang mencoba mencuri Harta Karun Maya?',
			options: [
				'Gabe "Manusia Lem" Degrossi',
				'Dick Richard si Pengecut',
				'Dinasti Bebek Bajakan Byeah Batman',
				'Raja Iblis Zerakos'
			],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Di Tron: Legacy, Kevin Flynn menulis sebuah program untuk menciptakan sistem yang sempurna. Apa nama programnya?',
			options: ['Tron', 'MCP', 'Quorra', 'petunjuk'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film "Spaceballs", apa yang coba dicuri oleh Spaceballs dari Planet Druidia?',
			options: ['Schwartz', 'Putri Lonestar', 'bakso', 'Udara'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Dalam film "The Terminator" tahun 1984, berapa nomor model Terminator yang diperankan oleh Arnold Schwarzenegger?',
			options: ['T-800', 'Saya-950', 'T-888', 'T-1000'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Di film tahun 1973 manakah Yul Brynner berperan sebagai robot koboi yang tidak berfungsi dan melakukan pembunuhan besar-besaran?',
			options: ['Pelarian', 'Android', 'Terminator', 'Dunia Barat'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang berperan sebagai protagonis Ethan Hunt dalam film seri "Mission: Impossible"?',
			options: ['Tom Cruise', 'Johnny Depp', 'Sean Connery', 'Pierce Brosnan'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Nama apa yang diberikan Tom Hanks kepada rekannya yang bermain bola voli di film `Cast Away`?',
			options: ['Wilson', 'Jumat', 'Jones', 'Billy'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang menyutradarai film "Pulp Fiction", "Reservoir Dogs" dan "Django Unchained"?',
			options: ['Quentin Tarantino', 'Martin Scorcese', 'Steven Spielberg', 'James Cameron'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Menurut pengetahuan "Star Wars", Obi-Wan Kenobi berasal dari planet mana?',
			options: ['Alderaan', 'Stewjon', 'Tatooine', 'Tidak apa-apa'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Aktor/aktris manakah yang BUKAN menjadi bagian dari pemeran film "Suicide Squad" tahun 2016?',
			options: ['Scarlett Johansson', 'Jared Leto', 'Akankah Smith', 'Margot Robbie'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film tahun 2002 "28 Days Later" sebagian besar berlatar di negara Eropa yang mana?',
			options: ['Perancis', 'Inggris Raya', 'Italia', 'Jerman'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di akhir film "Rat Race" tahun 2001, konser siapa yang membuat para kontestan mogok?',
			options: ['Bowling untuk Sup', 'Jumlah 41', 'Hancurkan Mulut', 'Linkin Park'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: "Apa nama belakang Dorothy di 'The Wizard Of Oz'?",
			options: ['Perkins', 'Hari', 'Badai', 'tukang parkir'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Manakah dari film berikut yang TIDAK dianggap sebagai bagian dari Marvel Cinematic Universe?',
			options: [
				'Fantastis Empat (2015)',
				'Spider-Man: Kepulangan (2017)',
				'Hulk yang Luar Biasa (2008)',
				'Kapten Marvel (2019)'
			],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film manakah yang dirilis pada tahun 2016 yang menampilkan pertarungan Superman dan Batman?',
			options: [
				'Batman v Superman: Fajar Keadilan',
				'Batman v Superman: Kiamat Super',
				'Batman v Superman: Ksatria Hitam',
				'Batman v Superman: Knightfall'
			],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film "Blade Runner", apa istilah yang digunakan untuk android yang mirip manusia?',
			options: ['silinder', 'Sintetis', 'Pengganda', 'pekerjaan kulit'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Kota manakah yang diserang monster dalam film "Cloverfield"?',
			options: ['New York, New York', 'Las Vegas, Nevada', 'Chicago, Illinois', 'Orlando, Florida'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Mantan aktor Star Trek mana yang menyutradarai Three Men and a Baby (1987)?',
			options: ['William Shatner', 'George Takei', 'James Doohan', 'Leonard Nimoy'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang membawakan lagu tema pembuka film James Bond 007 "Goldfinger"?',
			options: ['Shirley Basey', 'Tom Jones', 'John Barry', 'Sheena Easton'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film manakah yang memuat kutipan, "Sapa teman kecilku!"?',
			options: ['bekas luka', 'Anjing Waduk', 'Panas', 'Teman baik'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Manakah dari berikut ini yang bukan nama "Gadis Bond"?',
			options: ['Pam Bouvier', 'Maria Selamat malam', 'Vanessa Kensington', 'Wai Lin'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Dalam film "Back to the Future", berapa kecepatan yang harus dicapai DeLorean karya Doc Brown untuk melakukan perjalanan melintasi waktu?',
			options: ['77 mph', '100 mph', '88 mph', '70 mph'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa nama aktor yang memerankan Leatherface dalam film horor tahun 1974, The Texas Chainsaw Massacre?',
			options: ['Edwin Neal', 'Gunnar Hansen', 'John Dugan', 'Joe Bill Hogan'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "Siapa yang menyuarakan karakter Draco di film 'DragonHeart' tahun 1996?",
			options: ['Dennis Quaid', 'Sean Connery', 'Pete Postlethwaite', 'Brian Thompson'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di franchise Mad Max, jenis mobil Pursuit Special apa yang dikendarai Max?',
			options: ['Holden Monaro', 'Ford Falcon', 'Pengisi Daya Chrysler Valiant', 'Burung Api Pontiac'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di "Jurassic World", perusahaan mana yang membeli InGen dan menciptakan Jurassic World?',
			options: [
				'Teknologi Sintetis Biologi',
				'Genetika Internasional Dimasukkan',
				'Perusahaan Global Masrani',
				'Teknologi Genetik Internasional'
			],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam "The Hobbit", siapa ketua Dewan Putih?',
			options: ['Nyonya Galadriel', 'Gandalf', 'Elrond', 'Saruman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Aktor manakah yang memerankan karakter "Tommy Jarvis" dalam "Friday the 13th: The Final Chapter" (1984)?',
			options: ['Macaulay Culkin', 'Mel Gibson', 'Mark Hamill', 'Corey Feldman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa nama lahir Michael Caine?',
			options: ['Morris Coleman', 'Carl Myers', 'Martin Michaels', 'Maurice Micklewhite'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Lagu Queen apa yang diputar saat adegan pertarungan terakhir film "Hardcore Henry"?',
			options: ['Batu Brighton', 'Jangan Hentikan Aku Sekarang', 'Yang Lain Menggigit Debu', 'Kami Akan Mengguncang Anda'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Manakah dari film berikut yang tidak berdasarkan buku?',
			options: ['Ayah baptis', 'Forrest Gump', 'Warga Kane', 'Taman Jurassic'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang memerankan Jack Burton dalam film "Big Trouble in Little China?"',
			options: ['Patrick Swayze', 'John Cusack', 'Harrison Ford', 'Kurt Russel'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa banyak nilai yang dapat diwakili oleh satu byte?',
			options: ['8', '1', '256', '1024'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa banyak bit yang biasanya ada dalam satu byte?',
			options: ['Enam bit', 'Dua belas bit', 'Delapan bit', 'Lima belas bit'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Dalam bahasa pemrograman "Python", pernyataan manakah berikut yang akan menampilkan string "Hello World" dengan benar?',
			options: ['console.log("Halo Dunia")', 'gema "Halo Dunia"', 'mencetak("Halo Dunia")', 'printf("Halo Dunia")'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama yang diberikan untuk Android 4.3?',
			options: ['Lolipop', 'kacang-kacangan', 'kacang jeli', 'Froyo'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Dalam bahasa pemrograman apa pun, apa cara paling umum untuk melakukan iterasi melalui array?',
			options: ["Pernyataan 'Jika'", "Perulangan 'Lakukan sementara'", "Perulangan 'Sementara'", "loop 'Untuk'"],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari komponen komputer berikut yang dapat dibuat hanya dengan menggunakan gerbang NAND?',
			options: ['CPU', 'RAM', 'Daftar', 'ALU'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari bahasa berikut yang digunakan sebagai bahasa skrip di mesin game Unity 3D?',
			options: ['Jawa', 'C#', 'C++', 'Tujuan-C'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa jumlah tombol pada Keyboard Windows standar?',
			options: ['64', '104', '94', '76'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari berikut ini yang BUKAN merupakan algoritma ilmu komputer?',
			options: ['Sortir Gelembung', 'Gabungkan Sortir', 'Penyortiran Cepat', 'Sortir Mengambang'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Perangkat keras komputer manakah yang menyediakan antarmuka bagi semua perangkat lain yang terhubung untuk berkomunikasi?',
			options: ['Unit Pengolahan Pusat', 'papan utama', 'Hard Disk Drive', 'Memori Akses Acak'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari CPU?',
			options: ['Unit Proses Pusat', 'Unit Pribadi Komputer', 'Unit Pengolahan Pusat', 'Unit Prosesor Pusat'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa istilah yang tepat untuk benda logam di antara CPU dan kipas CPU di dalam sistem komputer?',
			options: ['Ventilasi CPU', 'Desipator Suhu', 'Pendingin', 'Ventilasi Panas'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa fungsi tombol Prt Sc?',
			options: [
				'Menangkap apa yang ada di layar dan menyalinnya ke clipboard Anda',
				'Tidak ada',
				'Menyimpan file .png dari apa yang ada di layar di folder tangkapan layar Anda di foto',
				'Menutup semua jendela'
			],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Domain internet .fm adalah domain tingkat atas kode negara untuk negara kepulauan Samudra Pasifik yang mana?',
			options: ['Fiji', 'Tuvalu', 'Mikronesia', 'Kepulauan Marshall'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Algoritme jenis apa yang tidak terkenal karena diciptakan oleh Ron Rivest?',
			options: ['Algoritma hashing', 'Enkripsi asimetris', 'Sandi aliran', 'Skema pembagian rahasia'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama komputer pribadi pertama di Bulgaria?',
			options: ['IMKO-1', 'Pravetz 82', 'Pravetz 8D', 'IZOT 1030'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Bahasa pengkodean manakah yang merupakan bahasa pemrograman #1 dalam hal penggunaan di GitHub pada tahun 2015?',
			options: ['C#', 'ular piton', 'JavaScript', 'PHP'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa panjang alamat IPv6?',
			options: ['32 bit', '64 bit', '128 byte', '128 bit'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Dirilis pada tahun 2001, sistem operasi Mac OS X Apple edisi pertama (versi 10.0) diberi nama kode hewan apa?',
			options: ['Cheetah', 'Puma', 'Harimau', 'macan tutul'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari berikut ini yang merupakan komputer pribadi yang dibuat oleh perusahaan Jepang Fujitsu?',
			options: ['PC-9801', 'FM-7', 'Milenium X', 'MSX'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama Layer 7 model OSI?',
			options: ['Sidang', 'Jaringan', 'Aplikasi', 'Hadiah'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama kode untuk sistem operasi seluler Android 7.0?',
			options: ['Sandwich Es Krim', 'Nougat', 'kacang jeli', 'Marshmallow'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Produsen OEM komputer Clevo, yang terkenal dengan lini notebook Sager, berbasis di negara mana?',
			options: ['Amerika Serikat', 'Jerman', 'Taiwan', 'Tiongkok (Republik Rakyat)'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'America Online (AOL) dimulai sebagai penyedia layanan online berikut ini?',
			options: ['Layanan Komputer', 'Keajaiban', 'Tautan Kuantum', 'Jin'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa pemrograman apa yang memiliki nama yang sama dengan sebuah pulau di Indonesia?',
			options: ['Jawa', 'ular piton', 'C', 'Jakarta'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari DOS dalam sistem operasi pertama Microsoft "MS-DOS"?',
			options: ['Sistem Operasi Bodoh', 'Sistem Berorientasi Pengemudi', 'Sistem Operasi Disk', 'Sistem Operasi Tanpa Disk'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa Hz yang didukung standar video PAL?',
			options: ['59', '60', '50', '25'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Kapan bahasa pemrograman "C#" dirilis?',
			options: ['2000', '1998', '1999', '2001'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Versi Android pertama apa yang khusus dioptimalkan untuk tablet?',
			options: ['kue sus', 'Froyo', 'Sarang madu', 'Marshmallow'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Jenis array RAID manakah yang dikaitkan dengan pencerminan data?',
			options: ['serangan 0', 'serangan 10', 'serangan 1', 'serangan 5'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama kode arsitektur mikro Intel Core generasi kedelapan yang diluncurkan pada bulan Oktober 2017?',
			options: ['jembatan berpasir', 'danau langit', 'Danau Kopi', 'Broadwell'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari SSD?',
			options: ['Penggerak Solid State', 'Disk Sumber Solusi', 'Disk Keadaan Padat', 'Penggerak Solusi Sumber'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: "Bahasa pemrograman 'Swift' diciptakan untuk menggantikan bahasa pemrograman lain apa?",
			options: ['Tujuan-C', 'C#', 'Rubi', 'C++'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa pemrograman utama apa yang digunakan Unreal Engine 4?',
			options: ['Perakitan', 'C#', 'Skrip ECMA', 'C++'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Di CSS, nilai manakah yang TIDAK BISA digunakan dengan properti "posisi"?',
			options: ['statis', 'tengah', 'mutlak', 'relatif'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Jika Anda membuat kode perangkat lunak dalam bahasa ini, Anda hanya dapat mengetikkan angka 0 dan 1.',
			options: ['JavaScript', 'C++', 'Biner', 'ular piton'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Singkatan "RIP" merupakan singkatan dari yang mana?',
			options: ['Proses Instans Runtime', 'Proses Interval Reguler', 'Protokol Informasi Perutean', 'Protokol Inspeksi Rutin'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Seri generasi grafis Intel HD yang menggantikan seri 5000 dan 6000 (Broadwell) disebut:',
			options: ['Grafik HD 700', 'Grafik HD 500', 'Grafik HD 600', 'Grafik HD 7000'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama proses yang mengirimkan satu qubit informasi menggunakan dua bit informasi klasik?',
			options: ['Pengkodean Super Padat', 'Keterikatan Kuantum', 'Pemrograman Kuantum', 'Teleportasi Kuantum'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: '.rs adalah domain tingkat atas untuk negara apa?',
			options: ['Rumania', 'Serbia', 'Rusia', 'Rwanda'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Yang manakah dari nama bug berikut yang ditemukan pada bulan April 2014 di perpustakaan kriptografi OpenSSL yang tersedia untuk umum?',
			options: ['Kejutan kerang', 'Darah Rusak', 'Skrip cangkang', 'Berdarah hati'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan "MP" dalam MP3?',
			options: ['Pemutar Musik', 'Gambar Bergerak', 'Multi Lulus', 'Titik Mikro'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Linus Torvalds menciptakan yang mana di antara berikut ini?',
			options: ['Microsoft Windows', 'ular piton', 'Wikipedia', 'Linux'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa jumlah bit yang umumnya sama dengan satu byte?',
			options: ['1', '2', '64', '8'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Siapa yang menemukan “Protokol Spanning Tree”?',
			options: ['Paul Vixie', 'Vin Cerf', 'Michael Roberts', 'Radia Perlman'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: "Perusahaan internet mana yang memulai kehidupannya sebagai toko buku online bernama 'Cadabra'?",
			options: ['eBay', 'Terlalu banyak menimbun', 'Amazon', 'Shopify'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Siapa penulis asli mesin fisika realtime bernama PhysX?',
			options: ['NovodeX', 'usia', 'Nvidia', 'AMD'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Nama perusahaan teknologi HP singkatan dari apa?',
			options: ['Howard Packman', 'Husker-Pollosk', null, 'Hewlett-Packard'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Dalam istilah komputasi, apa kepanjangan dari CLI?',
			options: ['Masukan Bahasa Umum', 'Antarmuka Baris Perintah', 'Antarmuka Jalur Kontrol', 'Antarmuka Bahasa Umum'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa batas ukuran blok Bitcoin pada tahun 2010?',
			options: ['1GB', '1 KB', '1 MB', '1 TB'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Dalam "Shrek", aktor komedi apa yang mengisi suara Donkey?',
			options: ['Eddie Murphy', 'Chris Batu', 'Richard Pryor', 'Bernie Mac'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Kira-kira berapa banyak biji apel yang tertelan yang diperlukan untuk menerima dosis sianida yang fatal?',
			options: ['20', '200', '2.000', '20.000'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Frasa Latin apa yang secara kasar diterjemahkan menjadi "merebut hari ini"?',
			options: ['Kenang-kenangan mori', 'Carpe diem', 'Ditambah sangat', 'Sic semper tirani'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Dari keempat gedung tersebut, manakah yang paling tinggi, dengan tinggi 1.250 kaki (381 m)?',
			options: [
				'Menara Bank of China, Hong Kong',
				'Menara Federasi, Rusia',
				'Empire State Building, Amerika Serikat',
				'Gevora Hotal, Uni Emirat Arab'
			],
			correct: 2
		},
		{
			category: 'GENERAL',
			question:
				'Pabrikan mobil Italia mana yang memperoleh kendali mayoritas atas pabrikan mobil AS Chrysler pada tahun 2011?',
			options: ['Maserati', 'Alfa Romeo', 'Perintah', 'Ferrari'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Di Half-Life, apa nama alien yang menempel di kepala?',
			options: ['cumi banteng', 'Vortigaunt', 'Kepiting kepala', 'Pemeluk muka'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Berapa kalori dalam kaleng Pepsi Cola 355 ml?',
			options: ['200', '100', '155', '150'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa yang ditakuti oleh Cynophobia?',
			options: ['Burung', 'Penerbangan', 'Anjing', 'Kuman'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question:
				'Berapa lama waktu yang dibutuhkan mesin pencuci jendela bermotor di World Trade Center yang asli untuk membersihkan seluruh bagian luar gedung?',
			options: ['3 Minggu', '1 Bulan', '1 Minggu', '2 Bulan'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Linus Pauling, satu-satunya pemenang beberapa Hadiah Nobel, mendapatkan Hadiah Nobel Kimia dan apa?',
			options: ['Perdamaian', 'Fisika', 'Ekonomi', 'Fisiologi/Kedokteran'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Maskot restoran mana yang badut?',
			options: ['Burger apa', 'Raja Burger', 'Sonik', "McDonald's"],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Kalau seseorang belum berpengalaman dikatakan warnanya apa?',
			options: ['Merah', 'Biru', 'Kuning', 'Hijau'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari kata-kata berikut yang berarti "penonton yang menganggur"?',
			options: ['Gosipiboma', 'Jentakuler', 'Meupareunia', 'Gongoozler'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa resmi di Barcelona selain bahasa Spanyol?',
			options: ['Galisia', 'Perancis', 'Katalan', 'Basque'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Jika Anda menanam benih Quercus robur, apa yang akan tumbuh?',
			options: ['Biji-bijian', 'Pohon', 'Sayuran', 'Bunga'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa Korea yang diromanisasi untuk "hati"?',
			options: ['Aejeong', 'Jeongsin', 'Segseu', 'Simjang'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Dari mana asal air dari botol air mata air Polandia?',
			options: ['Hesse, Jerman', 'Masovia, Polandia', 'Maine, Amerika Serikat', 'Bavaria, Polandia'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Dalam "Katamari Damacy", Anda mengontrol karakter yang dikenal sebagai:',
			options: ['Fujio', 'Ichigo', 'Foomin', 'Pangeran'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa kitab pertama dari Perjanjian Lama?',
			options: ['Keluaran', 'Imamat', 'Angka', 'Asal'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Kacang apa yang digunakan dalam produksi marzipan?',
			options: ['kacang almond', 'kacang tanah', 'kenari', 'pistachio'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Terusan Panama resmi dibuka oleh presiden Amerika yang mana?',
			options: ['Woodrow Wilson', 'Calvin Coolidge', 'Herbert Hoover', 'Theodore Roosevelt'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Dari arah mata angin manakah Matahari terbit?',
			options: ['Barat', 'Utara', 'Timur', 'Selatan'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Pakaian apa yang biasanya dikenakan orang Skotlandia di pesta pernikahan?',
			options: ['Rok', 'Melipat', 'Gaun', 'rhobes'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Planet manakah yang tidak diberi nama sesuai nama dewa Yunani atau Romawi?',
			options: ['Jupiter', 'Mars', 'Air raksa', 'Bumi'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Pabrik bir milik Amerika manakah yang memimpin penjualan di negara ini berdasarkan volume pada tahun 2015?',
			options: ['Anheuser Busch', 'Perusahaan Bir Boston', 'DG Yuengling dan Son, Inc', 'Miller Coors'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa nama mata uang yang digunakan di Etiopia?',
			options: ['Dirham', 'Dolar AS', 'Rand', 'bir'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Negara manakah yang TIDAK ikut berperang dalam Perang Dunia I?',
			options: ['Portugal', 'Denmark', 'Yunani', 'Rumania'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Apa bentuk mainan yang ditemukan oleh profesor Hongaria Ernő Rubik?',
			options: ['Bola', 'Silinder', 'Kubus', 'Piramida'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Bagaimana cara mengucapkan selamat tinggal dalam bahasa Spanyol?',
			options: ['Halo', 'Selamat Ulang Tahun', 'Salir', 'Adios'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa nama minuman beralkohol berbahan dasar kentang atau biji-bijian yang berasal dari Polandia dan Rusia?',
			options: ['Absinth', 'Rum', 'Demi', 'Vodka'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa mata uang Polandia?',
			options: ['Zloty', 'Rubel', 'Euro', 'Krone'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Pengusaha asal Ghana ini adalah pionir pinjaman mikro.',
			options: ['Farida Bedwei', 'Esther Afua Ocloo', 'Ama Ata Aido', 'Sionne Neely'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Fields Medal, salah satu penghargaan matematika yang paling dicari, diberikan setiap berapa tahun?',
			options: ['3', '5', '6', '4'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Situs web "Shut Up & Sit Down" mengulas bentuk media apa?',
			options: ['Acara Televisi', 'Video Game', 'Permainan Papan', 'Film'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Tahun berapa Apple Inc. didirikan?',
			options: ['1978', '1976', '1980', '1974'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: "Apa negara ketiga yang memiliki restoran McDonald's?",
			options: ['Jepang', 'Perancis', 'Australia', 'Kosta Rika'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Siapa penulis Jurassic Park?',
			options: ['Peter Benchley', 'Chuck Paluhniuk', 'Michael Crichton', 'Irvine Welsh'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari landmark berikut yang tidak berlokasi di Kota New York?',
			options: ['Gedung Empire State', 'Times Square', 'Taman Pusat', 'Peringatan Lincoln'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa tanda bintang seseorang yang lahir di hari kasih sayang?',
			options: ['Pisces', 'Capricornus', 'Scorpio', 'Aquarius'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari berikut ini yang menjelaskan urutan kata dalam bahasa Jepang dengan benar?',
			options: ['Kata Kerja Objek Subjek', 'Subjek Kata Kerja Objek', 'Objek Subjek Kata Kerja', 'Subjek Objek Kata Kerja'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Teh Earl Grey adalah teh hitam yang diberi rasa apa?',
			options: ['warna lembayung muda', 'Minyak bergamot', 'Vanila', 'Sayang'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Apa itu "dakimakura"?',
			options: [
				'Makanan Cina, pada dasarnya terdiri dari ikan',
				'Postur yoga',
				'Sebuah kata yang digunakan untuk menggambarkan dua orang yang benar-benar saling mencintai',
				'Bantal tubuh'
			],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Berapa banyak nada yang ada pada grand piano standar?',
			options: ['98', '108', '78', '88'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question:
				'Apa yang dilarang oleh komunitas otonom Spanyol di Catalonia pada tahun 2010, yang mulai berlaku pada tahun 2012?',
			options: ['Pesta', 'Flamenco', 'Perkelahian manusia melawan banteng', 'Mariachi'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Bahasa Kazakh termasuk dalam rumpun bahasa manakah?',
			options: ['Mongol', 'Indo-Eropa', 'Uralik', 'Turki'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question:
				'Perusahaan realitas virtual Oculus VR kehilangan siapa pendirinya dalam kecelakaan mobil yang aneh pada tahun 2013?',
			options: ['Nate Mitchell', 'Andrew Scott Reisse', 'Jack McCauley', 'Palmer Luckey'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question:
				'Apa julukan yang diberikan kepada Hughes H-4 Hercules, kapal terbang angkut berat yang berhasil terbang pada tahun 1947?',
			options: ['Bahtera Nuh', 'Angsa Cemara', 'Pria Gemuk', 'Kuda Troya'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari minuman ringan berkarbonasi berikut yang pertama kali diperkenalkan?',
			options: ['Dr. Lada', 'Coca-Cola', 'Sprite', 'Embun Gunung'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Siapa yang mendirikan Akademi Khan?',
			options: ['Ben Khan', 'Kitt Khan', 'Sal Khan', 'Adel Khan'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Bumi terletak di galaksi manakah?',
			options: ['Galaksi Mars', 'Catatan Galaksi', 'Lubang Hitam', 'Galaksi Bima Sakti'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Lukisan manakah yang tidak dibuat oleh Vincent Van Gogh?',
			options: ['Teras Kafe di Malam Hari', 'Gelombang Kesembilan', 'Kamar Tidur Di Arles', 'Malam Berbintang'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Tempat kelahiran dan tempat kematian Albrecht Dürer berada di...',
			options: ['Augsburg', 'Nurnberg', 'Bamberg', 'Berlin'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Pematung Yunani manakah yang mendesain patung Athena Parthenos di dalam Parthenon?',
			options: ['Scopas', 'Hesiod', 'Praxiteles', 'Phidias'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Apa kewarganegaraan artis terkenal Van Gogh?',
			options: ['Belanda', 'Perancis', 'Rusia', 'Polandia'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Kapan lukisan Salvador Dali, "The Persistence of Memory," selesai?',
			options: ['1932', '1929', '1931', '1934'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Lukisan mana yang bukan karya Caspar David Friedrich?',
			options: ['Lautan Es', 'Pengembara di atas Lautan Kabut', 'Biksu di Tepi Laut', 'Laut Hitam'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Apa nama seni melipat kertas di Jepang menjadi bentuk dan gambar dekoratif?',
			options: ['Sumi-e', 'Ukiyo-e', 'Origami', 'Haiku'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Apa saja produk siap pakai Marcel Duchamp?',
			options: [
				'seri yang berfokus pada warna dan cahaya, bukan pada garis dan bentuk',
				'benda-benda utilitarian diangkat ke status seni',
				'lukisan dengan garis persegi yang hampir tidak terlihat',
				'sekelompok kotak baja identik yang menonjol dari dinding'
			],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Manakah dari nama merek spidol terkenal berikut ini?',
			options: ['salinan', 'Dopix', 'Kofiks', 'Marx'],
			correct: 0
		},
		{
			category: 'ART',
			question:
				'Lukisan Van Gogh manakah yang menggambarkan pemandangan dari rumah sakit jiwa di Saint-Rémy-de-Provence di Prancis selatan?',
			options: ['Malam Berbintang', 'Ladang Gandum dengan Gagak', 'Penabur dengan Matahari Terbenam', 'Gereja di Auvers'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis "Malam Berbintang"?',
			options: ['Vincent van Gogh', 'Edward Munch', 'Pablo Picasso', 'Claude Monet'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Paul Gauguin pindah ke negara mana pada tahun 1895?',
			options: ['Perancis', 'Atuona', 'Lithuania', 'Tahiti'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Pelukis Piet Mondrian (1872 - 1944) ikut gerakan apa?',
			options: ['Neoplastisisme', 'Presisiisme', 'Kubisme', 'Impresionisme'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Gerakan seni manakah yang dikenal sebagai salah satu pendiri Pablo Picasso?',
			options: ['Kubisme', 'Futurisme', 'Ekspresionisme', 'Impresionisme'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Apa teknik fotografi pertama yang sukses dan layak secara komersial?',
			options: ['Proses kolodion', 'Tipe Daguerreo', 'Kain Kafan Turin', 'film Kodachrome'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Lukisan manakah yang tidak dilukis oleh Johannes Vermeer?',
			options: ['Gadis dengan Anting Mutiara', 'Bacchus', 'Gadis pemerah susu', 'Sang Pembuat Renda'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis mural epik Guernica?',
			options: ['Francisco Goya', 'Pablo Picasso', 'Leonardo da Vinci', 'Henri Matisse'],
			correct: 1
		},
		{
			category: 'ART',
			question:
				'Berapa banyak versi cat dan pastel dari "The Scream" yang diyakini telah diproduksi oleh pelukis Norwegia Edvard Munch?',
			options: ['1', '3', '2', '4'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Seniman manakah yang melukis "Pengkhianatan Gambar", sebuah lukisan pipa dengan deskripsi "ini bukan pipa"?',
			options: ['Matisse', 'Modigliani', 'Mengunyah', 'Magritte'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Lukisan "Guernica" karya Pablo Picasso mengungkapkan emosi ketakutan dalam menanggapi perang yang mana?',
			options: ['Perang Dunia I', 'Perang Krimea', 'Perang Saudara Spanyol', 'Perang Spanyol-Amerika'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis lukisan dinding alkitabiah Penciptaan Adam?',
			options: ['Michelangelo', 'Leonardo da Vinci', 'Caravaggio', 'Rembrandt'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Artis mana yang terkenal karena memotong telinganya?',
			options: ['Vincent van Gogh', 'Salvador Dali', 'Rembrandt', 'Michelangelo'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Apa nama lain dari La Gioconda / La Joconde?',
			options: ['Gadis dengan Anting Mutiara', 'Mona Lisa', 'Malam Berbintang', 'Bunga matahari'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Gaya seniman manakah yang menggunakan titik-titik kecil berwarna berbeda untuk membuat gambar?',
			options: ['Georges Seurat', 'Paul Cezanne', 'Vincent Van Gogh', 'Henri Rousseau'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Manakah dari warna berikut yang tidak ditampilkan dalam Broadway Boogie-Woogie karya Mondrian?',
			options: ['Biru', 'Hijau', 'Kuning', 'Merah'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis "American Gothic"?',
			options: ['Anita Malfatti', 'Pablo Picasso', 'Marc Chagall', 'Hibah Kayu'],
			correct: 3
		},
		{
			category: 'ART',
			question: "Siapa seniman yang melukis mural 'The Last Supper' pada akhir abad ke-15?",
			options: ['Piero della Francesca', 'Leonardo da Vinci', 'Paolo Uccello', 'Luka Pacioli'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Apa elemen mendasar dari gaya arsitektur Gotik?',
			options: ['langit-langit peti', 'fasad diapit oleh pedimen', 'lukisan dinding internal', 'lengkungan runcing'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Manakah di antara berikut ini yang bukan merupakan variasi tambahan dari warna ungu?',
			options: ['Kobicha', 'Bizantium', 'Kemegahan dan Kekuasaan', 'Pfalz'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Apa kewarganegaraan pelukis surealis Salvador Dali?',
			options: ['Italia', 'Spanyol', 'Perancis', 'Portugis'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Pematung Perancis mana yang mendesain Patung Liberty?',
			options: ['Jean-Léon Gérôme', 'Frederic Auguste Bartholdi', 'Auguste Rodin', 'Henri Matisse'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis Malam Berbintang?',
			options: ['Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang memahat patung Daud?',
			options: ['Gian Lorenzo Bernini', 'Michelangelo', 'Auguste Rodin', 'Donatello'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Tahun berapa Albrecht Dürer membuat lukisan "Kelinci Muda"?',
			options: ['1702', '1502', '1402', '1602'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis Kapel Sistina?',
			options: ['Michelangelo', 'Leonardo da Vinci', 'Pablo Picasso', 'Raphael'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Warna apa yang dihasilkan dengan mencampurkan hitam dan putih?',
			options: ['Hitam', 'Abu-abu', 'Cokelat', 'Putih'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis lukisan "Nighthawks"?',
			options: ['Johannes Vermeer', 'Edward Hopper', 'Vincent van Gogh', 'Salvador Dali'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Lukisan "The Starry Night" karya Vincent van Gogh merupakan bagian dari gerakan seni apa?',
			options: ['Romantisme', 'Pasca-Impresionisme', 'Neoklasik', 'Impresionisme'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Apa kewarganegaraan artis terkenal Pablo Picasso?',
			options: ['Perancis', 'Italia', 'Spanyol', 'Jerman'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Dalam "Perjamuan Terakhir" karya Leonardo Da Vinci, apa dua warna jubah yang dikenakan Yesus?',
			options: ['Merah dan Biru', 'Merah Putih', 'Merah dan Kuning', 'Merah dan Hitam'],
			correct: 0
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis "Angsa Mencerminkan Gajah", "Tidur", dan "Kegigihan Memori"?',
			options: ['Jackson Pollock', 'Vincent van Gogh', 'Edgar Degas', 'Salvador Dali'],
			correct: 3
		},
		{
			category: 'ART',
			question: "Studio artis manakah yang dikenal sebagai 'The Factory'?",
			options: ['Roy Lichtenstein', 'David Hockney', 'Andy Warhol', 'Peter Blake'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Tanda birama manakah yang umumnya dikenal sebagai "Waktu Potong?"',
			options: ['4/4', '6/8', '3/4', '2/2'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Siapa yang mendesain logo Chupa Chups?',
			options: ['Pablo Picasso', 'Andy Warhol', 'Vincent van Gogh', 'Salvador Dali'],
			correct: 3
		},
		{
			category: 'ART',
			question: 'Siapa yang melukis "The Scream"?',
			options: ['Vincent Van Gogh', 'Picasso', 'Edward Munch', 'Henri Matisse'],
			correct: 2
		},
		{
			category: 'ART',
			question: 'Apa perbedaan utama antara gaya arsitektur Gotik Inggris dan Prancis?',
			options: ['Puncak', 'Lompat kipas', 'Gargoyle', 'Kubah Belahan Bumi'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Mona Lisa selesai tahun berapa?',
			options: ['1487', '1504', '1523', '1511'],
			correct: 1
		},
		{
			category: 'ART',
			question: 'Apa karya fiksi tertua di dunia yang diketahui?',
			options: ['Papirus Ani', 'Kode Hammurabi', 'Epik Gilgamesh', 'Batu Rosetta'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Di manakah pertama kali Badai Besar tahun 1987 melanda?',
			options: ['Surrey', 'Wales', 'dinding jagung', 'Dataran Tengah'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Organel sel apa yang dikenal sebagai “pembangkit tenaga sel?”',
			options: ['Inti', 'Aparat Golgi', 'Mitokondria', 'Retikulum endoplasma'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question:
				'Ilmuwan manakah yang melakukan Eksperimen Foil Emas yang menyimpulkan bahwa sebagian besar atom terbuat dari ruang kosong?',
			options: ['Joseph John Thomson', 'Archimedes', 'Niels Henrik David Bohr', 'Ernest Rutherford'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Inti Matahari dapat mencapai suhu berapa?',
			options: ['938.000°F (521093,3°C)', '8° Miliar F (°4,4 Miliar C)', 'Nol Mutlak (F dan C)', '27° Juta F (15° Juta C)'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Siapa nama unsur kimia Curium?',
			options: ['Penjelajah Keingintahuan', 'Marie & Pierre Curie', 'George yang penasaran', 'Stephen Kari'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Secara botani, manakah di antara buah-buahan berikut yang BUKAN buah beri?',
			options: ['blueberry', 'Stroberi', 'Pisang', 'Anggur Kerukunan'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Tulang manakah yang paling sulit dipatahkan?',
			options: ['Tengkorak', 'humerus', 'Tulang kering', 'Tulang paha'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Down Syndrome biasanya disebabkan oleh kelebihan salinan kromosom yang mana?',
			options: ['23', '21', '15', '24'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Semua unsur logam berikut berbentuk cair pada atau mendekati suhu kamar, KECUALI:',
			options: ['galium', 'sesium', 'Air raksa', 'Berilium'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Sel manusia biasanya memiliki berapa banyak salinan setiap gen?',
			options: ['1', '2', '4', '3'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Misi Apollo manakah yang pertama kali mendarat di Bulan?',
			options: ['Apollo 10', 'Apollo 9', 'Apollo 13', 'Apollo 11'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Serat otot tersusun dari kumpulan organel-organel kecil yang panjang yang disebut?',
			options: ['Epimisium', 'miofiamen', 'miokardium', 'Miofibril'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa persamaan Celcius dan Fahrenheit?',
			options: ['-40', '32', '-39', '-42'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Berapa banyak bulan yang dimiliki bumi?',
			options: ['0', '2', '1', '3'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa nama ilmiah tempurung lutut?',
			options: ['Tempurung lutut', 'Tulang paha', 'Foramen Magnum', 'Tulang belikat'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari berikut ini yang merupakan otot utama punggung?',
			options: ['trapezius', 'Trapesium', 'Trapesium', 'Trikutrum'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Istilah psikologis manakah yang mengacu pada stres karena memegang keyakinan yang bertentangan?',
			options: ['Disonansi Kognitif', 'Sindrom Flip-Flop', 'Otak Terpisah', 'Penglihatan Buta'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa simbol kimia dari timbal?',
			options: ['Ld', 'hal', 'Le', 'Pm'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa rumus molekul komponen aktif cabai (Capsaicin)?',
			options: ['C21H23NO3', 'C18H27NO3', 'C6H4Cl2', 'C13H25NO4'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa itu Hipernatremia?',
			options: [
				'Peningkatan natrium darah',
				'Penurunan kalium darah',
				'Peningkatan glukosa darah',
				'Penurunan zat besi darah'
			],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa lapisan bumi yang tipis dan terluar?',
			options: ['Eksosfer', 'Kerak', 'Mantel', 'Inti Luar'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Manakah dari berikut ini yang BUKAN merupakan komponen listrik pasif?',
			options: ['Transistor', 'Penghambat', 'Kapasitor', 'Induktor'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question:
				'Manakah dari berikut ini yang merupakan istilah untuk “komplikasi pembedahan akibat spons bedah tertinggal di dalam tubuh pasien?',
			options: ['Gosipiboma', 'Gongoozler', 'Jentakuler', 'Meupareunia'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa yang dilambangkan oleh berlian kuning pada berlian api NFPA 704?',
			options: ['Reaktivitas', 'Kesehatan', 'Sifat mudah terbakar', 'Radioaktivitas'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa yang Anda pelajari jika Anda mempelajari entomologi?',
			options: ['Manusia', 'Serangga', 'Otak', 'Ikan'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Dalam Kimia, berapa banyak isomer yang dimiliki Butanol (C4H9OH)?',
			options: ['3', '5', '4', '6'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa nama umum yang diberikan untuk kondisi medial, tibial stress syndrome (MTSS)?',
			options: ['Siku Tenis', 'Shin Splint', 'Terowongan Karpal', 'Lutut Pembantu Rumah Tangga'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Hewan apa yang ikut serta dalam eksperimen pemikiran Schrödinger yang paling terkenal?',
			options: ['Anjing', 'Kelelawar', 'Kucing', 'kupu-kupu'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Planet manakah di Tata Surya yang paling dekat dengan Matahari?',
			options: ['Bumi', 'Mars', 'Air raksa', 'Venus'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Apa satuan induktansi listrik?',
			options: ['Weber', 'Coulomb', 'Mo', 'Henry'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Apa pembuluh darah terkecil di tubuh manusia?',
			options: ['Kapiler', 'Arteriol', 'vena', 'Limfatik'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa satuan SI standar untuk suhu?',
			options: ['Fahrenheit', 'Kelvin', 'Celsius', 'Rankine'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Bulan-bulan Miranda, Ariel, Umbriel, Titania, dan Oberon mengorbit di planet manakah?',
			options: ['Jupiter', 'Venus', 'Neptunus', 'Uranus'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Pada tahap perkembangan apa sebagian besar sel eukariotik bertahan sepanjang hidupnya?',
			options: ['Profase', 'stasis', 'Telofase', 'Interfase'],
			correct: 3
		},
		{
			category: 'SCIENCE',
			question: 'Perbedaan terbesar antara sel eukariotik dan sel prokariotik adalah:',
			options: ['Ukuran keseluruhan', 'Ada tidaknya inti', 'Ada tidaknya organel tertentu', 'Cara reproduksi'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Apa yang mempelajari sel dan jaringan tumbuhan dan hewan?',
			options: ['Mikrobiologi', 'Anatomi', 'Histologi', 'Biokimia'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: '“Teori Big Bang” pertama kali diteorikan oleh seorang pendeta dengan ideologi agama apa?',
			options: ['Katolik', 'Kristen', 'Yahudi', 'Islam'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Selain Oksigen, unsur manakah yang paling bertanggung jawab menyebabkan langit tampak biru?',
			options: ['Nitrogen', 'Helium', 'Karbon', 'Hidrogen'],
			correct: 0
		},
		{
			category: 'SCIENCE',
			question: 'Apa contoh bakteri patogen?',
			options: ['Campak', 'AIDS', 'Kolera', 'Kurap'],
			correct: 2
		},
		{
			category: 'SCIENCE',
			question: 'Unit ilmiah manakah yang dinamai menurut nama seorang bangsawan Italia?',
			options: ['Pascal', 'Volt', 'Ohm', 'Hertz'],
			correct: 1
		},
		{
			category: 'SCIENCE',
			question: 'Dari mana asal mula ras anjing "Chihuahua"?',
			options: ['Meksiko', 'Perancis', 'Spanyol', 'Rusia'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Kapan pembangunan Terusan Suez selesai?',
			options: ['1859', '1860', '1869', '1850'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question:
				'Kapan L. L. Zamenhof pertama kali menerbitkan "Unua Libro", publikasi pertama yang menggambarkan bahasa internasional Esperanto?',
			options: ['1897', '1905', '1915', '1887'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Pada hari apa Jerman menginvasi Polandia?',
			options: ['1 September 1939', '7 Desember 1941', '22 Juni 1941', '7 Juli 1937'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari Fisikawan berikut yang membantu Nazi Jerman dalam produksi senjata nuklir?',
			options: ['Werner Heisenberg', 'John von Neumann', 'Albert Einstein', 'Max Planck'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Negara modern manakah yang merupakan wilayah yang pada zaman kuno dikenal sebagai Frigia?',
			options: ['Suriah', 'Turki', 'Yunani', 'Mesir'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Dengan nama manakah Rodrigo Borgia diangkat menjadi Paus?',
			options: ['Alexander VI', 'Rodrigo I', 'Yohanes Paulus II', 'Paus Pius VII'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Pada perang manakah "Krisis Rudal Kuba" terjadi?',
			options: ['Perang Dunia I', 'Perang dingin', 'Perang Dunia II', 'Perang Revolusi'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: "Siapa Presiden AS yang terkenal 'diserang' oleh kelinci yang sedang berenang?",
			options: ['Ronald Reagan', 'Jimmy Carter', 'Lydon B.Johnson', 'Gerald Ford'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Konflik abad ke-15 antara Keluarga York dan Lancaster dikenal sebagai Perang Apa?',
			options: ['Perang Lillies', 'Perang Mawar', 'Perang Bunga Bakung', 'Perang Tulip'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Argumen ontologis yang mendukung bukti keberadaan Tuhan pertama-tama diatribusikan kepada siapa?',
			options: ['René Descartes', 'Anselmus dari Canterbury', 'Imanuel Kant', 'Aristoteles'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Apa nama jaringan mata-mata yang membantu Amerika Serikat memenangkan Perang Revolusi?',
			options: ['Cincin Mata-Mata New York', 'Cincin Pelaku', 'Mata-mata Washington', 'Tanpa nama'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Dari tahun 1940 hingga 1942, apa yang menjadi ibu kota Prancis Merdeka dalam pengasingan?',
			options: ['Aljazair', 'Brazzaville', 'Paris', 'Tunisia'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Sebutkan kerajaan-kerajaan Iran berikut dalam urutan kronologis:',
			options: [
				'Median, Achaemenid, Sassanid, Parthia',
				'Achaemenid, Median, Parthia, Sassanid',
				'Median, Achaemenid, Parthia, Sassanid',
				'Achaemenid, Median, Sassanid, Parthia'
			],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Tahun berapa Australia menjadi federasi?',
			options: ['1910', '1899', '1911', '1901'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Siapa Presiden Amerika Serikat saat penandatanganan Pembelian Gadsden?',
			options: ['Andrew Johnson', 'Franklin Pierce', 'Abraham Lincoln', 'James Polk'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Siapa orang pertama yang melakukan perjalanan ke luar angkasa?',
			options: ['Virgil Ivan "Gus" Grissom', 'Yuri Gagarin', 'Neil Amstrong', 'Buzz Aldrin'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question:
				'Di manakah organisasi hak-hak lesbian yang pertama kali dikenal di Amerika Serikat, Daughters of Bilitis, dimulai?',
			options: ['San Fransisco', 'New York', 'Chicago', 'Los Angeles'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Tujuan utama operasi Jerman "Case Blue" selama Perang Dunia II pada awalnya adalah untuk merebut apa?',
			options: ['Stalingrad', 'Krimea', 'Kaukasus', 'Voronezh'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Pada hari manakah percobaan kudeta tahun 1991 di Uni Soviet dimulai?',
			options: ['19 Agustus', '21 Agustus', '26 Desember', '24 Desember'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Mengapa Albert Einstein memenangkan Hadiah Nobel pada tahun 1921?',
			options: ['Relativitas', 'Efek Fotolistrik', 'Dualitas Gelombang-Partikel', 'Energi Titik Nol'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Misi Apollo manakah yang terakhir dalam program Apollo NASA?',
			options: ['Apollo 13', 'Apollo 17', 'Apollo 11', 'Apollo 15'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Tank jagoan Perang Dunia II mana yang dianggap paling banyak menghancurkan tank?',
			options: ['Michael Wittmann', 'Walter Kniep', 'Otto Carius', 'Kurt Knispel'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari negara berikut yang pertama kali mengirim benda ke luar angkasa?',
			options: ['Amerika Serikat', 'Rusia', 'Jerman', 'Cina'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Berapa banyak sonata yang ditulis Ludwig van Beethoven?',
			options: ['32', '50', '31', '21'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Siapa yang membunuh Adipati Agung Franz Ferdinand?',
			options: ['Nedeljko Čabrinović', 'Oskar Potiorek', 'Prinsip Gavrilo', 'Ferdinand Cohen-Buta'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari fisikawan teoretis berikut yang pertama kali meramalkan keberadaan antimateri?',
			options: ['Niels Bohr', 'Albert Einstein', 'Paul Dirac', 'Werner Heisenberg'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari pertempuran berikut yang sering dianggap menandai awal jatuhnya Kekaisaran Romawi Barat?',
			options: ['Pertempuran Adrianople', 'Pertempuran Tesalonika', 'Pertempuran Pollentia', 'Pertempuran Konstantinopel'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun 1547 yang menjadi Tsar Rusia pertama',
			options: ['Alexis dari Rusia', 'Ivan yang Mengerikan', 'Mikhail Romanov', 'Petrus yang Agung'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa Pertempuran Verdun terjadi?',
			options: ['1917', '1916', '1915', '1918'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Berapa panjang total Titanic?',
			options: ['759 kaki | 231,3 m', '882 kaki | 268,8 m', '1042 kaki | 317,6 m', '825 kaki | 251,5 m'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Hong Kong merupakan bagian dari wilayah negara manakah sebelum Inggris merebutnya kembali pada tahun 1945?',
			options: ['Cina', 'Jepang', 'Filipina', 'Indonesia Perancis'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Siapa Perdana Menteri Inggris selama sebagian besar Perang Dunia II?',
			options: ['Neville Chamberlain', 'Harold Macmillan', 'Winston Churchill', 'Edward Heath'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Berapa umur Raja Tutankhamen (Tut) yang terkenal ketika dia meninggal?',
			options: ['21', '19', '15', '30'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Bohdan Khmelnytsky termasuk yang manakah di antara berikut ini?',
			options: [
				'Sekretaris Jenderal Partai Komunis Uni Soviet',
				'Pemimpin Cossack Ukraina',
				'Pangeran Wallachia',
				'Pangeran Agung Novgorod'
			],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Raja Henry VIII adalah raja kedua dari keluarga kerajaan Eropa yang mana?',
			options: ['York', 'Tudor', 'Stuart', 'Lancaster'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Apa nama bahan kimia yang dijatuhkan di Vietnam selama perang Vietnam?',
			options: ['Agen Oranye', 'fosgen', 'Gas Mustard', 'Hidrogen Sianida'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Musim Semi Arab adalah serangkaian protes dan pemberontakan yang dimulai di negara-negara Arab manakah?',
			options: ['Maroko', 'Tunisia', 'Suriah', 'Mesir'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Apa peristiwa paling berdarah dalam sejarah Amerika Serikat, dalam hal jumlah korban jiwa?',
			options: ['Pertempuran Antietam', 'Pelabuhan Mutiara', '11 September', 'Hari-H'],
			correct: 0
		},
		{
			category: 'HISTORY',
			question: 'Posisi manakah yang tidak dimiliki oleh astronom dan fisikawan Isaac Newton?',
			options: ['Profesor Matematika', 'Penjaga Royal Mint', 'Surveyor ke Kota London', 'Anggota Parlemen'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'Manakah dari tank tahun 1900-an berikut yang dirancang dan dibuat SEBELUM tank lainnya?',
			options: ['M4 Sherman', 'Panser IV', 'Cromwell', 'Renault FT'],
			correct: 3
		},
		{
			category: 'HISTORY',
			question: 'Pada tahun berapa kasus cacar terakhir kali tercatat?',
			options: ['1982', '1980', '1977', '1990'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: 'John Moses Browning, perancang M1918 BAR (Browning Automatic Rifle) menganut agama apa?',
			options: ['Katolik', 'Yahudi', 'Mormon', 'Ateis'],
			correct: 2
		},
		{
			category: 'HISTORY',
			question: "Louis manakah yang dikenal sebagai 'Raja Matahari Prancis'?",
			options: ['Louis XIII', 'Louis XIV', 'Louis XV', 'Louis XVI'],
			correct: 1
		},
		{
			category: 'HISTORY',
			question: 'Kumpulan himne dan syair Sansekerta yang disebut Weda merupakan teks suci dalam agama apa?',
			options: ['Hinduisme', 'agama Yahudi', 'Islam', 'agama Buddha'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota negara bagian South Dakota?',
			options: ['Air Terjun Sioux', 'Kota Cepat', 'kota air', 'Pierre'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa sungai terpanjang di Eropa?',
			options: ['Danube', 'Rhein', 'Volga', 'Sungai Thames'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kerajaan kecil apa yang terletak di antara Spanyol dan Perancis?',
			options: ['Liechtenstein', 'Andorra', 'Monako', 'San Marino'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari bahasa berikut yang TIDAK menggunakan alfabet Latin?',
			options: ['Turki', 'orang Georgia', 'Swahili', 'Vietnam'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa huruf ke-15 dalam alfabet Yunani?',
			options: ['Sigma (Σ)', 'Pi (Π)', 'Nu (Ν)', 'Omikron (Ο)'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kepulauan Svalbard merupakan ketergantungan negara mana?',
			options: ['Denmark', 'Norwegia', 'Islandia', 'Rusia'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Wilayah yang menggabungkan Pakistan, India, dan Tiongkok yang kepemimpinannya tidak diketahui disebut?',
			options: ['Andorra', 'Gibraltar', 'Kashmir', 'Quin'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak zona waktu di Rusia?',
			options: ['8', '5', '2', '11'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Distrik Akihabara di Jepang juga dikenal dengan julukan apa?',
			options: ['Sungai Jalan Bulan', 'Kota Listrik', 'Otaku Tengah', 'Mata Besar'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Pulau manakah di bawah ini yang diklaim oleh Jepang dan Rusia?',
			options: ['Kepulauan Paracel', 'Kepulauan Chagos', 'Kepulauan Kuril', 'Kepulauan Spratly'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama wilayah berbatu yang membentang sebagian besar wilayah timur Kanada?',
			options: ['Pegunungan Rocky', 'Pegunungan Appalachian', 'Perisai Kanada', 'Himalaya'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di kota manakah Big Nickel berada di Kanada?',
			options: ['Calgary, Alberta', 'Halifax, Nova Scotia', 'Victoria, British Columbia', 'Sudbury, Ontario'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question:
				'Negara manakah yang “terkurung daratan ganda” (dikelilingi seluruhnya oleh satu atau lebih negara yang terkurung daratan)?',
			options: ['Uzbekistan', 'Swiss', 'Bolivia', 'Etiopia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa negara terkecil di dunia berdasarkan jumlah penduduk?',
			options: ['Nauru', 'Kota Vatikan', 'Kepulauan Marshall', 'Lichtenstein'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa negara Muslim terbesar di dunia?',
			options: ['Pakistan', 'Arab Saudi', 'Indonesia', 'Iran'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara berikut yang bukan merupakan negara anggota PBB?',
			options: ['Tuvalu', 'Niue', 'Sudan Selatan', 'Montenegro'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Di wilayah Inggris manakah kota Portsmouth?',
			options: ['Hampshire', 'Oxfordshire', 'Buckinghamshire', 'Surrey'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota Belarusia?',
			options: ['Warsawa', 'Minsk', 'Kiev', 'Vilnius'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara manakah yang benderanya memiliki daun maple?',
			options: ['Meksiko', 'Brazil', 'Kanada', 'India'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kota manakah yang terbesar di Kanada?',
			options: ['Montreal', 'Vancouver', 'Toronto', 'Ottawa'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa sungai terpanjang di dunia?',
			options: ['Missouri', 'Amazon', 'Yangtze', 'Nil'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question:
				'Manakah dari ciri-ciri geografis berikut yang merupakan terumbu karang berbentuk cincin, pulau, atau rangkaian pulau kecil?',
			options: ['Semenanjung', 'Genting tanah', 'Atol', 'Delta'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kira-kira ada berapa negara di dunia?',
			options: ['200', '100', '300', '500'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara mana yang mengklaim kepemilikan negara bagian Kosovo yang disengketakan?',
			options: ['Serbia', 'Kroasia', 'Albania', 'Makedonia'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari kota berikut yang TIDAK berada di Inggris?',
			options: ['Oxford', 'Edinburgh', 'Manchester', 'Southampton'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Jumlah penduduk di negara bagian New York di AS kira-kira sama dengan?',
			options: ['Rumania', 'Polandia', 'Jerman', 'Hongaria'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama resmi Kereta Api Federal Swiss dalam bahasa Jerman?',
			options: [
				'Schweizerische Bundesbahnen',
				'Schweizerische Nationalbahnen',
				'Bundesbahnen der Schweiz',
				'Schweizerische Staatsbahnen'
			],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Kota apa yang memiliki bandara tersibuk di dunia?',
			options: ['London, Inggris', 'Chicago,Illinois ISA', 'Atlanta, Georgia AS', 'Tokyo, Jepang'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Berapa banyak negara di Inggris?',
			options: ['Empat', 'Dua', 'Tiga', 'Satu'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota Indonesia?',
			options: ['Bandung', 'Medan', 'Jakarta', 'palembang'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Dimana Sungai Volga?',
			options: ['Bulgaria', 'Rusia', 'India', 'Swedia'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa ibu kota Negara Bagian New York di AS?',
			options: ['Kerbau', 'Albany', 'New York', 'Rochester'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Negara apa yang bukan bagian dari Skandinavia?',
			options: ['Norwegia', 'Swedia', 'Denmark', 'Finlandia'],
			correct: 3
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa bahasa resmi Kosta Rika?',
			options: ['Spanyol', 'Bahasa inggris', 'Portugis', 'Kreol'],
			correct: 0
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa nama negara Zimbabwe di Afrika sebelumnya?',
			options: ['Zambia', 'Mozambik', 'Rhodesia', 'Bulawayo'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Frankenmuth, kota di AS yang dijuluki "Bavaria Kecil", terletak di negara bagian apa?',
			options: ['pennsylvania', 'Kentucky', 'Michigan', 'Virginia'],
			correct: 2
		},
		{
			category: 'GEOGRAPHY',
			question: 'Manakah dari negara-negara Afrika berikut yang memasang senjata di benderanya?',
			options: ['Uganda', 'Mozambik', 'Etiopia', 'Nigeria'],
			correct: 1
		},
		{
			category: 'GEOGRAPHY',
			question: 'Apa bahasa Finlandia untuk "Finlandia"?',
			options: ['Eesti', 'Magyarország', 'sangat', 'Suomi'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa merek dan model kendaraan wisata di "Jurassic Park" (1993)?',
			options: ['Ford Explorer XLT 1992', 'Toyota Land Cruiser 1992', 'Jeep Wrangler YJ Sahar 1992', 'Mercedes M-Class'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang berperan sebagai Bruce Wayne dan Batman dalam film "Batman" karya Tim Burton tahun 1989?',
			options: ['George Clooney', 'Val Kilmer', 'Michael Keaton', 'Adam Barat'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: "Aktris mana yang menari bersama John Travolta di 'Pulp Fiction'?",
			options: ['Kathy Griffin', 'Pam Grier', 'Bridget Fonda', 'Uma Thurman'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang membintangi film tahun 1973 "Enter The Dragon"?',
			options: ['Bruce Lee', 'Jackie Chan', 'Jet Li', 'Yun-Fat Chow'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Film "The Wizard of Oz" tahun 1939 berisi seekor kuda yang berubah warna, bahan apa yang mereka gunakan untuk mencapai efek ini?',
			options: ['Pewarna', 'Cat', 'Efek CGI', 'agar-agar'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "Siapa yang memerankan Sersan. Gordon Elias di 'Peleton' (1986)?",
			options: ['Willem Defoe', 'Charlie Sheen', 'Matt Damon', 'Johnny Depp'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Film tahun 1994 mana yang paling dibenci oleh Roger Ebert, dengan mengatakan "Aku benci, benci, benci, benci film ini".',
			options: ['3 Ninja Menendang Kembali', 'Utara', 'Klausul Sinterklas', 'Richie Kaya'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film "Speed" tahun 1994, berapa kecepatan minimum yang harus ditempuh bus agar bom tidak meledak?',
			options: ['60 mph', '40 mph', '70 mph', '50 mph'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Penjahat Batman mana yang dikenal sebagai pengisi suara Mark Hamill?',
			options: ['Muka dua', 'Kutukan', 'Pelawak', 'Diam'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film seri Peter Jackson "The Lord of the Rings" diambil seluruhnya di negara manakah?',
			options: ['Skotlandia', 'Kanada', 'Selandia Baru', 'Islandia'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa film James Bond pertama?',
			options: ['Dr.Tidak', 'Jari Emas', 'Dari Rusia Dengan Cinta', 'Bola petir'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa film animasi komputer berdurasi panjang yang pertama?',
			options: ['Tron', 'Raja singa', '101 Dalmatian', 'Cerita Mainan'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa petinju yang terkenal memukul gong dalam pengantar film J. Arthur Rank?',
			options: ['Freddie Mills', 'Terry Spinks', 'Pembom Billy Wells', 'Don Cockell'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa sutradara film "Silence of the Lambs" tahun 1991?',
			options: ['Stanley Kubrick', 'Frank Darabont', 'Michael Bay', 'Jonathan Demme'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa nama pembunuh di film "Hellboy" pertama?',
			options: ['Karl Ruprecht Kroenen', 'Klaus Werner von Krupt', 'Grigori Efimovich Rasputin', 'Ilsa Haupstein'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Tahun berapa film James Cameron "Titanic" tayang di bioskop?',
			options: ['1996', '1997', '1998', '1999'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film karya sutradara Stanley Kubrick manakah yang diketahui merupakan adaptasi dari novel Stephen King?',
			options: ['2001: Pengembaraan Luar Angkasa', 'Dr Strangelove', 'Mata Tertutup Lebar', 'Yang Bersinar'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "Kapan film 'Con Air' dirilis?",
			options: ['1997', '1985', '1999', '1990'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Pahlawan super Marvel mana yang dimainkan Chris Evans sebelum perannya sebagai Captain America?',
			options: ['Cyclops', 'Obor Manusia', 'Tukang es', 'Pemberani'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Aktor bintang manakah yang ada di "Top Gun", "Jerry Maguire" dan "Born on the Fourth of July"?',
			options: ['Kelly McGillis', 'John Travolta', 'Tom Cruise', 'George Clooney'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film "The Lorax" tahun 2012, siapakah tokoh antagonisnya?',
			options: ['Ted Wiggins', 'Yang Sekali-Ler', "Aloysius O'Hare", 'Norma Grammy'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa film Marx Brothers terakhir yang menampilkan Zeppo?',
			options: ['Suatu Malam di Opera', 'Sup Bebek', 'Sehari di Balapan', 'Bisnis Monyet'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa nama tengah Humphrey Bogart?',
			options: ['Menebang hutan', 'DeWinter', 'Steven', 'Bryce'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Berapa biaya yang dikeluarkan Tommy Wiseau untuk membuat karya besarnya "The Room" (2003)?',
			options: ['$6 Juta', '$20.000', '$1 Juta', '$10 Juta'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di alam semesta "Jurassic Park", kapan "Jurassic Park: San Diego" mulai dibangun?',
			options: ['1988', '1986', '1985', '1993'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Film ini memuat kutipan, "Saya merasakan kebutuhan...kebutuhan akan kecepatan!"',
			options: ['Hari Guntur', 'Warna Uang', 'Koktail', 'Senjata Teratas'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Monster apa yang pertama kali muncul bersama Godzilla?',
			options: ['Raja Kong', 'Mothra', 'Raja Ghidora', 'Angirus'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Leonardo Di Caprio memenangkan Oscar Aktor Terbaik pertamanya atas penampilannya di film apa?',
			options: ['Yang Revenant', 'Serigala Wall Street', 'Pulau Rana', 'Lahirnya'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam film tahun 2002 "Kung Pow! Enter the Fist", mengapa Wimp Lo sengaja salah dilatih?',
			options: ['Sebagai lelucon', 'Untuk curang', 'Pembalasan dendam', 'Untuk mengujinya'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di serial Friday The 13th, siapa nama depan ibu Jason?',
			options: ['Maria', 'Christine', 'Angeline', 'Pamela'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Di alam semesta "Jurassic Park", dinosaurus apa yang pertama kali dikloning oleh InGen pada tahun 1986?',
			options: ['Triceratop', 'Troodon', 'Brachiosaurus', 'Velociraptor'],
			correct: 3
		},
		{
			category: 'ENTERTAINMENT',
			question: "Siapa yang menyutradarai Marvel's Avengers Endgame?",
			options: ['Saudara Russo', 'Zack Sinder', 'Josh Whedon', 'Kevin Feige'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Apa nama film "Star Wars" pertama berdasarkan urutan rilisnya?',
			options: ['Sebuah Harapan Baru', 'Ancaman Hantu', 'Kekuatan Bangkit', 'Balas dendam Sith'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Siapa yang menyediakan sebagian besar lagu dan lirik untuk "Spirit: Stallion of the Cimarron"?',
			options: ['Bryan Adams', 'Hancurkan Mulut', 'Oasis', 'Pasokan Udara'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Setelah India, negara manakah yang memproduksi film terbanyak kedua per tahun?',
			options: ['Amerika Serikat', 'Cina', 'Nigeria', 'Perancis'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Manakah dari berikut ini yang BUKAN kutipan dari film Casablanca tahun 1942?',
			options: [
				'"Ini dia, Nak."',
				'“Sejujurnya, sayangku, aku tidak peduli.”',
				'"Dari semua kedai gin, di semua kota, di seluruh dunia, dia masuk ke tempatku..."',
				'"Tangkap tersangka yang biasa."'
			],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question: "Di negara Afrika manakah film 'Blood Diamond' tahun 2006 paling banyak berlatar belakang?",
			options: ['Sierra Leone', 'Liberia', 'Burkina Faso', 'Republik Afrika Tengah'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Kota manakah yang menjadi lokasi film Disney The Love Bug (1968)?',
			options: ['Los Angeles', 'Sacramento', 'San Fransisco', 'San Jose'],
			correct: 2
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Artis musikal manakah yang memiliki peran penting dalam film "Kingsman: The Golden Circle" tahun 2017?',
			options: ['Elton John', 'Nyonya Gaga', 'Rihanna', 'Justin Bieber'],
			correct: 0
		},
		{
			category: 'ENTERTAINMENT',
			question: 'Dalam reboot Nightmare on Elm Street 2010, siapa yang memerankan Freddy Kruger?',
			options: ['Tyler Mane', 'Jackie Earle Haley', 'Derek Mears', 'Gunnar Hansen'],
			correct: 1
		},
		{
			category: 'ENTERTAINMENT',
			question:
				'Bela Lugosi adalah aktor Hongaria-Amerika yang terkenal karena peran utamanya dalam film horor tahun 1931 apa?',
			options: ['Dr Frankenstein', 'manusia serigala', 'Makhluk dari Black Lagoon', 'Hitung Drakula'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Tim apa yang dikalahkan Inggris di babak semifinal untuk menjadi juara di final Piala Dunia 1966?',
			options: ['Jerman Barat', 'Portugal', 'Uni Soviet', 'Brazil'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa pencetak gol terbanyak Piala Dunia FIFA 2014?',
			options: ['Thomas Muller', 'Lionel Messi', 'James Rodríguez', 'Neymar'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Berapa panjang pasti bagian tidak melengkung pada Jalur 1 Lintasan Olimpiade?',
			options: ['100m', '100 yard', '84,39m', '109,36 kaki'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Negara mana yang menjadi tuan rumah Piala Dunia FIFA 2018?',
			options: ['Rusia', 'Jerman', 'Amerika Serikat', 'Arab Saudi'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Negara mana yang menjadi tuan rumah Piala Dunia FIFA 2022?',
			options: ['Qatar', 'Uganda', 'Vietnam', 'Bolivia'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Tahun berapa Super Bowl ketiga diadakan?',
			options: ['1968', '1971', '1969', '1970'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari pemain NHL berikut yang belum pernah memenangkan Hart Trophy untuk MVP Musim Reguler?',
			options: ['Chris Pronger', 'Jose Theodore', 'Steve Yzerman', 'Henrik Sedin'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Tim nasional apa yang memenangkan UEFA Nations League pertama?',
			options: ['Belanda', 'Inggris', 'Swiss', 'Portugal'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari pitcher berikut yang dinobatkan sebagai Rookie of the Year Liga Nasional untuk musim 2013?',
			options: ['Yakub deGrom', 'Jose Fernandez', 'Shelby Miller', 'Matt Harvey'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Negara mana yang memenangkan Piala Dunia FIFA 2018 yang diselenggarakan di Rusia?',
			options: ['Perancis', 'Kroasia', 'Belgia', 'Inggris'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa pemain NBA yang paling banyak bermain sepanjang kariernya?',
			options: ['Kareem Abdul-Jabbar', 'Kevin Garnett', 'Kobe Bryant', 'Paroki Robert'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Dalam olahraga apa yang digunakan "shuttlecock"?',
			options: ['Bulutangkis', 'Tenis meja', 'Ragbi', 'Jangkrik'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan NFL Super Bowl LI? (51)',
			options: ['Elang', 'Broncos', 'Elang', 'Patriot'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Tim mana yang menjadi Juara NBA 2015-2016?',
			options: ['Prajurit Negara Emas', 'Toronto Raptor', 'Cleveland Cavalier', 'Guntur Kota Oklahoma'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Tim mana yang memenangkan Liga Premier Inggris 2015-16?',
			options: ['Liverpool', 'Kota Leicester', 'Cheslea', 'Manchester United'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Olahraga apa yang menonjolkan istilah love, deuce, match, dan volley?',
			options: ['Tenis', 'Jangkrik', 'Bola basket', 'Keriting'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Berapa banyak pemain sepak bola yang harus berada di lapangan pada saat yang bersamaan?',
			options: ['20', '22', '24', '26'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Siapa orang Afrika-Amerika yang ikut bertanggung jawab dalam mengintegrasikan bisbol Liga Utama?',
			options: ['Jackie Robinson', 'Banjir Singkat', 'Roy Campanella', 'Satchell Paige'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan "Liga Champions" pada tahun 1999?',
			options: ['Barcelona', 'Manchester United', 'Bayern Munich', 'Liverpool'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question:
				'Pegulat profesional manakah yang jatuh dari langit hingga meninggal saat acara Bayar-Per-Tayang langsung pada tahun 1999?',
			options: ['Chris Benoit', 'Lex Luger', 'Al Salju', 'Owen Hart'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Siapakah pemain putri peraih medali emas tunggal tenis meja Olimpiade 2016?',
			options: ['LI Xiaoxia (Tiongkok)', 'Ai FUKUHARA (Jepang)', 'Lagu KIM (Korea Utara)', 'DING Ning (Tiongkok)'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang paling banyak memainkan turnamen di tim sepak bola nasional Brasil?',
			options: ['kafe', 'Ronaldo', 'Kaka', 'Roberto Carlos'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Apa itu "Olahraga Para Raja"?',
			options: ['Pacuan Kuda', 'Catur', 'berkelahi', 'Pagar'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Siapa yang memenangkan Piala Stanley 2011?',
			options: ['Boston Bruin', 'Montreal Kanada', 'Penjaga New York', 'Daun Maple Toronto'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Pabrikan mobil mana yang memenangkan 24 Hours of Le Mans 2017?',
			options: ['Porsche', 'Toyota', 'Audi', 'Chevrolet'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Pegulat mana yang memenangkan Royal Rumble Putra 2019?',
			options: ['Seth Rollins', 'Braun Strowman', 'Gaya AJ', 'Andrade'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Lagu "Three Lions" oleh Lightning Seeds dibuat untuk acara sepak bola besar apa pada tahun 1996?',
			options: ['Piala Dunia', 'Liga Champions', 'Kejuaraan Eropa', 'Piala Konfederasi'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Siapakah pegulat profesional Inggris Shirley Crabtree yang lebih dikenal?',
			options: ['Tumpukan Jerami Raksasa', 'Kendo Nagasaki', 'Masambula', 'Ayah Besar'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Manakah dari tim berikut yang bukan anggota era "Original Six" NHL?',
			options: ['Penjaga New York', 'Daun Maple Toronto', 'Boston Bruin', 'Selebaran Philadelphia'],
			correct: 3
		},
		{
			category: 'SPORTS',
			question: 'Kota manakah yang menampilkan semua seragam tim olahraga profesionalnya dengan skema warna yang sama?',
			options: ['Pittsburg', 'New York', 'Seattle', 'Teluk Tampa'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Pembalap mana yang pernah menjadi juara dunia Formula 1 sebanyak 7 kali?',
			options: ['Ayrton Senna', 'Michael Schumacher', 'Fernando Alonso', 'Jim Clark'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Dalam sepak bola Kanada, mencetak pemerah pipi bernilai berapa poin?',
			options: ['2', '3', '1', '4'],
			correct: 2
		},
		{
			category: 'SPORTS',
			question: 'Tahun berapa berdirinya Klub Sepak Bola Italia Bari?',
			options: ['1945', '1908', '2014', '1895'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Stimpmeter mengukur kelajuan bola pada permukaan apa?',
			options: ['Lapangan Sepak Bola', 'Golf Puting Hijau', 'Lapangan Kriket', 'Meja Pinball'],
			correct: 1
		},
		{
			category: 'SPORTS',
			question: 'Apa nama stadion kandang Manchester United?',
			options: ['Old Trafford', 'Anfield', 'Stadion Kota Manchester', 'Taman St.James'],
			correct: 0
		},
		{
			category: 'SPORTS',
			question: 'Olimpiade Musim Panas Rio 2016 mengadakan upacara penutupannya pada tanggal berapa?',
			options: ['23 Agustus', '19 Agustus', '17 Agustus', '21 Agustus'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'OS Windows dikembangkan oleh perusahaan mana?',
			options: ['Apel', 'Microsoft', 'Nokia', 'IBM'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Dalam pemrograman, operator ternary sebagian besar didefinisikan dengan simbol apa?',
			options: ['??', 'jika kemudian', '?:', '?'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Format gambar apa yang paling disukai digunakan untuk logo di database Wikimedia?',
			options: ['.png', '.jpeg', '.svg', '.gif'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari istilah GPU?',
			options: ['Unit Pemrosesan Grafis', 'Unit Prosesor Game', 'Unit Penghasil Grafit', 'Unit Kepemilikan Grafis'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Ilmuwan komputer Belanda Mark Overmars terkenal karena menciptakan mesin pengembangan game yang mana?',
			options: ['Stensil', 'Pembuat Game', 'Membangun', 'torsi 2D'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa pemrograman C diciptakan oleh ilmuwan komputer Amerika ini.',
			options: ['Tim Berners Lee', 'al-Khwarizmī', 'Dennis Richie', 'Willis Ware'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Perusahaan apa yang pertama kali menggunakan istilah "Golden Master"?',
			options: ['IBM', 'Microsoft', 'Google', 'Apel'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan AD dalam kaitannya dengan Sistem Operasi Windows?',
			options: ['Drive Alternatif', 'Basis Data Otomatis', 'Direktori Aktif', 'Departemen Aktif'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari berikut ini yang bukan merupakan nilai utama pengembangan perangkat lunak Agile?',
			options: ['Individu dan interaksi', 'Kolaborasi pelanggan', 'Menanggapi perubahan', 'Dokumentasi yang komprehensif'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama tema default yang diinstal pada Windows XP?',
			options: ['Neptunus', 'peluit', 'Kebahagiaan', 'Luna'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Arsitektur Harvard untuk pengontrol mikro menambahkan bus tambahan yang mana?',
			options: ['Petunjuk', 'Alamat', 'Data', 'Kontrol'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari berikut ini yang bukan merupakan lapisan dalam model OSI untuk komunikasi data?',
			options: ['Lapisan Koneksi', 'Lapisan Aplikasi', 'Lapisan Transportasi', 'Lapisan Fisik'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: '.at adalah domain tingkat teratas untuk negara apa?',
			options: ['Argentina', 'Australia', 'Austria', 'Angola'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa pemrograman apa yang dikembangkan oleh Sun Microsystems pada tahun 1995?',
			options: ['ular piton', 'SolarisOS', 'C++', 'Jawa'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'CMOS adalah teknologi yang digunakan untuk membangun sirkuit terintegrasi. Apa kepanjangan dari CMOS?',
			options: [
				'Semikonduktor magnet-ohm komplementer',
				'Semikonduktor logam-oksida-komplementer',
				'Sistem operasi buatan komputer',
				'Statis berosilasi buatan komputer'
			],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama kerentanan keamanan yang ditemukan di Bash pada tahun 2014?',
			options: ['Berdarah hati', 'bug bug', 'Demam panggung', 'Kejutan kerang'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa nilai maksimum bilangan bulat biner bertanda 32-bit?',
			options: ['255', '2.147.483.647', '2048', '9.223.372.036.854.775.807'],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question: "Apa kepanjangan dari 'S' dalam algoritma enkripsi RSA?",
			options: ['Aman', 'Schottky', 'Stabil', 'Shamir'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: "Apa pintasan keyboard yang umum digunakan untuk fungsi 'Salin' di OS Windows?",
			options: ['Ctrl + X', 'Alt + C', 'Alt+X', 'Ctrl + C'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Kira-kira berapa banyak komputer pribadi Apple I yang dibuat?',
			options: ['200', '100', '500', '1000'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Seberapa cepat USB 3.1 Gen 2 secara teoritis?',
			options: ['5 Gb/dtk', '8 Gb/dtk', '1 Gb/dtk', '10 Gb/dtk'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Unix Time didefinisikan sebagai jumlah detik yang telah berlalu sejak kapan?',
			options: [
				'Tengah malam, 4 Juli 1976',
				'Tengah malam di hari ulang tahun pencipta Unix',
				'Tengah malam, 1 Januari 1970',
				'Tengah malam, 4 Juli 1980'
			],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Dalam komputasi, apa kepanjangan dari MIDI?',
			options: [
				'Antarmuka Musik Instrumen Digital',
				'Antarmuka Digital Alat Musik',
				'Antarmuka Modular Instrumen Digital',
				'Antarmuka Data Alat Musik'
			],
			correct: 1
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Awalnya digunakan pada adaptor PCM, berapa frekuensi standar untuk pengambilan sampel audio dalam format Compact Disc Digital Audio?',
			options: ['32,0 kHz', '1,5MHz', '44,1 kHz', '20,5 kHz'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari tipologi fisik berikut yang digunakan dengan Jaringan Ethernet?',
			options: ['Bintang', 'Cincin', 'Jala', 'kutukan'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa nama gambar yang ditampilkan sebagai wallpaper latar belakang default untuk Windows XP?',
			options: ['Kebahagiaan', 'biru', 'Gurun bulan merah', 'Tulip'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Kerentanan apa yang menduduki peringkat #1 dalam 10 Teratas OWASP pada tahun 2013?',
			options: ['Otentikasi Rusak', 'Skrip Lintas Situs', 'Referensi Objek Langsung Tidak Aman', 'Injeksi'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Printer laserjet dan inkjet merupakan contoh printer jenis apa?',
			options: ['Printer non-dampak', 'Pencetak dampak', 'Printer roda daisy', 'Pencetak titik matriks'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa singkatan dari perangkat lunak komputer JVM?',
			options: ['Mesin Vendor Java', 'Mesin Visual Java', 'Mesin Virtual Java', 'Hanya Mesin Virtual'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Bahasa komputer manakah yang akan Anda kaitkan dengan kerangka Django?',
			options: ['C#', 'C++', 'Jawa', 'ular piton'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question:
				'Pada keyboard QWERTY standar Amerika, simbol apa yang akan Anda masukkan jika Anda menahan tombol shift dan menekan 1?',
			options: ['Tanda seru', 'Tanda Dolar', 'Tanda Persen', 'Asterisk'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Secara umum, komponen komputer manakah yang paling banyak menggunakan daya?',
			options: ['Kartu Video', 'Harddisk', 'Prosesor', 'Catu Daya'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Manakah dari bahasa pemrograman berikut yang merupakan bahasa tingkat rendah?',
			options: ['ular piton', 'C#', 'Pascal', 'Perakitan'],
			correct: 3
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa prosesor komputer pertama yang tersedia secara komersial?',
			options: ['Intel 4004', 'Intel 486SX', 'TMS 1000', 'AMDAM386'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Semua program berikut diklasifikasikan sebagai editor grafis raster KECUALI:',
			options: ['pemandangan tinta', 'Cat.NET', 'GIMP', 'Adobe Photoshop'],
			correct: 0
		},
		{
			category: 'TECHNOLOGY',
			question: 'Berapa kilobyte dalam satu gigabyte (dalam desimal)?',
			options: ['1024', '1000', '1000000', '1048576'],
			correct: 2
		},
		{
			category: 'TECHNOLOGY',
			question: 'Apa kepanjangan dari istilah USB?',
			options: ['Noda Simtex Universal', 'Bus Serial Universal', 'Bus Sinyal Terpadu', 'Pendukung Semtex yang disatukan'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Burung apa yang lahir dengan cakar di jari sayapnya?',
			options: ['Dandang', 'Kasuari', 'Sekretaris burung', 'Hoatzin'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Jenis anjing apa yang diberi nama berdasarkan suatu wilayah di Kroasia',
			options: ['orang Peking', 'Dalmatian', 'Chihuahua', 'anjing Pomeranian'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Manakah dari hewan berikut yang tidak nyata?',
			options: ['Singa Nemea', 'Naga Laut', 'Setan Tasmania', 'Cumi Raksasa'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Manakah nama lain dari "Poecilotheria Metallica Tarantula" berikut ini?',
			options: ['keren', 'Pelompat', 'Garis Perak', 'Sedih'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah manusia modern?',
			options: ['Homo Ergaster', 'Homo Erectus', 'Homo Sapiens', 'Homo Neanderthalensis'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Berapa jumlah rata-rata chinchilla yang dilahirkan dalam satu anak?',
			options: ['10-15', '5-8', '2-3', '15-18'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Siapa nama asli Kucing Pemarah?',
			options: ['Saus Tardar', 'Saus', 'Minnie', 'Brokoli'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Berapa umur rata-rata kelinci domestik?',
			options: ['1-2 tahun', '8-12 tahun', '4-7 tahun', '14-20 tahun'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Kasmir adalah wol dari jenis hewan apa?',
			options: ['Domba', 'Unta', 'Kambing', 'Lama'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Hewan karnivora memakan daging, hewan nucivora memakan apa?',
			options: ['Tidak ada', 'Buah', 'Gila', 'Rumput laut'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa nama protein kaya tembaga yang menghasilkan darah biru pada gurita Antartika?',
			options: ['sitokrom', 'Besi', 'Metionin', 'hemosianin'],
			correct: 3
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah simpanse biasa?',
			options: ['Gorila gorila', 'Pan troglodytes', 'Pan paniskus', 'Panthera leo'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Aardwolf termasuk dalam keluarga ilmiah apa?',
			options: ['Canidae', 'Felidae', 'Hyaenidae', 'Eupleridae'],
			correct: 2
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah dari Budgerigar?',
			options: ['Nymphicus hollandicus', 'Melopsittacus undulatus', 'Pyrrhura molinae', 'Ara Makau'],
			correct: 1
		},
		{
			category: 'NATURE',
			question: 'Jenis anjing apa yang secara tradisional diasosiasikan dengan petugas pemadam kebakaran?',
			options: ['Dalmatian', 'Shepard Jerman', 'orang Denmark yang hebat', 'Mastif'],
			correct: 0
		},
		{
			category: 'NATURE',
			question: 'Apa nama ilmiah Elang Botak?',
			options: ['Haliaeetus Leucocephalus', 'Tyto Alba', 'Cyanocitta Cristata', 'Aquila Chrysaetos'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Apa gelar lengkap Perdana Menteri Inggris?',
			options: ['Tuan Pertama Perbendaharaan', 'Adipati Cambridge', 'Oposisi Setia Yang Mulia', 'Manajer Perkebunan Mahkota'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Apa ciri khas seseorang yang digambarkan berbulu?',
			options: ['Kasar', 'Lucu', 'Tinggi', 'Berbulu'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari perusahaan berikut yang TIDAK memproduksi mobil?',
			options: ['Nissan', 'GMC', 'Perintah', 'ducati'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Sciophobia adalah ketakutan terhadap apa?',
			options: ['Makan', 'Lampu terang', 'Angkutan', 'Bayangan'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Bidang ini terkadang dikenal sebagai "Ilmu Pengetahuan yang Suram".',
			options: ['Filsafat', 'Politik', 'Fisika', 'Ekonomi'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Negara manakah yang memiliki bendera Union Jack?',
			options: ['Afrika Selatan', 'Kanada', 'Hongkong', 'Selandia Baru'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Dari keempat gedung tersebut, manakah yang paling tinggi dengan tinggi 1.776 kaki (541,3 m)?',
			options: [
				'Taipei 101, Taiwan',
				'Menara Willis, Amerika Serikat',
				'Menara Jin Mao, Tiongkok',
				'One World Trade Center, Amerika Serikat'
			],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Ke arah mana Patung Liberty menghadap?',
			options: ['Tenggara', 'Barat daya', 'Barat laut', 'Timur laut'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Zodiak manakah yang diwakili oleh Kepiting?',
			options: ['Kanker', 'Libra', 'Virgo', 'Sagittarius'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Sereal monster General Mills Corporation manakah yang terakhir dirilis pada tahun 1970-an?',
			options: ['Buah Kasar', 'Hitung Chocula', 'Frank Berry', 'Boo-Berry'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Apa nama video pertama yang diunggah ke YouTube?',
			options: ['upeti', 'Saya di kebun binatang', 'Carrie mengendarai truk', 'Anak anjing barunya dari kakek buyut vern.'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Buah apa yang menjadi bahan tradisional Black Forest Gateau?',
			options: ['Aprikot', 'ceri', 'Kismis', 'Apel'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Apa nama pedal ekstra pada mobil bertransmisi manual atau standar?',
			options: ['Pemindah gigi', 'Pemacu', 'Rem Parkir', 'Mencengkeram'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Bob dan Mike Bryan adalah kakak beradik yang terkenal dalam olahraga apa?',
			options: ['Bola basket', 'Sepak bola', 'Tenis', 'Baseball'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Gunung manakah yang memiliki puncak tertinggi di Amerika Utara?',
			options: ['Gunung Saint Elias, perbatasan AS/Kanada', 'Gunung Logan, Kanada', 'Pico de Orizaba, Meksiko', 'Denali, AS'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Presiden Amerika mana yang muncul pada uang satu dolar?',
			options: ['Thomas Jefferson', 'Abraham Lincoln', 'George Washington', 'Benyamin Franklin'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa Jerman untuk "sendok"?',
			options: ['Loffel', 'Gabel', 'Tuan', 'Essstäbchen'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Tahun berapa Walt Disney lahir?',
			options: ['1901', '1902', '1903', '1900'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Sisa-sisa terkubur penjelajah Inggris Australia manakah yang ditemukan di London pada Januari 2019?',
			options: ['William Bourke', 'Abel Tasman', 'Matius Flinders', 'Dirk Hartog'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa huruf terakhir dari alfabet Yunani?',
			options: ['Akhir', 'Mu', 'epsilon', 'Kappa'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari bahasa berikut yang TIDAK menggunakan gender sebagai bagian tata bahasanya?',
			options: ['Jerman', 'Denmark', 'Polandia', 'Turki'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Salah satu pendiri Apple Steve Jobs meninggal karena komplikasi kanker jenis apa?',
			options: ['Tulang', 'pankreas', 'Hati', 'Perut'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari kata berikut yang mengacu pada sesuatu yang dibuat, didistribusikan, atau dijual secara ilegal?',
			options: ['Tukang penggosok sepatu', 'Menyelundupkan', 'tali sepatu', 'tali sepatu'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Siapa nama belakang Papa John yang terkenal itu?',
			options: ['sup kental', 'Schnatter', 'Williams', 'ANDERSON'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Awalnya kata lain untuk poppy, coquelicot adalah warna apa?',
			options: ['Merah', 'Hijau', 'Biru', 'Berwarna merah muda'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Kata "abulia" berarti yang mana dari berikut ini?',
			options: [
				'Ketidakmampuan untuk membuat keputusan',
				'Ketidakmampuan untuk berdiri',
				'Ketidakmampuan untuk berkonsentrasi pada apa pun',
				'Keinginan yang menggebu-gebu untuk merobek pakaian seseorang'
			],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari berikut ini yang bukan Universitas Ivy League?',
			options: ['Universitas Pennsylvania', 'Harvard', 'Stanford', 'Pangeran'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa resmi Brasil?',
			options: ['Brazil', 'Spanyol', 'Bahasa inggris', 'Portugis'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Perusahaan apa yang mengembangkan vocaloid Hatsune Miku?',
			options: ['Sega', 'Sony', 'Media Masa Depan Crypton', 'Perusahaan Yamaha'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Frank Lloyd Wright adalah arsitek dibalik bangunan terkenal apa?',
			options: ['Vila Savoye', 'Guggenheim', 'Gedung Opera Sydney', 'Jarum Luar Angkasa'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Bumbu esensial apa yang juga dikenal sebagai lobak Jepang?',
			options: ['Mentsuyu', 'Karashi', 'Ponzu', 'Wasabi'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question:
				'Virgin Trains, Virgin Atlantic, dan Virgin Racing, apakah semua perusahaan itu dimiliki oleh pengusaha terkenal yang mana?',
			options: ['Alan Gula', 'Donald Trump', 'Richard Branson', 'Bill Gates'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Di negara manakah Olimpiade Musim Panas 1992 diadakan?',
			options: ['Spanyol', 'Rusia', 'Korea', 'Amerika Serikat'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Apa sistem angkutan cepat terbesar di dunia berdasarkan jumlah stasiun, dengan 472 stasiun yang beroperasi?',
			options: ['Kereta Bawah Tanah Kota New York', 'Metro Shanghai', 'London Bawah Tanah', 'U-Bahn Berlin'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Apa bahasa resmi Kuba yang paling banyak digunakan?',
			options: ['Portugis', 'Perancis', 'Italia', 'Spanyol'],
			correct: 3
		},
		{
			category: 'GENERAL',
			question: 'Apa itu H2O?',
			options: ['Air', 'Oksigen', 'Hidrogen', 'Tidak ada'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Berapa banyak huruf dalam alfabet bahasa Inggris?',
			options: ['28', '26', '23', '24'],
			correct: 1
		},
		{
			category: 'GENERAL',
			question: 'Manakah dari permainan ritme berikut yang dibuat oleh Harmonix?',
			options: ['Daging Mengalahkan Mania', 'Pahlawan Gitar Langsung', 'Band Rock', 'Revolusi Tari Tari'],
			correct: 2
		},
		{
			category: 'GENERAL',
			question: 'Sungai manakah yang mengalir melalui kota Glasgow di Skotlandia?',
			options: ['Clyde', 'Tay', 'Dee', 'Wol'],
			correct: 0
		},
		{
			category: 'GENERAL',
			question: 'Bumbu apa yang paling mahal di dunia berdasarkan beratnya?',
			options: ['Kayu manis', 'Kapulaga', 'Kunyit', 'Vanila'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari tokoh mitologi Mesopotamia berikut yang BUKAN dewa?',
			options: ['Enki', 'Enlil', 'Enkidu', 'Enkimdu'],
			correct: 2
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Dewa Yunani & Romawi manakah yang dikenal sebagai dewa musik, kebenaran dan ramalan, penyembuhan, matahari dan cahaya, wabah penyakit, puisi, dan banyak lagi?',
			options: ['Afrodit', 'Apollo', 'Artemis', 'Athena'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Apa hukuman atas kelicikan Sysiphus?',
			options: [
				'Terkutuklah untuk menggulingkan batu besar ke atas bukit selamanya.',
				'Diikat pada batu besar untuk selama-lamanya, dipatuk burung.',
				'Berdiri di danau yang berisi air, dia tidak bisa minum.',
				'Untuk menebang pohon yang tumbuh kembali setelah setiap ayunan kapak.'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question:
				'Nama dewi Yunani ini dipilih untuk planet kerdil yang menyebabkan perselisihan klasifikasi Pluto di kalangan astronom.',
			options: ['Charon', 'Ceres', 'Disnomia', 'Eris'],
			correct: 3
		},
		{
			category: 'MYTHOLOGY',
			question: 'Manakah dari berikut ini yang tidak benar mengenai kehidupan Tiresias?',
			options: [
				'Berlayar bersama para Argonaut untuk menemukan bulu emas',
				'Athena mengubahnya menjadi seorang wanita, dan bertahun-tahun kemudian kembali menjadi seorang pria',
				'Hera membutakannya setelah dia setuju dengan Zeus dalam sebuah argumen',
				'Terungkap kepada Oedipus bahwa Oedipus telah menikah dengan ibunya sendiri'
			],
			correct: 0
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dalam mitologi Nordik, apa nama ular yang memakan akar pohon abu Yggdrasil?',
			options: ['Bragi', 'Nidhogg', 'Odin', 'Ymir'],
			correct: 1
		},
		{
			category: 'MYTHOLOGY',
			question: 'Dewa Norse Odin memiliki dua burung gagak peliharaan bernama "Huginn" dan "Muninn".  Apa arti nama mereka?',
			options: ['Pikiran & Memori', 'Kekuatan & Kedamaian', 'Perang & Pembelajaran', 'Tidur & Bangun'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari perusahaan berikut yang TIDAK memproduksi sepeda motor?',
			options: ['Honda', 'Kawasaki', 'yamaha', 'Toyota'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: "Negara manakah yang memiliki STNK internasional huruf 'A'?",
			options: ['Austria', 'Afganistan', 'Australia', 'Armenia'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Hewan apa yang terdapat pada logo Abarth, divisi motorsport Fiat?',
			options: ['Kalajengking', 'Ular', 'Banteng', 'Kuda'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari model mobil berikut yang paling sering direkayasa lencananya (rebadged)?',
			options: ['Polisi Isuzu', 'Holden Monaro', 'Suzuki Swift', 'Chevy Camaro'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Perusahaan supercar mana yang berasal dari Swedia?',
			options: ['Bugatti', 'lamborghini', 'McLaren', 'Koenigsegg'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari berikut ini yang tidak dibuat oleh Ford?',
			options: ['Fusi', 'Model A', 'F-150', 'kamera'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Mobil Jaguar sebelumnya dimiliki oleh produsen mobil yang mana?',
			options: ['Chrysler', 'Motor Umum', 'Perintah', 'Mengarungi'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Berapa banyak roda yang dimiliki sepeda roda satu?',
			options: ['1', '4', '3', '6'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question: 'Manakah dari kendaraan berikut yang memiliki atap kaca penuh pada model dasarnya?',
			options: ['Renault Avantime', 'Chevy Volt', 'Mercedes-Benz A-Class', 'Honda Odyssey'],
			correct: 0
		},
		{
			category: 'VEHICLES',
			question:
				'Manakah di antara berikut ini yang BUKAN merupakan model mobil yang diproduksi oleh produsen mobil Malaysia, Proton?',
			options: ['Kisah', 'Kelisa', 'Perdana', 'inspirasi'],
			correct: 1
		},
		{
			category: 'VEHICLES',
			question: 'Pabrikan mana yang membuat mobil tersebut digunakan di Back to the Future?',
			options: ['Mengarungi', 'Toyota', 'Daihatsu', 'DeLorean'],
			correct: 3
		},
		{
			category: 'VEHICLES',
			question: 'Apa mobil legal jalan raya tercepat di dunia?',
			options: ['Racun Hennessy GT', 'Bugatti Veyron Super Sport', 'Koenigsegg Agera RS', 'Pagani Huayra SM'],
			correct: 2
		},
		{
			category: 'VEHICLES',
			question: 'Mesin VR6 legendaris Volkswagen memiliki silinder yang diposisikan pada sudut berapa?',
			options: ['30 Derajat', '15 Derajat', '45 Derajat', '90 Derajat'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: "Apa nama anjing berkepala tiga di Harry Potter and the Sorcerer's Stone?",
			options: ['Paku', 'Empuk', 'bodoh', 'Titik'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question:
				'Drama ini umumnya dianggap sebagai karya Shakespeare yang paling mudah beradaptasi, dan mengikuti dua "kekasih yang bernasib sial".',
			options: ['Romeo dan Juliet', 'Dukuh', 'Badai', 'Raja Lear'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Manakah dari penulis berikut yang tidak lahir di Inggris?',
			options: ['Graham Greene', 'HG Wells', 'Arthur C Clarke', 'Arthur Conan Doyle'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'George Orwell menulis buku ini, yang sering dianggap sebagai pernyataan tentang pengawasan pemerintah.',
			options: ['1984', 'Orang Tua dan Laut', 'Penangkap dan Rye', 'Untuk Membunuh Burung Mockingbird'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Apa nama geng yang diikuti Ponyboy dalam buku The Outsiders?',
			options: ['Orang Luar', 'Mafia', 'Sosial', 'Para Gemuk'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question:
				'Dalam novel "Jurassic Park" karya Michael Crichton, John Hammond menemui ajalnya di cakar dinosaurus yang mana?',
			options: ['Dilophosaurus', 'Tyrannosaurus Rex', 'Prokompsognathus', 'Velociraptor'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Apa judul buku Sherlock Holmes pertama karya Arthur Conan Doyle?',
			options: ['Tanda Empat', 'Sebuah Studi di Scarlet', 'Kasus Identitas', 'Perbuatan Raffles Haw'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Manakah yang BUKAN buku dalam Seri Harry Potter?',
			options: ['Kamar Rahasia', 'Peri Rumah', 'Tahanan Azkaban', 'Relikui Kematian'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Dalam serial "Harry Potter", siapa nama lengkap Kepala Sekolah Dumbledore?',
			options: [
				'Albus Valum Jetta Mobius Dumbledore',
				'Albus James Lunae Otto Dumbledore',
				'Albus Percival Wulfric Brian Dumbledore',
				'Albus Valencium Horatio Kul Dumbledore'
			],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Novel "Jane Eyre" ditulis oleh penulis apa?',
			options: ['Emily Bronte', 'Jane Austen', 'Louisa May Alcott', 'Charlotte Bronte'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Novelis mata-mata terkenal manakah yang menulis cerita anak-anak "Chitty-Chitty-Bang-Bang"?',
			options: ['Joseph Conrad', 'John Buchan', 'Ian Fleming', 'Graham Greene'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Dari manakah judul buku “Keheningan Anak Domba” diperoleh?',
			options: [
				'Kaitannya dengan pembunuhan orang tak berdosa',
				'Makanan favorit penjahat',
				'Trauma tokoh utama di masa kecil',
				'Suara orang tak bersalah dibungkam oleh penguasa'
			],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Dalam novel tahun 1984 yang ditulis oleh George Orwell, apa nama rezim totaliter yang menguasai Oseania?',
			options: ['INGSOC', 'Neo-Bolshevisme', 'Penghapusan Diri', 'Aliansi Bumi'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Ilustrator dan penulis Amerika Maurice Sendak paling terkenal karena menulis buku anak-anak yang mana?',
			options: ['Kisah yang Tak Pernah Berakhir', 'Dimana Hal-Hal Liar Berada', 'Charlie dan Pabrik Coklat', 'Kucing Bertopi'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Siapa yang menulis novel "Moby-Dick"?',
			options: ['William Golding', 'William Shakespeare', 'Herman Melville', 'J.R.R. Tolkien'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Posisi apa yang dimainkan Harry Potter di Quidditch?',
			options: ['Pencari', 'Pemukul', 'Pemburu', 'Penjaga'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Manakah dari buku berikut yang TIDAK ditulis oleh penulis Ceko Karel Čapek?',
			options: [
				'Perang dengan Kadal Air',
				'Perjalanan ke Pusat Bumi',
				'R.U.R. (Robot Universal Rossum)',
				'Dashenka, atau Kehidupan Anak Anjing'
			],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Siapa yang menulis novel dewasa muda "The Fault in Our Stars"?',
			options: ['John Hijau', 'Stephenie Meyer', 'Suzanne Collins', 'Stephen Chbosky'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Siapa yang menulis "The Scarlet Letter", yang diterbitkan pada tahun 1850?',
			options: ['Washington Irving', 'James Fenimore Cooper', 'Catherine Maria Sedgwick', 'Nathaniel Hawthorne'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Di dunia Harry Potter, siapa nama tengah Cornelius Fudge?',
			options: ['Yakobus', 'Harold', 'Christopher', 'Oswald'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question:
				"Dalam novel Discworld 'Wyrd Sisters' karya Terry Pratchett, manakah di antara berikut ini yang bukan salah satu dari tiga penyihir utama?",
			options: ['Winny Hathersham', 'Lilin Cuaca Nenek', 'Pengasuh Ogg', 'Magrat Bawang Putih'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Manakah dari berikut ini yang BUKAN merupakan karya Shakespeare?',
			options: ['Ukur Untuk Ukur', 'Titus Andronikus', 'simbline', 'Ujian Kesederhanaan'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Siapa yang menulis serial novel fantasi "A Song of Ice And Fire"?',
			options: ['George Lucas', 'George RR Martin', 'George Orwell', 'George Eliot'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Siapa nama tokoh protagonis dalam novel Catcher in the Rye karya J.D. Salinger?',
			options: ['Fletcher Christian', 'Jay Gatsby', 'Randall Benderag', 'Holden Caulfield'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: "Jack Dawkins dikenal dengan nama panggilan apa dalam novel Charles Dickens, 'Oliver Twist'?",
			options: ['Penghindar yang Berseni', 'palsu', 'tepat sasaran', 'Tuan Fang'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Dalam buku "The Martian", berapa lama Mark Watney terjebak di Mars (di Sols)?',
			options: ['549 Hari', '765 Hari', '401 Hari', '324 Hari'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Siapa yang menulis cerita anak-anak "Gadis Kecil yang Cocok"?',
			options: ['Charles Dickens', 'Lewis Caroll', 'Hans Christian Andersen', 'Oscar Wilde'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Apa nama naga Eragon di "Eragon"?',
			options: ['Glaedr', 'Duri', 'Arya', 'Safira'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Siapa nama asli Sir Handel di "The Railway Series" dan versi animasinya "Thomas and Friends?"',
			options: ['Burung rajawali', 'Kyte', 'Elang', 'Angsa'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Menurut novel Bram Stoker, di kota pesisir Inggris manakah Drakula mendarat?',
			options: ['Scarborough', 'Whitby', 'Brighton', 'Portsmouth'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Siapa penulis novel tahun 1954, "Lord of the Flies"?',
			options: ['William Golding', 'Stephen Raja', 'F.Scott Fitzgerald', 'Pemburu Rubah'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Penulis Rusia mana yang menulis novel epik War and Peace?',
			options: ['Fyodor Dostoyevsky', 'Leo Tolstoy', 'Alexander Pushkin', 'Vladimir Nabokov'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: "Apa buku kedua dalam seri 'A Song of Ice and Fire' karya George R. R. Martin?",
			options: ['Tarian dengan Naga', 'Badai Pedang', 'Pesta untuk Burung Gagak', 'Bentrokan Raja'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Seri buku apa yang diterbitkan oleh Jim Butcher yang mengikuti seorang penyihir di Chicago modern?',
			options: ['Topi Tepat Waktu', 'File Dresden', 'Menara Cinder', 'Hidupku sebagai Penyihir Remaja'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'J.K. Rowling menyelesaikan "Harry Potter and the Deathly Hallows" di hotel mana di Edinburgh, Skotlandia?',
			options: ['Hotel Dunstane', 'Hotel Novotel', 'Sheraton Grand Hotel & Spa', 'Balmoral'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Dalam The Lies Of Locke Lamora, apa arti "Lamora" di Throne Therin?',
			options: ['Pencurian', 'Keadilan', 'Bayangan', 'Kekacauan'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Manakah dari berikut ini yang TIDAK dibaca Charlie dalam The Perks of Being a Wallflower?',
			options: ['Dukuh', 'Anggur Kemarahan', 'Gatsby yang Hebat', 'Peterpan'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Apa entri pertama yang ditulis untuk proyek penulisan kolaboratif SCP Foundation?',
			options: ['SCP-173', 'SCP-001', 'SCP-999', 'SCP-1459'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question:
				'Novel manakah karya John Grisham yang dibuat dalam perjalanan ke Florida sambil memikirkan tentang buku curian bersama istrinya?',
			options: ['Pengacara Nakal', 'Gunung Abu-abu', 'Para Litigator', 'Pulau Camino'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Dengan nama apa penulis Eric Blair lebih dikenal?',
			options: ['Aldous Huxley', 'Ernest Hemingway', 'George Orwell', 'Ray Bradbury'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Mary Shelley adalah penulis cerita horor klasik apa?',
			options: ['Drakula', 'Kasus Aneh Dr Jekyll dan Mr Hyde', 'Frankenstein', 'Legenda Sleepy Hollow'],
			correct: 2
		},
		{
			category: 'BOOKS',
			question: 'Siapa nama tengah Ron Weasley?',
			options: ['Bilius', 'Arthur', 'Yohanes', 'Dominikus'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Siapa nama saudara laki-laki Sherlock Holmes?',
			options: ['Medi Holmes', 'Mycroft Holmes', 'Martin Holmes', 'Herbie Hancock Holmes'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Dalam The Lies of Locke Lamora, apa sebutan Locke di dunia kriminal?',
			options: ['Duri Camorr', 'Mawar dari Sumsum', 'Duri Emberlain', 'Duri Sumsum'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Siapa penulis asli Frankenstein?',
			options: ['Edgar Allan Poe', 'Maria Shelley', 'Bram Stoker', 'H.P.Lovecraft'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Apa merek dan model kendaraan wisata di "Jurassic Park" (1990)?',
			options: ['Jeep Wrangler YJ Sahar 1989', '1989 Ford Explorer XLT', 'Mercedes M-Class', 'Toyota Land Cruiser 1989'],
			correct: 3
		},
		{
			category: 'BOOKS',
			question: 'Novel "Animal Farm" karya George Orwell terinspirasi oleh peristiwa sejarah yang mana?',
			options: [
				'Kebangkitan komunisme dan kebijakan Stalin.',
				'Bangkitnya kendali Kekaisaran Jepang dan Pasifik.',
				'Kebangkitan fasisme dan pengaruh Hitler.',
				'Kesepakatan Baru Franklin D. Roosevelt dan dampaknya terhadap Depresi Hebat.'
			],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Apa nama kota tempat pemakaman Lily dan James Potter?',
			options: ['Lubang Godric', 'Hogsmeade', 'Ottery St', 'Hangleton kecil'],
			correct: 0
		},
		{
			category: 'BOOKS',
			question: 'Manakah dari berikut ini yang bukan merupakan karya Fyodor Dostoevsky?',
			options: ['Catatan dari Bawah Tanah', 'Anna Karenina', 'Kejahatan dan Hukuman', 'Saudara Karamazov'],
			correct: 1
		},
		{
			category: 'BOOKS',
			question: 'Dalam novel "Harry Potter", apa yang harus dilakukan siswa Hogwarts untuk memasuki Ruang Rekreasi Ravenclaw?',
			options: [
				'Jawab sebuah teka-teki',
				'Ketuk tong secara berirama dengan tongkat',
				'Ucapkan kata sandi',
				'Ketuk secara berurutan'
			],
			correct: 0
		},
		{
			category: 'MUSIC',
			question:
				'Anggota Klan Wu-Tang mana yang hanya memiliki satu bait di album debut mereka Enter the Wu-Tang (36 Chambers)?',
			options: ['Metode Manusia', 'Dek Inspeksi', 'GZA', 'Masta Killa'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Standar jazz populer mana yang diawali dengan kalimat "Suatu hari nanti, saat aku sangat sedih"?',
			options: [
				'Dedaunan Musim Gugur',
				'Mimpikanlah Mimpi Kecil tentangku',
				'Semua Hal Tentang Anda',
				'Penampilanmu Malam Ini'
			],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Apa nama panggung penyanyi Selandia Baru Phillipa "Pip" Brown?',
			options: ['Nyonyahawke', 'Tuhan', 'Kesha', 'Anika Moa'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Apa single pertama band rock progresif Rush?',
			options: ['Tom Sawyer', 'Pekerja', 'Pemilik Hati yang Kesepian', 'Tidak Memudar'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Komposer klasik manakah yang menulis "Moonlight Sonata"?',
			options: ['Ketua Keef', 'Wolfgang Amadeus Mozart', 'Ludvig Van Beethoven', 'Johannes Brahms'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Lagu "Old Town Road" oleh rapper Amerika Lil Nas X mengambil sampel lagu "34 Ghosts IV" dari band mana?',
			options: ['Genggaman Kematian', 'Kuku Sembilan Inci', 'Gadis Besi', 'Kolektif Hewan'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Nama grup rock apa yang diambil dari nama guru olahraga yang mengajar di sekolah menengah anggota band aslinya?',
			options: ['Pesawat Jefferson', 'Pink Floyd', 'Keluarga Byrd', 'Lynyrd Skynyrd'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Siapa yang pernah hits di tahun 70an dengan lagu "Lonely Boy" dan "Never Let Her Slip Away"?',
			options: ['Elton John', 'Leo Sayer', 'Andrew Emas', 'Barry Putih'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Apa album terlaris tahun 2015?',
			options: ['Adel, 25', 'Fetty Wap, Fetty Wap', 'Taylor Swift, 1989', 'Justin Bieber, Tujuan'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Siapa band kulit putih pertama yang tampil di Teater Apollo?',
			options: ['Sobat Holly dan Jangkrik', 'Chuck Berry', 'The Beatles', 'Elvis'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Apa judul single hit Inggris pertama ABBA?',
			options: ['Mama Mia', 'Fernando', 'Ratu Penari', 'Waterloo'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Tanggal berapa yang direferensikan dalam lagu "September" tahun 1971 oleh Earth, Wind & Fire?',
			options: ['26 September', '21 September', '23 September', '24 September'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Genre musik manakah yang terutama dikaitkan dengan John Coltrane?',
			options: ['Rock and Roll', 'Jazz', 'Logam Kematian', 'Rakyat'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: '"Make You Feel My Love" awalnya ditulis dan dibawakan oleh penyanyi-penulis lagu yang mana?',
			options: ['Elvis', 'Bob Dylan', 'Adele', 'Billy Joel'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Alat musik tiup manakah yang nadanya paling rendah dalam sebuah orkestra?',
			options: ['Terompet', 'Saksofon', 'Trombon', 'Tuba'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question:
				'Pemain Afrika-Amerika Sammy Davis Jr. dikenal karena kehilangan bagian tubuhnya yang mana dalam kecelakaan mobil?',
			options: ['Telinga Kanan', 'Mata Kiri', 'Jari Tengah Kanan', 'Hidung'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: "Di album manakah lagu 'New Slang' The Shins ditemukan?",
			options: ['Meringis Sepanjang Malam', 'Oh, Dunia Terbalik', 'Peluncuran Terlalu Sempit', 'Pelabuhan Besok'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Artis terkenal manakah yang tampil di lagu Rowdy Rebel tahun 2015 "Computers"?',
			options: ['Bobby Shmurda', 'Lil Wayne', 'Will.I.AM', 'Kendrick Lamar'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Kapan Radiohead merilis album "OK Computer"?',
			options: ['1995', '1997', '2000', '1993'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Long John Baldry, pengisi suara Dr. Robotnik dalam Adventures Of Sonic The Hedgehog, pernah satu band dengan artis musik mana pada tahun 1960-an?',
			options: ['Freddie Merkurius', 'Elton John', 'Paul McCartney', 'Johnny Tunai'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Moby, seorang DJ, penyanyi, dan musisi Amerika, mencapai kesuksesan di seluruh dunia untuk rilisan album berikut pada tahun 1999?',
			options: ['Semuanya Salah', 'Bermain', 'Mobi', '18'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Lagu apa yang memuat kata "Numa Numa" yang menjadi sasaran Video Viral pada tahun 2004?',
			options: ['Dragostea Din Tei', 'Despacito', 'Gaya Gangnam', 'Asereje'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Apa nama album studio debut produser musik elektronik Prancis Madeon tahun 2015?',
			options: ['Kota', 'Petualangan', 'Ikarus', 'Budaya Pop'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Band apa yang menampilkan Sting, Stewart Copeland dan Andy Summers?',
			options: ['Polisi', 'Def Leppard', 'Obatnya', 'Bon Jovi'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: '"Semua Anak Laki-Laki" oleh Panic! At the Disco dirilis sebagai lagu bonus di album apa?',
			options: [
				'Terlalu Aneh Untuk Hidup, Terlalu Jarang Mati!',
				'Demam yang Tidak Bisa Keluar Keringat',
				'Kematian Seorang Sarjana',
				'Keburukan & Kebajikan'
			],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Apa album solo debut Raekwon the Chefs?',
			options: ['Shaolin vs Wu-Tang', 'Yang Liar', 'Hanya Membangun 4 Linx Kuba', 'Kisah Lex Diamond'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question:
				'Band baru mana yang paling terkenal karena lagu hit tangga lagu Inggris mereka "Combine Harvester" dan "I Am a Cider Drinker" pada tahun 1976?',
			options: ['Rantai Pencarian Goldie', 'Band Doo-Dah Anjing Bonzo', 'Keluarga Wurzel', 'Perusahaan'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Chino Moreno adalah penyanyi utama dari band metal alternatif yang mana?',
			options: ['Alat', 'Defton', 'Korn', 'Tipe O Negatif'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Siapa penyanyi utama Arctic Monkeys?',
			options: ['Jamie Masak', 'Alex Turner', 'Matt Pemegang', "Nick O'Malley"],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari berikut ini yang bukan merupakan album studio dari band Pink Floyd?',
			options: ['Gambar Bergerak', 'Sisi Gelap Bulan', 'Seandainya Anda Ada di Sini', 'Hewan'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Huruf pada nama band "TWRP" singkatan dari apa?',
			options: [
				'Pelaku Robot yang Benar-benar Jahat',
				'Tim Wild dan Bajak Laut Radio',
				'Permainan Peran Taiwan',
				'Pesta Remix Tupperware'
			],
			correct: 3
		},
		{
			category: 'MUSIC',
			question:
				'Dalam Kepanikan! Lagu At the Disco "Nothern Downpour", yang liriknya mengikuti \'Aku tahu dunia ini patah tulang\'.',
			options: [
				'"Jadi nyanyikan lagumu sampai kamu sampai di rumah"',
				'"Jadi, beri tahu mereka bahwa mereka sendirian"',
				'"Jadi, lelehkan sakit kepalamu, anggap saja itu rumah"',
				'"Jadi nyalakan api di batu dingin mereka"'
			],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Lagu manakah di "Random Access Memories" Daft Punk yang menampilkan Pharrell Williams?',
			options: ['Dapatkan Keberuntungan', 'Lakukan dengan Benar', 'Penghancuran Instan', 'Permainan Cinta'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Siapa penyanyi utama The Lumineers?',
			options: ['Wesley Schultz', 'Yeremia Fraites', 'Jay Van Dyke', 'Neyla Pekarek'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "Musisi reggae Kanada manakah yang menjadi hit tahun 1993 dengan lagu 'Informer'?",
			options: ['Hujan', 'Salju', 'Memanggil', 'hujan es'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Siapa nama penyanyi perang dingin yang memiliki lagu di Grand Theft Auto IV, dan menjadi penanda tembok di Moskow sebagai peringatannya?',
			options: ['Jimi Hendrix', 'Victor Tsoi', 'Brian Jones', 'Vladimir Vysotsky'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari lagu berikut yang tidak ada dalam album "tanpa judul" milik Led Zeppelin?',
			options: ['Hari Perayaan', 'Tangga Menuju Surga', 'Anjing Hitam', 'Rock and Roll'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari lagu berikut yang dibawakan Elton John setelah meninggalnya Putri Diane?',
			options: ['Lilin di Angin', 'Saya rasa itu sebabnya mereka menyebutnya The Blues', 'Lagu Anda', 'Gadis Pulau'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Penyanyi manakah yang tampil dalam lagu "Wake Me Up" milik produser Swedia Avicii?',
			options: ['John Legenda', 'CeeLo Hijau', 'lidah buaya', 'Pharrell Williams'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Gitaris Inggris manakah yang memiliki julukan "Slowhand"?',
			options: ['Tandai Knopfler', 'Jeff Beck', 'Eric Clapton', 'Halaman Jimmy'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Siapa penyanyi utama Green Day?',
			options: ['Billie Joe Armstrong', 'Mike Dirnt', 'Sean Hughes', 'Sangat Keren'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Hewan apa yang ditampilkan di sampul album grup musik elektronik Inggris The Prodigy, "The Fat of the Land"?',
			options: ['Rubah', 'Gajah', 'Harimau', 'Kepiting'],
			correct: 3
		},
		{
			category: 'MUSIC',
			question: 'Siapa artis musikal yang merilis lagu hits "Love Song" pada tahun 2007?',
			options: ['Taylor Swift', 'Sara Bareilles', 'Katy Perry', 'Sarah Silverman'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question:
				'Lagu musisi elektronik Swedia Avicii manakah yang mengambil sampel lagu "Something\'s Got A Hold On Me" oleh Etta James?',
			options: ['Memudar Menjadi Kegelapan', 'Tingkat', 'Siluet', 'Carilah Bromance'],
			correct: 1
		},
		{
			category: 'MUSIC',
			question: "Siapa pendiri dan pemimpin band rock industrial, 'Nine Inch Nails'?",
			options: ['Trent Reznor', 'Marilyn Manson', 'Robin Finck', 'Josh Homme'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: "Untuk aktivis hak-hak sipil manakah Stevie Wonder menulis lagu 'Selamat Ulang Tahun' pada tahun 1980?",
			options: ['Martin Luther King Jr', 'Taman Rosa', 'Nelson Mandella', 'Booker T.Washington'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari lagu Rammstein berikut yang memiliki dua video musik resmi?',
			options: ['Du Riechst Sangat Nyali', 'Du Hast', 'benzin', 'Mein Teil'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Siapa artis yang paling banyak streaming di Spotify pada tahun 2019?',
			options: ['Billie Eilish', 'Ariana Grande', 'Posting Malone', 'Itik jantan'],
			correct: 2
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari artis berikut yang TIDAK me-remix lagu "Faded" oleh Alan Walker?',
			options: ['Skrillex', 'Tiësto', 'lumpur', 'Dasbor Berlin'],
			correct: 0
		},
		{
			category: 'MUSIC',
			question: 'Manakah dari rapper berikut yang BUKAN anggota grup rap Wu-Tang Clan?',
			options: ['Dr.Dre', 'Bajingan Kotor', 'GZA', 'Metode Manusia'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question:
				'Dalam episode SpongeBob SquarePants, "Survival of the Idiots", Spongebob memanggil Patrick dengan nama panggilan yang mana?',
			options: ['Bintang laut', 'Larry', 'Dan kotor', 'Kepala peniti'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Siapa pemenang "Big Brother" Musim 10?',
			options: ['Bryce Kranyik', 'Dan Gheesling', 'Ryan Sutfin', 'Chris Mundorf'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Kapan Spongebob Squarepants pertama kali tayang?',
			options: ['20 Juli 2000', '6 Februari 2003', '27 Juni 1997', '1 Mei 1999'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: "Untuk apa Bart menjual jiwanya dalam episode The Simpsons 'Bart Sells His Soul'?",
			options: ['Salinan Bonestorm 2', '$100', 'Seorang Gobstopper Raksasa', '$5'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Di acara NBC Komunitas siapa nama asli Star Burns?',
			options: ['Todd', 'Neal', 'Alex', 'Grimus'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Dalam Battlestar Galactica (2004), siapa nama Presiden Dua Belas Koloni?',
			options: ['William Adama', 'Tricia Helfer', 'Harry Masih', 'Laura Roslin'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Di acara "Futurama" siapa nama lengkap Fry?',
			options: ['Goreng J. Philip', 'Goreng Rodríguez', 'Goreng Philip', 'Philip J.Fry'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Apa nama belakang karakter Daryl di acara AMC The Walking Dead?',
			options: ['Dixon', 'kotoran', 'Dickinson', 'Dicketson'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Di acara "Rick and Morty", di episode "Total Rickall", siapa yang menjadi parasit?',
			options: ['Beth Smith', 'Smith Musim Panas', 'Tuan Poopy Lubang Pantat', 'Pensilvester'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Dalam acara televisi Sci-Fi Doctor Who, siapa yang berperan sebagai Dokter Kesepuluh?',
			options: ['William Hartnell', 'Peter Capaldi', 'David Tennant', 'Peter Davison'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Aktor Inggris David Morrissey berperan dalam "The Walking Dead"?',
			options: ['Gubernur', 'Negan', 'Rick Grimes', 'Daryl Dixon'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Siapa pemenang Big Brother AS pertama yang menang dengan permainan sempurna?',
			options: ['Ian Terry', 'Jordan Lloyd', 'Rachel Reilly', 'Dan Gheesling'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Di alam semesta Doctor Who, berapa kali penguasa waktu bisa beregenerasi secara normal?',
			options: ['11', '13', '15', '12'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Karakter manakah yang TIDAK disuarakan oleh pengisi suara Tara Strong?',
			options: ['Kilau Senja', 'Gelembung (2016)', 'Timmy Turner', 'Harley Quinn'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Manakah dari berikut ini yang tidak sopan dan tidak terhormat menurut standar Klingon?',
			options: [
				'Menghina dan menertawakannya di meja makan',
				'Mencapai dan mengambil makanannya',
				"Mengambil D'k tahgnya",
				'Meninju dia dan mengambil posisi stasiun kapalnya'
			],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Dalam "Star Trek", siapa pendiri Kerajaan Klingon dan filosofinya?',
			options: [
				'Nyonya Lukara dari Aula Besar',
				'Molor yang Tak kenal ampun',
				'Dahar Master Kor',
				'Kahless yang Tak Terlupakan'
			],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Pada musim pertama drama politik Netflix "House of Cards", apa posisi Frank Underwood dalam pemerintahan?',
			options: ['Jaksa Agung', 'Cambuk Mayoritas DPR', 'Presiden', 'Kepala Staf'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Sitkom NBC mana yang pernah melihat dua karakternya mencoba menampilkan NBC pada sitkom tentang apa pun?',
			options: ['Seinfeld', 'Lebih rapuh', 'Becker', 'Teman-teman'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Dalam "Rick And Morty", siapa yang merekam "Mr. Poopybutthole" di episode "Total Rickall"?',
			options: ['rik', 'jeri', 'Morty', 'beth'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Siapa nama tokoh utama serial TV "The Flash"?',
			options: ['Ratu Oliver', 'Bart Allen', 'Bruce Wayne', 'Barry Allen'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Siapakah bintang serial AMC Breaking Bad?',
			options: ['Walter Putih', 'Saul Goodman', 'Jesse Pinkman', 'Skyler Putih'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Tema serial fiksi ilmiah populer "Doctor Who" disusun oleh siapa?',
			options: ['Murray Emas', 'Delia Derbyshire', 'Peter Howell', 'Ron Grainer'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Apa nama bebek tiup yang dikorbankan kepada penonton di akhir Episode 34 musim ke-18 Big Brother?',
			options: ['Pablo', 'Esteban', 'Carlos', 'bebek'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: "Siapa yang memerankan karakter Dennis Reynolds di It's Always Sunny in Philadelphia?",
			options: ['Rob McElhenney', 'Glenn Howerton', 'Hari Charlie', 'Danny DeVito'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Siapa nama saudara laki-laki Chris di "Everybody Hates Chris"?',
			options: ['Jerome', 'Menarik', 'Greg', 'Joe'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Berapa musim acara televisi Sci-Fi "Stargate Universe"?',
			options: ['2', '10', '5', '3'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Aktor The Young Ones manakah yang juga memerankan Lord Flashheart di salah satu episode Blackadder II?',
			options: ['Rik Mayall', 'Adrian Edmondson', 'Nigel Planer', 'Christopher Ryan'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Dari 3 Tots di Tots TV, siapa yang bisa berbahasa Prancis di Versi Inggris dan Spanyol di Versi AS?',
			options: ['Tilly', 'Tom', 'Kecil', 'Tak satu pun dari yang di atas'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Dalam "Star Trek", apa ritual kematian Klingon?',
			options: [
				'Cium kening yang bergerigi sebelum dimakamkan.',
				'Lihatlah ke langit dan berteriak keras-keras saat berduka.',
				'Tembak ke luar angkasa dengan selubung torpedo.',
				'Bagi penghasilan almarhum di antara kulit darah.'
			],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question:
				'Di universitas mana karakter "Teori Big Bang" Mr. Wolowitz dan Drs. Cooper, Hofstadter dan Koothrappali bekerja?',
			options: ['Universitas California', 'MIT', 'UC Berkeley', 'Caltech'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Pada tahun berapa "The Big Bang Theory" debut di CBS?',
			options: ['2008', '2006', '2009', '2007'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Di Star Trek: The Next Generation, apa nama kucing Data?',
			options: ['sarung tangan', 'Titik', 'Tom', 'kucing'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Aktor manakah yang memerankan "Walter White" dalam serial "Breaking Bad"?',
			options: ['Andrew Lincoln', 'Bryan Cranston', 'Harun Paulus', 'RJ Mitte'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Kartun CGI berdurasi setengah jam pertama, ReBoot, ditayangkan pada tahun berapa?',
			options: ['1993', '1998', '1994', '1999'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Apa callsign Komandan William Adama di Battlestar Galactica (2004)?',
			options: ['pemburu', 'Starbucks', 'Apollo', 'kehancuran'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Siapa nama polisi di kartun "Top Cat"?',
			options: ['Barbrady', 'Mahoni', 'Murphy', 'Alat penggali lobang'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Siapa nama asli komedian terkenal asal spanyol, El Risitas?',
			options: ['Gabriel Garcia Marquez', 'Yesus Quintero', 'Juan Joya Borga', 'Ernesto Guevara'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Manakah dari serial Star Trek berikut yang BUKAN makanan Klingon?',
			options: ['Makanan pembuka', 'Racht', 'Gagh', 'anggur berdarah'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Dalam Naruto: Shippuden, manakah dari elemen berikut yang merupakan "Kekkei Tōta?"',
			options: ['Gaya Partikel', 'Doujutsu apa pun', 'Gaya Bayangan', 'Gaya Es'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Siapa yang berperan sebagai Pelayan dalam sketsa Spam "Sirkus Terbang Monty Python"?',
			options: ['Eric menganggur', 'Graham Chapman', 'Terry Jones', 'John Cleese'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question:
				'Di musim pertama Mimpi Buruk Dapur AS, Gordan Ramsay mencoba menyelamatkan 10 restoran berbeda. Berapa banyak yang akhirnya tutup setelahnya?',
			options: ['9', '6', '3', '0'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: 'Seri video "Psycho" di YouTube dibuat oleh orang berikut ini?',
			options: ['Dan Bell', 'STUDiOS RiDGiD', 'Billy Keluarga', 'Keuntungan Vegan'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Siapa bintang serial TV "24"?',
			options: ['Kiefer Sutherland', 'Kevin Bacon', 'Hugh Laurie', 'Rob Lowe'],
			correct: 0
		},
		{
			category: 'TELEVISION',
			question: "Dalam acara 'Doctor Who', apa nama model kapsul waktu yang dicuri oleh 'the Doctor'?",
			options: [
				'TT Tipe 1, Mark 3 (TARDIS)',
				'TT Tipe 40, Mark 5 (TARDIS)',
				'TT Tipe 40, Mark 3 (TARDIS)',
				'TT Tipe 1, Mark 5 (TARDIS)'
			],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Di acara Stranger Things, makanan sarapan favorit Eleven apa?',
			options: ['Roti panggang', 'Kapten Crunch', 'Bacon dan Telur', 'Wafel Eggo'],
			correct: 3
		},
		{
			category: 'TELEVISION',
			question: 'Di Supernatural, siapa nama saudara laki-laki Sam?',
			options: ['Dave', 'Dekan', 'Steve', 'Mike'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Bagaimana setting acara "Taman dan Rekreasi"?',
			options: ['Eagleton, Indiana', 'Pasadena, Kalifornia', 'Pawnee, Indiana', 'London, Inggris'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: 'Aktor manakah yang bukan tokoh utama dalam Acara TV Freaks and Geeks?',
			options: ['Jason Segel', 'Bukit Yunus', 'Seth Rogen', 'James Franco'],
			correct: 1
		},
		{
			category: 'TELEVISION',
			question: 'Kapan acara TV Rick dan Morty pertama kali ditayangkan di Adult Swim?',
			options: ['2014', '2016', '2013', '2015'],
			correct: 2
		},
		{
			category: 'TELEVISION',
			question: "Apa judul instrumental The Allman Brothers Band yang dijadikan tema acara otomotif BBC, 'Top Gear'?",
			options: ['Angela', 'Erica', 'Sandra', 'jessica'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Sebelum Super Smash Bros. berisi karakter Nintendo, apa yang dikenal secara internal?',
			options: ['Kontes Juara', 'Hancurkan dan pukul', 'Raja Naga: Game Pertarungan', 'Pejuang Abad Ini: Penaklukan'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di seri Fallout, pada tanggal berapa The Great War terjadi?',
			options: ['15 Mei 2058', '23 Oktober 2077', '14 Desember 2069', '5 November 2076'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Rincewind dari game Discworld tahun 1995 disuarakan oleh anggota Monty Python yang mana?',
			options: ['John Cleese', 'Terry Gilliam', 'Michael Palin', 'Eric menganggur'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam game "The Sims", berapa banyak Simoleon yang dimiliki setiap keluarga?',
			options: ['10.000', '20.000', '15.000', '25.000'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Manakah dari berikut ini yang bukan merupakan karakter dalam video game Klub Sastra Doki Doki?',
			options: ['Monika', 'Natsuki', 'Sayori', 'Niko'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Manakah dari berikut ini yang bukan merupakan karakter yang dapat dimainkan dalam "Enter The Gungeon?"',
			options: ['Peluru', 'Robotnya', 'Yang Berat', 'Kultus'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Apa senjata utama pertama yang didapat pemain di "PAYDAY: The Heist"?',
			options: ['Brenner 21', 'Reinbeck', 'M308', 'AMCAR-4'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Berapa banyak blok obsidian yang diperlukan untuk membangun portal bawah di Minecraft?',
			options: ['14', '13', '10', '16'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'Manakah diantara faksi berikut ini yang BUKAN merupakan faksi yang termasuk dalam game Counter-Strike: Global Offensive?',
			options: ['GSG-9', 'Kru Elit', 'Koneksi Phoenix', 'BOPE'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Video game apa yang memicu kontroversi karena minigame "Kopi Panas" yang tersembunyi?',
			options: ['Grand Theft Auto: Wakil Kota', 'Hitman: Uang Darah', 'Pencurian Besar Otomatis: San Andreas', 'Memasak Ibu'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: "Di seri Assassin's Creed, apa nama Desmond Miles yang diberikan Abstergo?",
			options: ['Subyek 16', 'Subyek 17', 'Subyek 18', "Altair Ibn-La'Ahad"],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Kapan Star Wars: Battlefront II asli dirilis?',
			options: ['18 Desember 2004', '31 Oktober 2005', '21 November 2006', '9 September 2007'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Apa nama virus yang menginfeksi New York di The Division karya Tom Clancy?',
			options: ['Ebola', 'Racun Merah', 'Flu Dolar', 'Cacar'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam judul game "Luigi\'s Mansion", huruf apa yang tidak muncul dengan sepasang mata di dalamnya?',
			options: ['N', 'Saya', 'S', 'M'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				"Pada game Nintendo DS 'Ghost Trick: Phantom Detective', siapa nama pembunuh bayaran yang terlihat di awal permainan?",
			options: ['Jeego rabun jauh', 'Satu Langkah ke Depan Tengo', 'Misil', 'Cabanela'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam permainan "Pikmin", manakah warna pikmin berikut yang tidak memiliki sarang "Bawang"?',
			options: ['Bersayap', 'Biru', 'Batu', 'Ungu'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Creeper di Minecraft adalah akibat dari bug saat mengimplementasikan makhluk yang mana?',
			options: ['Zombi', 'Ayam', 'Sapi', 'Babi'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Protagonis dari game hit, Half-Life 2 disebut:',
			options: ['Alyx Vance', 'Gordon Freeman', 'Isaac Kleiner', 'Wallace Breen'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di awal permainan "Sonic Adventure", warna Chaos Emerald apa yang dimiliki Tails?',
			options: ['Merah', 'Hijau', 'Ungu', 'Biru'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Alien Race dalam game "Lego Racers 2" dikenal sebagai apa?',
			options: ['Rama', 'Pemotong', 'Roborider', 'Turaga'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di World of Warcraft warna UI default yang menandakan Druid itu apa?',
			options: ['Oranye', 'Cokelat', 'Hijau', 'Biru'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di World of Warcraft, Berapa batas level aslinya?',
			options: ['70', '60', '50', '100'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: "Perusahaan Pengembangan Game mana yang membuat No Man's Sky?",
			options: ['Permainan Pas', 'Halo Game', 'Katup', 'Hiburan Badai Salju'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di Overwatch, spesies kera manakah yang menjadi pahlawan Winston?',
			options: ['Orangutan', 'Gorila', 'Simpanse', 'Siamang'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: "Manakah di antara berikut ini yang BUKAN merupakan nama geng saingan dalam video game Saint's Row 2?",
			options: ['Persaudaraan', 'Roninnya', 'Putra Samedi', 'Kekaisaran Zin'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam serial "Portal", siapa asisten pribadi Cave Johnson?',
			options: ['Primadona', 'Karolina', 'Melissa', 'Jane'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Siapa nama tokoh utama dalam "Braid"?',
			options: ['orang bodoh', 'Yakobus', 'Tim', 'Jackson'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Manakah dari game berikut yang memiliki ukuran peta terbesar?',
			options: [
				'Pencurian Besar Otomatis 5',
				'The Elder Scrolls 4: Terlupakan',
				'Hanya Penyebab 2',
				'The Witcher 3: Perburuan Liar'
			],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'Karakter manakah dalam game "Morenatsu" yang memiliki kemungkinan akhir paling banyak pada rutenya, dengan total empat akhir berbeda?',
			options: ['Shin Kuroi', 'Kouya Aotsuki', 'Soutarou Touno', 'Torahiko Ooshima'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di Splatoon 2, siapa saja anggota Off The Hook?',
			options: ['Mutiara & Marina', 'Callie & Marie', 'Berlian & Aquamarina', 'DJ Octavio & Berkerak Sean'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam game "Subnautica", fitur manakah yang dihapus karena masalah performa pada tahun 2016?',
			options: ['Bangunan', 'kerajinan', 'Multipemain', 'terraformasi'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Kapan Valve Corporation didirikan?',
			options: ['26 Desember 1994', '24 Agustus 1996', '22 Maret 1997', '13 Maret 1997'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Siapa yang menciptakan platform distribusi digital Steam?',
			options: ['Game Ekor Piksel', 'Ubisoft', 'Seni Elektronik', 'Katup'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Berapa HP maksimal di Terraria?',
			options: ['500', '400', '1000', '100'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam franchise "Halo", di negara manakah New Mombasa berada?',
			options: ['Kenya', 'India', 'Turki', 'Slowakia'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Apa nama Kota di Saints Row The Third?',
			options: ['pelabuhan baja', 'air tenang', 'Pemburu', 'Kebebasan'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Siapa yang menyuarakan GLaDOS di game Portal?',
			options: ['Ellen McLain', 'Michelle Forbes', 'Mary Kae Irvin', 'Natasha Radski'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di Yakuza 0, bagaimana urutan gaya bertarung yang diperoleh Kazuma Kiryu?',
			options: [
				'Petarung, Terburu-buru, Binatang Buas, Legenda',
				'Legenda, Terburu-buru, Petarung, Binatang Buas',
				'Petarung, Binatang Buas, Terburu-buru, Legenda',
				'Binatang buas, Petarung, Terburu-buru, Legenda'
			],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question: 'Menurut cerita "Starbound", apa yang dilakukan "Akta Koloni" ketika dibuat?',
			options: [
				'Teleportasi seseorang dari suatu tempat di planet tempat ia ditempatkan.',
				'Teleportasi orang secara acak ke lokasi.',
				'Mewujudkan makhluk baru di lokasinya.',
				'Mengirimkan iklan agar seseorang pindah.'
			],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di Minecraft, pembaruan apa yang membuat makanan seperti steak bisa ditumpuk?',
			options: ['Alfa 1.2.0', 'Rilis 1.12.1', 'Rilis 1.7.2', 'Beta 1.8'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Apa nama proyek dibatalkan Blizzard Entertainment yang nantinya menjadi Overwatch?',
			options: ['Mahakuasa', 'Akhir', 'Titan', 'Hantu'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Penerbit video game yang dikenal sebagai "tinyBuild" menerbitkan game manakah berikut ini?',
			options: ['Jangan kelaparan', 'Lembah Stardew', 'truk cluster', 'Peternak Lendir'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Dalam Need for Speed: Underground, mobil apa yang dikendarai Eddie?',
			options: ['Mazda RX-7 FD3S', 'Acura Integra Tipe R', 'Subaru Impreza 2.5RS', 'Nissan Skyline GT-R (R34)'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Siapa pemimpin Team Instinct di Pokémon Go?',
			options: ['Candela', 'pucat', 'Percikan', 'Pohon willow'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question:
				'GoldenEye 007 di Nintendo 64 direncanakan untuk memungkinkan Anda bermain seperti semua aktor Bond sebelumnya, kecuali siapa?',
			options: ['George Lazenby', 'Roger Moore', 'Sean Connery', 'Timotius Dalton'],
			correct: 0
		},
		{
			category: 'VIDEOGAMES',
			question:
				'Dalam pengetahuan Diablo, kejahatan yang lebih rendah ini muncul dari salah satu dari tujuh kepala Tathamet, dan dikenal sebagai Gadis Penderitaan.',
			options: ['Valla', 'Andariel', 'Maltael', 'Kashya'],
			correct: 1
		},
		{
			category: 'VIDEOGAMES',
			question: 'Siapakah tokoh utama dalam "The Stanley Parable"?',
			options: ['Garis Petualangan', 'Narator', 'Stanley', 'Bos'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Manakah dari berikut ini yang BUKAN karakter yang dapat dimainkan di video game Overwatch tahun 2016?',
			options: ['Belas kasihan', 'Winston', 'pemanggil', 'Zenyatta'],
			correct: 2
		},
		{
			category: 'VIDEOGAMES',
			question: 'Manakah dari game berikut yang tidak dirilis pada tahun 2016?',
			options: ['Divisi Tom Clancy', 'Pembunuhan Lantai 2', 'pembunuh bayaran', 'Perlengkapan Logam Padat V'],
			correct: 3
		},
		{
			category: 'VIDEOGAMES',
			question: 'Di Undertale, MEGALOVANIA jadi tema karakter yang mana?',
			options: ['mengalir', 'Papirus', 'Tanpa', 'Undyne'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question:
				'Pada awal permainan standar Monopoli, jika Anda melempar angka ganda enam, di kotak manakah Anda akan mendarat?',
			options: ['Perusahaan Listrik', 'Pekerjaan Air', 'Peluang', 'Peti Komunitas'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Carcassonne berbasis di kota Perancis yang mana?',
			options: ['Paris', 'Marseille', 'Bangkai', 'Clermont-Ferrand'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Europa Universalis adalah video game strategi yang didasarkan pada permainan papan Prancis yang mana?',
			options: ['Eropa dan Alam Semesta', 'Eropa!', 'Europa Universalis', 'Kekuasaan di Eropa'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam Magic: The Gathering, teks rasa kartu apa yang bertuliskan "Tangkap!"?',
			options: ['Kapak Lava', 'Setan Pelempar Batu', 'Tembakan Bara', 'Pisau Lempar'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa banyak ruang yang ada pada papan Monopoli standar?',
			options: ['28', '55', '36', '40'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa jumlah dadu yang digunakan dalam permainan Yahtzee?',
			options: ['Empat', 'Enam', 'Delapan', 'Lima'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa poin nilai ubin Z di Scrabble?',
			options: ['10', '8', '5', '6'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Permainan papan Monopoli mengambil nama jalannya dari kota Amerika yang mana?',
			options: ['Las Vegas, Nevada', 'Duluth, Minnesota', 'Charleston, Carolina Selatan', 'Kota Atlantik, New Jersey'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question:
				'Manakah dari kartu berikut dari "Magic: The Gathering" yang memiliki teks rasa yang dimulai dengan "Oi oi oi"?',
			options: ['Troll Uthden', 'Troll Lotlet', 'Troll Albino', 'Troll Pemanen'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Manakah dari karakter berikut yang tidak ada dalam permainan papan Clue?',
			options: ['Kolonel Mustard', 'Pendeta Hijau', 'Tuan Indigo', 'Nona Scarlet'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa banyak buah catur yang ada di papan pada awal permainan catur?',
			options: ['16', '20', '36', '32'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Kartu manakah yang ada di sampul buku peraturan Beta "Magic: The Gathering"?',
			options: ['Pulau', 'hantu rawa', 'Batu Hidra', 'Pemanah Peri'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Di Yu-Gi-Oh, bagaimana cara pemain melakukan Pemanggilan Xyz?',
			options: [
				'Hamparkan setidaknya 2 Monster dengan Level yang Sama',
				'Aktifkan Mantra dan Kirim Monster ke Makam',
				'Tambahkan Level Monster Bersama untuk Mencocokkan Monster Xyz',
				'Usir Sejumlah Monster Dari Tangan dan Dek Anda'
			],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Permainan papan "Monopoli" merupakan variasi dari permainan papan apa?',
			options: ['Sengketa Wilayah', 'Perseteruan Properti', 'Permainan Monopolis', 'Permainan Tuan Tanah'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam Monopoli standar, berapa harga sewanya jika Anda mendarat di Park Place tanpa rumah?',
			options: ['$35', '$30', '$50', '$45'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Saat Magic: The Gathering pertama kali diminta, manakah judul aslinya dari berikut ini?',
			options: ['Bentrokan Mana', 'Sihir', 'Bentrokan Ajaib', 'Duel Mana'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'Dalam permainan papan, peraturan tambahan atau perubahan yang berlaku untuk kelompok atau tempat tertentu secara informal dikenal sebagai aturan "apa"?',
			options: ['Kebiasaan', 'Tambahan', 'Mengubah', 'Rumah'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Monster apa yang paling menantang di Dungeons & Dragons 5th Edition Monster Manual?',
			options: ['Penonton', 'Binatang Pengalih', 'Lich', 'tarrasque'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Apa permainan papan tertua di dunia?',
			options: ['Senet', 'Catur', 'Dam', 'Pergi'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Permainan papan manakah yang pertama kali dirilis pada tanggal 6 Februari 1935?',
			options: ['Mempertaruhkan', 'Petunjuk', 'Negeri Permen', 'Monopoli'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Kapan permainan papan Twister dirilis ke publik?',
			options: ['September 1965', 'April 1966', 'Januari 1969', 'Februari 1966'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Pokemon manakah yang berada di #39 di Pokedex Nasional?',
			options: ['Jigglypuff', 'Pikachu', 'bebek gila', 'ketakutan'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'Apa nama kode pengembangan untuk ekspansi "Weatherlight" untuk "Magic: The Gathering", yang dirilis pada tahun 1997?',
			options: ['Kopi bebas kafein', 'Moka Latte', 'Frappuccino', 'Macchiato'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Manakah di antara berikut ini yang bukan merupakan game sungguhan dalam seri Dungeons & Dragons?',
			options: [
				'Ruang Bawah Tanah & Naga Ekstrim',
				'Ruang Bawah Tanah & Naga Tingkat Lanjut',
				'Dungeons & Dragons edisi 3.5',
				'Dungeons & Dragons Tingkat Lanjut edisi ke-2'
			],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa banyak ruangan yang ada, tidak termasuk lorong dan tangga, dalam permainan papan "Petunjuk"?',
			options: ['1', '6', '9', '10'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Manakah dari kota berikut yang TIDAK ditampilkan dalam permainan papan Pandemi?',
			options: ['Kota Ho Chi Minh', 'Lagos', 'Berlin', 'Karachi'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam permainan Monopoli standar, warna apa yang merupakan dua properti termurah?',
			options: ['Hijau', 'Kuning', 'Biru', 'Cokelat'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Pada tahun berapa RPG pena dan kertas "Deadlands" dirilis?',
			options: ['1996', '2003', '1999', '1993'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'Dalam "Magic: The Gathering", selama desain Planar Chaos, warna apa yang menurut pengembang akan ditambahkan sebagai warna keenam?',
			options: ['Ungu', 'Cokelat', 'Berwarna merah muda', 'Oranye'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam "Magic: The Gathering", kartu instan apa yang memiliki biaya mana yang dikonversi tertinggi?',
			options: ['Vitalisasi Angin', 'Infus Blinkmoth', 'Nyanyian Vitu-Ghazi', 'Tegaskan Otoritas'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Apa yang Anda nyatakan di Rīchi Mahjong setelah Anda menggambar ubin kemenangan Anda?',
			options: ['Ron', 'Tsumo', 'Richi', 'Kan'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Huruf apa yang digunakan untuk menyebut mana biru dalam permainan kartu Magic The Gathering?',
			options: ['B', 'kamu', 'L', 'E'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Siapakah juara catur dunia resmi pertama?',
			options: ['José Raúl Capablanca', 'Emanuel Lasker', 'Wilhelm Steinitz', 'Bobby Fisher'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Pada tahun berapa permainan kartu Magic: the Gathering pertama kali diperkenalkan?',
			options: ['1993', '1987', '1998', '2003'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa banyak titik pada satu dadu?',
			options: ['21', '24', '15', '18'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'Dalam Magic: The Gathering, apa kartu penghormatan untuk mendiang istri Jamie Wakefield, Marilyn, yang menyukai kuda?',
			options: ['Pegasus yang setia', 'Vryn Wingmare', 'Sungrace Pegasus', 'masalah kayu'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Permainan papan Nightmare dirilis pada tahun berapa?',
			options: ['1992', '1989', '1995', '1991'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa jumlah semua ubin dalam kotak standar Scrabble?',
			options: ['207', '197', '187', '177'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Item spesial apa yang dikirimkan oleh pembuat Cards Against Humanity untuk paket Black Friday mereka?',
			options: ['Ekspansi Kartu', 'Kotoran Banteng', 'Mainan Rasis', 'Urin Kucing'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam Catur, Ratu mempunyai gerakan gabungan dua buah catur yang mana?',
			options: ['Benteng dan Raja', 'Uskup dan Benteng', 'Ksatria dan Uskup', 'Raja dan Ksatria'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: "Pada papan Monopoli standar, kotak manakah yang berhadapan secara diagonal dengan 'Go'?",
			options: ['Pergi ke Penjara', 'Penjara', 'Parkir gratis', 'Perusahaan Listrik'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Manakah dari permainan papan berikut yang TIDAK menggunakan dadu standar bersisi 6?',
			options: ['Monopoli', 'Mempertaruhkan', 'Permainan Kehidupan', 'Ular tangga'],
			correct: 2
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam poker, “EV” artinya apa?',
			options: ['Nilai Ekuitas', 'Nilai yang Diharapkan', 'Variasi Setara', 'Variasi Ekuitas'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: "Keajaiban Apa: Teks rasa kartu Gathering hanya 'Ribbit'?",
			options: ['Beralih ke Katak', 'Spora Katak', 'Kodok Kembung', 'katak'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question:
				'Di Dungeons and Dragons (edisi ke-5), stat apa yang biasanya Anda tambahkan ke dalam lemparan dadu inisiatif Anda?',
			options: ['Ketangkasan', 'Kecepatan', 'Kekuatan', 'Kebijaksanaan'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Dalam Board Game, Settlers of Catan, angka berapa yang menyebabkan Perampok menyerang?',
			options: ['3', '7', '10', '1'],
			correct: 1
		},
		{
			category: 'BOARDGAMES',
			question: 'Di papan Monopoli standar, berapa yang harus Anda bayar untuk Tennessee Ave?',
			options: ['$180', '$200', '$160', '$220'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Jaringan podcast dan video permainan papan Dice Tower dijalankan oleh individu yang mana?',
			options: ['Tom Vasel', 'Jason LeVine', 'Kelahiran Sampson', 'Paman Pennybags'],
			correct: 0
		},
		{
			category: 'BOARDGAMES',
			question: 'Manakah dari permainan berikut yang menyertakan frasa "Jangan lewati Go, jangan kumpulkan $200"?',
			options: ['Hari Pembayaran', 'Petunjuk', 'Koppit', 'Monopoli'],
			correct: 3
		},
		{
			category: 'BOARDGAMES',
			question: 'Berapa level maksimum yang dapat Anda miliki dalam satu kelas di Dungeons and Dragons (5e)?',
			options: ['20', '30', '15', '25'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Apa nama poligon bersisi sembilan?',
			options: ['Segi enam', 'Segi delapan', 'Nonagon', 'Segi tujuh'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Manakah dari distribusi probabilitas berikut yang TIDAK diskrit?',
			options: ['Binomium', 'Normal', 'racun', 'Hiper-geometris'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Matematikawan mana yang menolak Fields Medal?',
			options: ['Andrew Wiles', 'Grigori Perelman', 'Terence Tao', 'Edward Witten'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapakah bentuk grafik sin(x) atau cos(x)?',
			options: ['Sebuah Parabola', 'Ombak', 'Garis Lurus', 'Zig-Zag'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Apa satu-satunya Masalah Hadiah Milenium yang telah terpecahkan sejauh ini?',
			options: ['Masalah P vs NP', 'Hipotesis Riemann', 'Dugaan Poincare', 'dugaan Fermat'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa akar kuadrat dari 49?',
			options: ['4', '7', '12', '9'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Apa yang terjadi setelah Satu Juta, Satu Miliar, dan Satu Triliun?',
			options: ['Sextillion', 'Triliun', 'Septillion', 'Milion lipat empat'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question:
				'Konstanta matematika, yang dikenal sebagai "Rasio Emas", paling sering dilambangkan dengan huruf Yunani yang mana?',
			options: ['π (pi)', 'Ψ (psi)', 'Φ (phi)', 'Τ (tau)'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Siapa nama depan matematikawan Euler?',
			options: ['Leonhard', 'Lionel', 'Andrin', 'Ajan'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa perkiraan nilai konstanta matematika e?',
			options: ['2.72', '3.14', '1.62', '1.41'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Dalam sistem heksadesimal, angka berapa yang muncul setelah 9?',
			options: ['10', 'Nomor 0', 'Huruf A', '16'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Manakah dari berikut ini yang bukan merupakan salah satu dari tujuh Masalah Hadiah Milenium?',
			options: ['Dugaan Navier', 'Dugaan Birch dan Swinnerton-Dyer', 'Hipotesis Riemann', 'Dugaan Poincare'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak sisi yang dimiliki segi tujuh?',
			options: ['7', '5', '4', '9'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Jenis fungsi apakah x²+2x+1?',
			options: ['Kuadrat', 'Rasional', 'Linier', 'Eksponensial'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapakah 6 digit pertama dari bilangan "Pi"?',
			options: ['3.14159', '3.14169', '3.12423', '3.25812'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Dalam distribusi normal, 95% data terletak pada berapa standar deviasi mean?',
			options: ['2', '1', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak zeptometer dalam satu femtometer?',
			options: ['10', '1.000.000.000', '1.000.000', '1000'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapakah eksponen prima Mersenne pertama yang lebih dari 1000?',
			options: ['2203', '1009', '1279', '1069'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question:
				'Manakah dari angka-angka berikut yang paling dekat dengan jumlah total kemungkinan negara bagian untuk Mesin Enigma standar tentara?',
			options: ['1,58x10^20', '1,58x10^22', '1,58x10^18', '1,58x10^24'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question:
				'Matematikawan Yunani manakah yang berlari di jalanan Syracuse dalam keadaan telanjang sambil meneriakkan "Eureka" setelah menemukan prinsip perpindahan?',
			options: ['Euclid', 'Homer', 'Archimedes', 'Eratosthenes'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question:
				'Pada bidang kompleks, mengalikan fungsi tertentu dengan i akan memutarnya berlawanan arah jarum jam sebanyak berapa derajat?',
			options: ['90', '180', '270', '0'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question:
				'Berapakah bilangan terkecil yang dapat dinyatakan sebagai penjumlahan dua kubus positif dengan dua cara berbeda?',
			options: ['91', '1729', '561', '4104'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Apa representasi alfanumerik dari bilangan imajiner?',
			options: ['Saya', 'e', 'N', 'X'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Siapa yang membuktikan Teorema Terakhir Fermat?',
			options: ['Leonhard Euler', 'Carl Friedrich Gauss', 'Srinivasa Ramanujan', 'Andrew Wiles'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Manakah dari berikut ini yang TIDAK dikembangkan oleh matematikawan Leonhard Euler?',
			options: [
				'Sebuah metode penyelesaian persamaan diferensial orde pertama',
				'Peningkatan pada Fast Fourier Transform',
				'Identitas yang menghubungkan angka e, pi dan i',
				'Rumus yang menghubungkan simpul, sisi, dan permukaan pada suatu graf'
			],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Kurva bidang yang diusulkan Descartes untuk menantang teknik penemuan ekstrem Fermat disebut?',
			options: ['Folium Descartes', 'Paraboloid Elips Descartes', 'Koordinat Kartesius', 'Helikoid Descarte'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Manakah dari matematikawan berikut yang memberikan kontribusi besar terhadap teori permainan?',
			options: ['John Von Neumann', 'Carl Friedrich Gauss', 'Leonhard Euler', 'Stefan Banach'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak sisi yang dimiliki trapesium?',
			options: ['3', '4', '5', '6'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Siapakah dua orang yang berjasa menemukan kalkulus diferensial secara independen?',
			options: ['Plato dan Aristoteles', 'Asiimov dan Rutherford', 'Newton dan Leibnitz', 'Dvorak dan Smith'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Awalan metrik "atto-" membuat pengukuran menjadi lebih kecil dari satuan dasar?',
			options: ['Satu Miliar', 'Satu Kuadriliun', 'Satu Septillion', 'Satu per lima triliun'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Dalam Angka Romawi, XL disamakan dengan apa?',
			options: ['40', '60', '15', '90'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa jumlah sisi paling sedikit yang dapat dimiliki suatu poligon?',
			options: ['1', '2', '7', '3'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Matematikawan Perancis Évariste Galois terkenal karena karyanya yang mana?',
			options: ['Pecahan Lanjutan Galois', 'Teori Galois', 'Metode Galois untuk PDE', 'Integrasi Abelian'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Poligon yang mempunyai delapan sisi disebut?',
			options: ['Segi enam', 'Nanagon', 'Segi tujuh', 'Segi delapan'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak buku dalam Elements of Geometry karya Euclid?',
			options: ['8', '13', '10', '17'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak angka nol yang ada di googol?',
			options: ['10', '1.000', '100', '1.000.000'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa luas lingkaran yang diameternya 20 inci jika π= 3,1415?',
			options: ['314,15 Inci', '380,1215 Inci', '3141,5 Inci', '1256,6 Inci'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Urutan operasi apa yang benar untuk menyelesaikan persamaan?',
			options: [
				'Penjumlahan, Perkalian, Pembagian, Pengurangan, Penjumlahan, Tanda Kurung',
				'Tanda kurung, Eksponen, Penjumlahan, Pengurangan, Perkalian, Pembagian',
				'Urutan penulisan operasi.',
				'Tanda kurung, Eksponen, Perkalian, Pembagian, Penjumlahan, Pengurangan'
			],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak sisi yang dimiliki strip Möbius?',
			options: ['1', '2', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa Milibar (mbar) ke 1 Inci Merkuri (inHg)',
			options: ['30.0', '33.9', '27.4', '10.6'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapakah bilangan prima berikutnya setelah 19?',
			options: ['25', '23', '21', '27'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question:
				'Gagasan tentang "himpunan yang memuat semua himpunan yang tidak memuat dirinya sendiri" merupakan gagasan paradoks yang diatribusikan kepada filsuf Inggris yang mana?',
			options: ['Fransiskus Bacon', 'John Locke', 'Bertrand Russell', 'Alfred Utara Whitehead'],
			correct: 2
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak permukaan persegi yang dimiliki sebuah kubus?',
			options: ['6', '4', '8', '10'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa banyak sisi yang dimiliki segi lima?',
			options: ['9', '5', '6', '4'],
			correct: 1
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapakah angka keempat dari π?',
			options: ['1', '2', '3', '4'],
			correct: 0
		},
		{
			category: 'MATHEMATICS',
			question: 'Berapa angka romawi untuk 500?',
			options: ['L', 'C', 'X', 'D'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Manakah dari matematikawan terkenal berikut yang tewas dalam duel pada usia 20 tahun?',
			options: ['Habel', 'Euler', 'Gauss', 'Galois'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Apa turunan dari Percepatan terhadap waktu?',
			options: ['Menggeser', 'Menabrak', 'Menggeser', 'Berengsek'],
			correct: 3
		},
		{
			category: 'MATHEMATICS',
			question: 'Huruf Yunani apa yang digunakan untuk menandakan penjumlahan?',
			options: ['Delta', 'Alfa', 'Akhir', 'Sigma'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Kota manakah yang menjadi pusat pemerintahan Belanda?',
			options: ['Amsterdam', 'Utrecht', 'Rotterdam', 'Den Haag'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Presiden AS manakah yang dikatakan memiliki janggut paling panjang?',
			options: ['Zachary Taylor', 'John Quincy Adams', 'Rutherford B.Hayes', 'James A.Garfield'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'Dalam sejarah Amerika Serikat, berapa banyak wakil presiden yang dimiliki Franklin D. Roosevelt selama ia menjabat sebagai presiden?',
			options: ['1', '2', '3', '0'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Kandidat mana yang memenangkan Pilpres AS tahun 2012?',
			options: ['Barrack Obama', 'Mitt Romney', 'Bob Harapan', 'Ross Perot'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Manakah dari berikut ini yang merupakan kandidat resmi pada Pemilihan Umum Inggris 2017?',
			options: ['Tuan Buckethead', 'James Fransiskus', 'Robert Wimbledon', 'Tuan Crumpetsby'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question:
				'Siapa mantan presiden AS yang dijuluki "Teddy" setelah dia menolak menembak beruang hitam yang tidak berdaya?',
			options: ['Woodrow Wilson', 'James F.Fielder', 'Theodore Roosevelt', 'Andrew Jackson'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Negara manakah yang mencatat rekor dunia dengan 315 juta pemilih hadir pada pemilu tanggal 20 Mei 1991?',
			options: ['Amerika Serikat', 'Uni Soviet', 'India', 'Polandia'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'Karena Resolusi Nagoya, Tiongkok setuju untuk mengizinkan Taiwan berkompetisi secara terpisah di ajang olahraga internasional dengan nama apa?',
			options: ['Taiwan Cina', 'Republik Taiwan', 'Republik Taipei', 'Cina Taipei'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Siapakah slogan kampanye presiden tahun 2016 yang berjudul "Make America Great Again"?',
			options: ['Ted Cruz', 'Donald Trump', 'Marco Rubio', 'Bernie Sanders'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question:
				'Suku/bangsa penduduk asli Amerika manakah yang memerlukan setidaknya satu kuantum darah campuran (setara dengan satu orang tua) agar memenuhi syarat untuk menjadi anggota?',
			options: ['Suku Sioux Batu Berdiri', 'Suku Kiowa di Oklahoma', 'Suku Yomba Shoshone', 'Bangsa Pawnee di Oklahoma'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Siapa satu-satunya presiden AS yang menjabat dua periode tidak berturut-turut?',
			options: ['James K.Polk', 'Franklin D.Roosevelt', 'Grover Cleveland', 'Thomas Jefferson'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Antara tahun 1973 hingga 1990, negara manakah yang diperintah oleh diktator Augusto Pinochet?',
			options: ['Etiopia', 'Indonesia', 'Nikaragua', 'Chili'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Siapa yang terpilih sebagai pemimpin Partai Buruh Inggris pada bulan September 2015?',
			options: ['Jeremy Corbyn', 'Ed Miliband', 'David Cameron', 'Theresa Mei'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Tahun berapa Gerald Ford Menjadi Presiden?',
			options: ['1977', '1973', '1969', '1974'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Manakah dari Presiden Amerika Serikat berikut yang masa jabatannya terpendek?',
			options: ['William Henry Harrison', 'Zachary Taylor', 'James A.Garfield', 'Warren G. Harding'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Siapa Perdana Menteri Inggris saat pecahnya Perang Dunia Kedua?',
			options: ['Clement Attlee', 'Neville Chamberlain', 'Winston Churchill', 'Stanley Baldwin'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Siapa yang menjadi Perdana Menteri Inggris pada Juli 2016?',
			options: ['Boris Johnson', 'David Cameron', 'Tony Blair', 'Theresa Mei'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Berapa banyak orang di Dewan Perwakilan AS?',
			options: ['435', '260', '415', '50'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Apa tujuan utama Amandemen Keempat Konstitusi AS?',
			options: [
				'Mencegah hukuman yang kejam dan tidak biasa',
				'Melindungi dari hukuman penjara tanpa proses hukum yang semestinya',
				'Melindungi hak untuk memiliki dan memanggul senjata',
				'Mencegah penggeledahan dan penyitaan yang tidak wajar'
			],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Siapa nama lengkap mantan Presiden Amerika Serikat Bill Clinton?',
			options: ['William Roosevelt Clinton', 'William Truman Clinton', 'William Jefferson Clinton', 'William Lincoln Clinton'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Siapa salah satu pangeran Andorra?',
			options: ['Raja Inggris', 'Presiden Perancis', 'Paus', 'Tidak ada siapa-siapa (posisinya kosong)'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question:
				'Menurut Konstitusi Amerika Serikat, berapa usia seseorang untuk dapat terpilih sebagai Presiden Amerika Serikat?',
			options: ['30', '40', '45', '35'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Pasar konsumen terbesar pada tahun 2015 adalah...',
			options: ['Jerman', 'Amerika Serikat', 'Jepang', 'Inggris Raya'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Siapa Presiden Kulit Hitam pertama di Afrika Selatan?',
			options: ['Nelson Mandela', 'Mangosuthu Buthelezi', 'Steve Biko', 'Uskup Tutu'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Apa nama depan pasangan ayah dan anak pertama yang sama-sama menjabat Perdana Menteri Kanada?',
			options: ['Justin dan Pierre', 'John dan Louis', 'Brian dan Justin', 'Brian dan Pierre'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Apa itu sentralisme?',
			options: [
				'Menyesuaikan diri dengan satu agenda politik yang sama.',
				'Tetap netral secara politik.',
				'Wilayah abu-abu dalam spektrum politik kiri dan kanan.',
				'Pemusatan kekuasaan dan wewenang pada suatu organisasi pusat.'
			],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: '"Ya, Amerika Bisa!" adalah slogan kampanye de facto politisi Amerika Serikat pada tahun 2004.',
			options: ['John Kerry', 'George W.Bush', 'Barrack Obama', 'Al Gore'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Film "The Raid 2: Berandal" tahun 2014 sebagian besar syutingnya di negara Asia yang mana?',
			options: ['Thailand', 'Brunei', 'Indonesia', 'Malaysia'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Siapa satu-satunya presiden yang tidak menjabat di Washington D.C?',
			options: ['Abraham Lincoln', 'George Washington', 'Richard Nixon', 'Thomas Jefferson'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Negara mana yang bergabung dengan NATO sebagai anggota ke-29 pada tahun 2017?',
			options: ['Estonia', 'Andorra', 'Montenegro', 'Islandia'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question:
				'Mulai tahun 2000, Tiongkok melarang produksi dan penjualan semua konsol video game. Pada tahun berapa larangan ini dicabut?',
			options: ['2012', '2008', '2017', '2015'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Manakah dari berikut ini yang BUKAN salah satu dari anak-anak Donald Trump?',
			options: ['Julius', 'Donald Jr.', 'Ivanka', 'Eric'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Negara bagian mana di AS yang pertama kali mengizinkan perempuan memilih pada tahun 1869?',
			options: ['Kalifornia', 'Wyoming', 'Delaware', 'Virginia'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Siapa senator terlama dalam sejarah AS, menjabat dari tahun 1959 hingga 2010?',
			options: ['Daniel Inouye', 'Strom Thurmond', 'Joe Biden', 'Robert Byrd'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Siapa yang menggantikan Joseph Stalin sebagai Sekretaris Jenderal Partai Komunis Uni Soviet?',
			options: ['Nikita Khrushchev', 'Leonid Brezhnev', 'Mikhail Gorbachev', 'Boris Yeltsin'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Sebelum tahun 2011, "Radio Kapitalis Sejati" dikenal dengan nama berbeda. Siapa nama itu?',
			options: ['Radio Republik Sejati', 'Radio Kapitalis Texas', 'Kapitalis Bersatu', 'Radio Konservatif Sejati'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Mantan Presiden Amerika Serikat Bill Clinton terkenal memainkan alat musik apa?',
			options: ['Saksofon', 'Tanduk bariton', 'Piano', 'Biola'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Keruntuhan bank besar manakah yang menjadi salah satu penyebab Krisis Keuangan tahun 2008?',
			options: ['HSBC', 'Lehman bersaudara', 'Barclay', 'Lloyd'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Skandal Watergate terjadi pada tahun berapa?',
			options: ['1972', '1973', '1974', '1971'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question: 'Badan utama PBB manakah yang ditangguhkan sejak tahun 1994?',
			options: ['Sekretariat', 'Dewan Perwalian', 'Majelis Umum', 'Dewan Ekonomi dan Sosial'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Apa nama panggilan pribadi Gubernur Negara Bagian Louisiana AS ke-40, Huey Long?',
			options: ['Sang Juara', 'Burung Hantu Hoot', 'Ikan Kingfish', 'Oracle'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Manakah dari senator Amerika Serikat berikut yang dikenal melakukan filibuster selama 24 jam?',
			options: ['Roy Blunt', 'John Barrasso', 'Strom Thurmond', 'Chuck Schumer'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Surat apa yang harus Anda miliki pada SIM Eropa untuk dapat mengendarai sepeda motor?',
			options: ['A', 'X', 'D', 'B'],
			correct: 0
		},
		{
			category: 'POLITICS',
			question:
				'Pada bulan Juni 2017, Arab Saudi dan Mesir memutuskan hubungan dengan negara mana yang dianggap mendukung terorisme?',
			options: ['Bahrain', 'Amerika Serikat', 'Rusia', 'Qatar'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question:
				'Siapa mantan presiden AS yang menggunakan slogan kampanye "Ayo Jadikan Amerika Hebat Lagi" sebelum kampanye Donald Trump?',
			options: ['Jimmy Carter', 'Gerald Ford', 'Richard Nixon', 'Ronald Reagan'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Siapa Presiden Amerika Serikat ke-40?',
			options: ['Jimmy Carter', 'Ronald Reagan', 'Bill Clinton', 'Richard Nixon'],
			correct: 1
		},
		{
			category: 'POLITICS',
			question: 'Manakah dari negara Kepulauan Pasifik berikut yang menganut sistem monarki konstitusional?',
			options: ['Palau', 'Fiji', 'Tonga', 'Kiribati'],
			correct: 2
		},
		{
			category: 'POLITICS',
			question: 'Pada tahun berapa upaya penerapan Common Core State Standards (CCSS) di AS dimulai?',
			options: ['2012', '2006', '1997', '2009'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question:
				'Apa nama karya Niccolò Machiavelli yang berpendapat bahwa pemimpin yang efektif perlu menghancurkan lawan mereka dengan cara apa pun?',
			options: ['Pemerkosaan Lucrece', 'Keinginan untuk Berkuasa', 'Perjuangan Cinta Hilang', 'Pangeran'],
			correct: 3
		},
		{
			category: 'POLITICS',
			question: 'Presiden mana yang menghapus utang negara Amerika Serikat?',
			options: ['Andrew Jackson', 'Ronald Reagan', 'John F.Kennedy', 'Franklin Roosevelt'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Dalam "Homestuck" siapa wali Dave Strider?',
			options: ['Becquerel', 'Dokter Gores', 'Halley', 'Kawan'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Dalam komik Marvel, manakah di antara berikut ini yang bukan merupakan salah satu batu infinity?',
			options: ['Energi', 'Waktu', 'Kekuatan', 'Jiwa'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Crossover alam semesta manakah yang diperkenalkan dalam komik "Sonic the Hedgehog" edisi #247?',
			options: ['Saudara Super Mario', 'Manusia Besar', 'Alex Kidd', 'Bola Monyet Super'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Di Marvel Universe, planet Svartalfheim adalah rumah bagi ras apa?',
			options: ['Peri Kegelapan', 'Raksasa Beku', 'Kronan', 'Skrull'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Dari negeri mana Thor berasal?',
			options: ['Midgard', 'Asgard', 'Jotunheim', 'Sovengarde'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Apa kelemahan vampir Amerika (Vampir Amerika karya Scott Snyder)?',
			options: ['Sinar matahari', 'Kayu', 'Perak', 'Emas'],
			correct: 3
		},
		{
			category: 'COMICS',
			question:
				'Ditemukan di alam semesta fiksi Marvel Comics, apa nama logam yang hampir tidak bisa dihancurkan yang melapisi tulang dan cakar Wolverine?',
			options: ['titanium', 'Vibranium', 'Karbonadium', 'Adamantium'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Dari planet manakah Superman berasal?',
			options: ['Avalon', 'Xolnar', 'kripton', 'Surga Bintang'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Siapa yang menulis serial komik Batman "The Killing Joke"?',
			options: ['Jari Bill', 'Frank Miller', 'Alan Moore', 'Jerry Siegel'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Siapakah Vampir Amerika pertama (Vampir Amerika karya Scott Snyder)?',
			options: ['Hattie Hargrove', 'Mutiara Jones', 'Buku James "Jim".', 'Lebih Kurus Manis'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Di Black Hammer, kota apa yang diselamatkan para pahlawan dari Anti-Dewa?',
			options: ['Kota Spiral', 'Mega-Kota Satu', 'kayu batu', 'Kota Bintang'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Di komik DC, siapa nama asli Owlman?',
			options: ['Thomas Wayne Jr.', 'Thomas Wayne', 'Bruce Wayne', 'Joseph Dinginkan'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Pada tahun 1978, Superman bekerja sama dengan selebriti apa, untuk mengalahkan invasi alien?',
			options: ['Mike Tyson', 'Sylvester Stallone', 'Muhammad Ali', 'Arnold Schwarzenegger'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Siapa nama orang tua Batman?',
			options: ['Joey & Jackie', 'Jason & Sarah', 'Todd & Mira', 'Thomas & Marta'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Siapa nama tokoh utama dalam webcomic Gunnerkrigg Court karya Tom Siddell?',
			options: ['Bismut', 'Antimon', 'Air raksa', 'Kobalt'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Apa Tiga Keutamaan Bionicle?',
			options: [
				'Bangun, Mainkan, Ubah',
				'Bekerja, Bermain, Hidup',
				'Menempa, Membangun, Bertarung',
				'Persatuan, Tugas, Takdir'
			],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Siapa Batmannya?',
			options: ['Clark Kent', 'Barry Allen', 'Bruce Wayne', 'Tony Stark'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Di Black Hammer, dimensi apa yang dilalui Kolonel Weird?',
			options: ['Ruang hiper', 'Cermin Alam Semesta', 'Para-Zona', 'Zona Hantu'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Dalam "Homestuck" "Kerajaan Kegelapan" juga dikenal sebagai?',
			options: ['Skaia', 'Prospit', 'Derse', 'Media'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Apa nama sebenarnya dari Magneto "Master Of Magnetism"?',
			options: ['Charles Xavier', 'Max Eisenhardt', 'Pietro Maximoff', 'Johann Schmidt'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Tokoh protagonis utama berusia enam tahun dalam Calvin dan Hobbes dinamai menurut nama teolog apa?',
			options: ['John Calvin', 'Calvin Klein', 'Calvin Coolidge', 'Phillip Calvin McGraw'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Dalam komik "Archie", siapa pacar pertama Jughead?',
			options: ['Joani', 'Etel', 'Debbi', 'Margret'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Dalam komik "Sonic the Hedgehog", siapa pencipta Roboticizer?',
			options: ['Julian Robotnik', 'Ivo Robotnik', 'Robotnik yang sinis', 'Profesor Charles si Landak'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Siapa nama asli Hellboy?',
			options: ['Tangan Kanan Doom', 'Ogdru Jahad', 'Azzael', 'Anung Un Rama'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Boneka harimau di Calvin dan Hobbes dinamai menurut nama filsuf apa?',
			options: ['David Hobbes', 'John Hobbes', 'Thomas Hobbes', 'Natanael Hobbes'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Apa warna rambut asli Daredevil versi buku komik mainstream (Earth-616)?',
			options: ['Pirang', 'Pirang', 'Cokelat', 'Hitam'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Di Calvin dan Hobbes, siapa nama pacar babysitter?',
			options: ['Dave', 'Charlie', 'Charles', 'Natanael'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Manakah dari komik berbasis game berikut yang diterbitkan pada tahun 2011 oleh DC Comics?',
			options: ['Meninggalkan 4 Mati: Pengorbanan', 'Prototipe', 'Kane & Lynch', 'Terkenal'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Siapa orang kedua yang berperan sebagai Night Owl dalam novel grafis Watchmen?',
			options: ['Daniel Dreiberg', 'Nelson Gardner', 'Hollis Mason', 'Adrian Veidt'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Di Bionicle, siapa yang dulunya adalah Av-Matoran dan sekarang menjadi Toa of Light?',
			options: ['Takua', 'Jaller', 'Vakama', 'Tahu'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Di alam semesta Hellboy, siapa yang mendirikan BPRD?',
			options: ['Trevor Bruttenholm', 'Kate Corrigan', 'Johann Kraus', 'Benyamin Daimio'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Pahlawan super manakah yang terkenal dengan kecepatan supernya?',
			options: ['manusia unggul', 'Batman', 'manusia laba-laba', 'Kilatan'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Saat Batman mengendalikan ruang obrolan online, alias apa yang dia gunakan?',
			options: ['akuBatman', 'JonDoe297', 'BWayne13', 'BW1129'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Di Homestuck Update manakah [S] Game Over dirilis?',
			options: ['13 April 2009', '8 April 2012', '25 Oktober 2014', '28 Agustus 2003'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Apa nama lengkap asli Captain America?',
			options: ['Steven John Rogers', 'Steven Peggy Rogers', 'Steven William Rogers', 'Steven Grant Rogers'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Sahabat "Green Arrow" mana yang biasa memakai topi baseball?',
			options: ['Kenari Hitam', 'Ratu Emiko', 'Dick Grayson', 'Roy Harper'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Dalam webcomic "Ava\'s Demon", dosa apa yang menjadi dasar "Nevy Nervine"?',
			options: ['Kemalasan', 'Kemarahan', 'Nafsu', 'Iri'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Kapan komik Garfield pertama kali diterbitkan?',
			options: ['1982', '1973', '1978', '1988'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Di alam semesta Hellboy, siapa nama lahir Abe Sapien?',
			options: ['Langdon Everett Caul', 'Tuan Baltimore', 'Tuan Edward Gray', 'Paus Landis'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Edisi komik "Sonic the Hedgehog" manakah yang pertama kali muncul Scourge the Hedgehog?',
			options: ['Sonic si Landak #11', 'Alam Semesta Sonic #32', 'Sonic si Landak #161', 'Sonic si Landak #47'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Siapa pencipta serial komik "The Walking Dead"?',
			options: ['Robert Kirkman', 'Stan Lee', 'Malcolm Wheeler-Nicholson', 'Robert Remah'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Apa nama komik tentang anak kecil dan harimau yang sebenarnya adalah boneka binatang?',
			options: ['Winnie si beruang', 'Albert dan Pogo', 'Calvin dan Hobbes', 'kacang tanah'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Pahlawan pulp mana yang muncul di komik Hellboy dan BPRD sebelum mendapatkan spin-off sendiri?',
			options: ['Roger sang Homunculus', 'Lobster Johnson', 'Laba-laba', 'Wendigo'],
			correct: 1
		},
		{
			category: 'COMICS',
			question: 'Lebih Dikenal dengan Nama Panggilan Logan, Apa Nama Lahir Wolverine?',
			options: ['James Howlett', 'Serigala Logan', 'Thomas Wilde', 'John Savage'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Tahun berapa San Diego Comic-Con pertama?',
			options: ['1970', '2000', '1990', '1985'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Apa nama dua "troll penggemar Canon" di "Homestuck"?',
			options: [
				'Mahkota Wrycrown dan Voksea Olkido',
				'Aikter Frekik dan Xagrai Ollomu',
				'Grekei Ceknux dan Riya Camacho',
				'Mierfa Durgas dan Nektan Whelan'
			],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Kapan Marvel Comics didirikan?',
			options: ['1939', '1932', '1951', '1936'],
			correct: 0
		},
		{
			category: 'COMICS',
			question: 'Di Seri Homestuck, apa nama alternatif Kingdom of Lights?',
			options: ['Tanpa Nama', 'Kota Emas', 'Bulan Kuning', 'Prospit'],
			correct: 3
		},
		{
			category: 'COMICS',
			question: 'Dalam komik Batman, apa nama lain penjahat Dr. Jonathan Crane yang dikenal?',
			options: ['Kutukan', 'Manusia Kalender', 'orang-orangan sawah', 'permukaan tanah liat'],
			correct: 2
		},
		{
			category: 'COMICS',
			question: 'Apa sebutan yang diberikan kepada Marvel Cinematic Universe?',
			options: ['Bumi-199999', 'Bumi-616', 'Bumi-10005', 'Bumi-2008'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Siapa yang diberi gelar "Full Metal" di serial anime "Full Metal Alchemist"?',
			options: ['Edward Elric', 'Alphonse Elric', 'Van Hohenheim', 'Izumi Curtis'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Siapakah titan lapis baja di "Attack On Titan"?',
			options: ['Armin Arlelt', 'Mikasa Ackermann', 'Eren Jaeger', 'Reiner Braun'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Apa nama belakang Edward dan Alphonse di serial Fullmetal Alchemist.',
			options: ['Ellis', 'Eliek', 'Elwood', 'Elric'],
			correct: 3
		},
		{
			category: 'ANIME',
			question:
				'Lagu manakah yang menjadi tanda panggilan stasiun radio KWFM karya Stefan Verdemann di "Monster" karya Urasawa Naoki?',
			options: [
				'Sungguh Dunia yang Menakjubkan',
				'Di Atas Pelangi',
				'Saat Anda Menginginkan Bintang',
				'Bernyanyi Di Tengah Hujan'
			],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Dari manga manakah "404 Girl" dari 4chan berasal?',
			options: ['Azumanga Daioh', 'Bintang Keberuntungan', 'Semanggi', 'Yotsuba&!'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Siapa yang menulis dan menyutradarai film animasi "Spirited Away" (2001)?',
			options: ['Isao Takahata', 'Mamoru Hosoda', 'Hayao Miyazaki', 'Hidetaka Miyazaki'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Siapa Penulis manga Uzumaki?',
			options: ['Junji Ito', 'Noboru Takahashi', 'Akira Toriyama', 'Masashi Kishimoto'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Studio animasi manakah yang memproduksi "Log Horizon"?',
			options: ['Matahari terbit', 'Xebec', 'Satelit', 'Produksi I.G'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Kapan episode pertama Soul Eater dirilis?',
			options: ['2003', '2005', '2011', '2008'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Studio mana yang membuat Cowboy Bebop?',
			options: ['Matahari terbit', 'Tulang', 'Rumah gila', 'Pierriot'],
			correct: 0
		},
		{
			category: 'ANIME',
			question:
				'"Silhouette", sebuah lagu yang dibawakan oleh grup \'KANA-BOON\', ditampilkan sebagai lagu pembuka keenam belas dari anime yang mana?',
			options: ['Satu potong', 'Naruto: Shippuden', 'Naruto', 'Gurren Lagann'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Nama band mana yang bukan Stand di "JoJo\'s Bizarre Adventure"?',
			options: ['Hari Hijau', 'AC/DC', 'selamat', 'Cabai Merah Pedas'],
			correct: 1
		},
		{
			category: 'ANIME',
			question:
				'Siapakah orang dari "JoJo\'s Bizarre Adventure" yang TIDAK memuat referensi ke band, artis, atau lagu sebelum tahun 1980?',
			options: ['Giorno Giovanna', 'Josuke Higashikata', 'Jolyne Cujoh', 'Johnny Joestar'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Siapakah tokoh utama berambut kuning di anime Naruto?',
			options: ['Naruto', 'Sepuluh Sepuluh', 'Sasuke', 'Kakashi'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Apa nama boneka singa di Bleach?',
			options: ['Jo', 'Urdiu', 'anak', 'Kon'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Studio animasi manakah yang menganimasikan "Psycho Pass"?',
			options: ['Animasi Kyoto', 'Batang', 'Produksi I.G', 'Pemicu'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Apa Pokemon kedua Ash Ketchum?',
			options: ['Charmander', 'Pikachu', 'Pidgey', 'ulat'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Karakter Petualangan Aneh JoJo manakah yang memiliki Stand bernama Silver Chariot?',
			options: ['Noriaki Kakyoin', 'Jean Pierre Polnareff', 'Hol Kuda', 'Hermes Costello'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Dalam serial manga "Re:Zero", manakah dari Uskup Agung Sin berikut yang memakan keberadaan Rem?',
			options: ['Roy Alphard', 'Ley Batenkaitos', 'Petelgeuse Romanee-Conti', 'Louis Arneb'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Siapakah seniman manga horor yang membuat Uzumaki?',
			options: ['Junji Ito', 'Kazuo Umezu', 'Shintaro Kago', 'Sui Ishida'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Di "Little Witch Academia", apa alias Shiny Chariot di Luna Nova Academy?',
			options: ['Croix Meridi', 'Ursula Callistis', 'Miranda Holbrook', 'Anne Finnelan'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Apa nama karakter utama yang diberikan Chihiro dalam film "Spirited Away" tahun 2001?',
			options: ['Hyaku (Seratus)', 'Sen (Seribu)', 'Ichiman (Sepuluh ribu)', 'Juu (Sepuluh)'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Dalam "To Love-Ru", Ren dan Run berasal dari planet apa?',
			options: ['Iblisuke', 'Mistletoe', 'Okiwana', 'Hafalkan'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Dalam anime "My Hero Academia", karakter manakah yang ditampilkan dengan kemampuan memanipulasi gravitasi?',
			options: ['bakugo', 'Uraraka', 'Deku', 'Asui'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Studio anime mana yang bertanggung jawab atas anime hit "Made in Abyss"?',
			options: ['Pemicu', 'Studio 3hz', 'Jeruk Kinema', '8bit'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Nama penipu Junko Enoshima di awal Danganronpa: Trigger Happy Havoc adalah?',
			options: ['Ryota Mitarai', 'Mukuro Ikusaba', 'Penipu Utama', 'Komaru Naegi'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Siapakah Pokemon Legendaris pertama yang dikalahkan oleh Ash Ketchum di anime Pokémon?',
			options: ['Darkrai', 'Latios', 'Articuno', 'Regis'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Siapa yang mengisi suara "Shou Suzuki" dalam dubbing bahasa Inggris "Mob Psycho 100"?',
			options: ['Ben Diskin', 'Chris Niosi', 'David Naughton', 'Casey Mongillo'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Dalam "Shakugan no Shana" Shana biasanya disebut apa?',
			options: ['Kabut Api', 'Kabut Mata Terbakar Berambut Api', 'Shana', 'Pemburu Bermata Terbakar Berambut Api'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: "Antagonis utama bagian kedua JoJo's Bizarre Adventure yang manakah di bawah ini?",
			options: ['kars', 'Erina Joestar', 'Santana', 'Kabel Beck'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Berapa umur Ash Ketchum di Pokemon saat memulai perjalanannya?',
			options: ['11', '12', '9', '10'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: "Bagian mana dari manga JoJo's Bizarre Adventure yang berkisah tentang pacuan kuda di seluruh Amerika?",
			options: [
				'Bagian 6: Lautan Batu',
				'Bagian 7: Lari Bola Baja',
				'Bagian 3: Tentara Salib Stardust',
				'Bagian 5: Angin Emas'
			],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Kirito dan Asuna adalah karakter utama dari anime apa?',
			options: ['Satu potong', 'Catatan Kematian', 'Seni Pedang Online', 'ekor dongeng'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Dalam "Jewelpet Sunshine", lagu apa yang diputar saat Kanon dan teman-temannya keluar dari penjara?',
			options: ['Saya Tidak Ingin Melewatkan Apa Pun', 'Mata Harimau', 'Terlahir untuk menjadi Liar', 'Cincin Ruby'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Dalam "One Piece", siapa yang mengonfirmasi keberadaan harta karun legendaris One Piece?',
			options: [
				'Mantan Laksamana Armada Laut Sengoku',
				'Raja Bajak Laut Gol D Roger',
				'Perak Rayleigh',
				'Edward "Shirohige" Newgate'
			],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Pada tahun berapa manga "Ping Pong" memulai serialisasi?',
			options: ['2014', '1996', '2010', '2003'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Apa nama mesin pachinko yang terkenal dari "Kaiji"?',
			options: ['Rawa', 'Iblis', 'Yang Tak Terkalahkan', 'Naga'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Protagonis utama bagian kelima Petualangan Aneh JoJo adalah yang mana dari berikut ini?',
			options: ['Guido Mista', 'Giorno Giovanna', 'Jonatan Joestar', 'Joey JoJo'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Studio animasi manakah yang menganimasikan anime "Mob Psycho 100" tahun 2016?',
			options: ['A-1 Gambar', 'Batang', 'Tulang', 'Rumah gila'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Siapa Sutradara film Anime tahun 1988 "Grave of the Fireflies"?',
			options: ['Isao Takahata', 'Hayao Miyazaki', 'Satoshi Kon', 'Sunao Katabuchi'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Dalam anime superhero, "One Punch Man", siapa nama Pahlawan protagonis utama?',
			options: ['Berjubah Botak', 'Tinju Kuat', 'Petinju Gila', 'Hakim Puncher'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Di anime "Hunter X Hunter", siapa nama protagonis utamanya?',
			options: ['Gin', 'Gan', 'Jenderal', 'Gon'],
			correct: 3
		},
		{
			category: 'ANIME',
			question: 'Studio animasi manakah yang memproduksi adaptasi anime "xxxHolic"?',
			options: ['Matahari terbit', 'Xebec', 'Produksi I.G', 'Animasi Kyoto'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Dalam anime, "Fullmetal Alchemist", siapa yang dikenal sebagai \'Flame Alchemist\'?',
			options: ['Roy Mustang', 'Edward Elric', 'Maes Hughes', 'Lin Yao'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Di JoJo\'s Bizarre Adventure, siapa bilang "Yare yare linglung"?',
			options: ['Jotaro Kujo', 'Joseph Joestar', 'Jolyne Cujoh', 'Koichi Hirose'],
			correct: 0
		},
		{
			category: 'ANIME',
			question: 'Manakah dari anime berikut yang memiliki lebih dari 7.500 episode?',
			options: ['Naruto', 'Sazae-san', 'Satu potong', 'Chibi Maruko-chan'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Dua karakter utama "No Game No Life", Sora dan Shiro, memiliki nama yang sama?',
			options: ['Imanitas', 'Kosong', 'Turun', 'binatang perang'],
			correct: 1
		},
		{
			category: 'ANIME',
			question: 'Manga "To Love-Ru" dimulai pada tahun berapa?',
			options: ['2007', '2004', '2006', '2005'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Siapa Pengisi Suara One Punch Man di Versi Jepang.',
			options: ['Zach Aguilar', 'Kaito Ishikawa', 'Makoto Furukawa', 'Max Mittelman'],
			correct: 2
		},
		{
			category: 'ANIME',
			question: 'Dalam film animasi "Wolf Children" tahun 2012, siapa nama anak serigala?',
			options: ['Ame & Yuki', 'Hana dan Yuki', 'Ame & Hana', 'Chuck & Anna'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Di alam semesta "Star Wars", spesies apa yang Dilempar Laksamana Agung?',
			options: ['ciuman', 'Gungan', 'Pantoran', "Twi'lek"],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama anjing peliharaan Jonny di The Adventures of Jonny Quest?',
			options: ['Beruntung', 'berbatu-batu', 'Maks', 'Bandit'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question:
				'Manakah di antara berikut ini yang bukan merupakan karakter asli dalam serial kartun My Little Pony: Friendship is Magic?',
			options: ['pai kelingking', 'pai maud', 'garis pelangi', 'Rose Marene'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Nickelodeon dimiliki oleh perusahaan induk apa?',
			options: ['CBS', 'RUBAH', 'ABC', 'Viacom'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: "Lagu 'Little April Shower' ditampilkan dalam film kartun Disney yang mana?",
			options: ['Cinderella', 'Bambi', 'Pinokio', 'Buku Hutan'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question:
				"Episode The Amazing World Of Gumball manakah yang memenangkan Children's Choice Award di British Animation Awards pada tahun 2016?",
			options: ['Batasnya', 'Anak-anak', 'Cangkang', 'Keluhan'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Siapa pengisi suara Ruby di serial animasi RWBY?',
			options: ['Tara Kuat', 'Jessica Nigri', 'Lindsay Jones', 'Hayden Panettiere'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Di antara film-film berikut, manakah yang menjadi penulis, sutradara, dan produser Don Bluth?',
			options: ['Titan A.E.', 'Anastasia', 'Semua Anjing Masuk Surga', 'Negeri Sebelum Waktu'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Pada tahun berapa adaptasi anime "March Comes In Like A Lion" tayang?',
			options: ['2017', '2016', '2018', '2015'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Di serial animasi RWBY, apa nama senjata yang digunakan Weiss Schnee?',
			options: ['Kain Kafan Gambol', 'Myrtenaster', 'Mawar Sabit', 'Ember Celica'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Karakter internet animasi apa yang diketahui menjawab email dengan sarung tinju?',
			options: ['Sangat Sedih', 'Kuat Buruk', 'Gila yang Kuat', 'Sangat Senang'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Kemampuan apa yang dimiliki Putri Sofia Pertama dari jimatnya yang memungkinkan dia bernapas di bawah air?',
			options: ['Transformasi Putri Duyung', 'Insang Buatan', 'Kepala Gelembung', 'Perisai Gelembung'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Dalam "My Little Pony: Friendship is Magic", kuda poni manakah yang mewakili kualitas kejujuran?',
			options: ['Kilau Senja', 'pai kelingking', 'Applejack', 'Keanehan'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama anjing Sid di "Toy Story"?',
			options: ['Penghancur', 'Cambang', 'Tuan Jones', 'Gerakan cepat'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Benny, Brain, Fancy-Fancy, Spook dan Choo-Choo dikenal sebagai rekan dari karakter kartun Hanna Barbera?',
			options: ['Beruang Yogi', 'Snagglepuss', 'Scooby-Doo', 'Kucing Teratas'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Karakter "Toy Story" manakah yang disuarakan oleh Don Rickles?',
			options: ['Anjing Slinky', 'Tuan Kepala Kentang', 'Ham', 'Rex'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Penyanyi manakah yang mengisi suara Mother Brain Metroid dalam serial animasi "Captain N: The Game Master"?',
			options: ['Levi Stubbs', 'Freddie Merkurius', 'Janet Jackson', 'Joan Jett'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama kota tempat The Flintstones berada?',
			options: ['Stoneville', 'Rockhampton', 'Batuan dasar', 'Kota Batu Besar'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Siapakah karakter "pirang bodoh" dalam "The Loud House" Nickelodeon?',
			options: ['Luan', 'Luna', 'Lincoln', 'Leni'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama belakang salah satu guru laki-laki di serial BBC Postman Pat?',
			options: ['Pejalan', 'Pringle', 'Dorito', 'terletak'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: "Karakter 'Family Guy' manakah yang mendapat pertunjukan spin-off sendiri di tahun 2009?",
			options: ['Glenn Quagmire', 'Joe Swanson', 'Cleveland Brown', 'Pria Tuli yang Gemuk'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Dalam serial animasi Disney tahun 1993 "Bonkers", siapa nama partner kedua Bonker?',
			options: ['Miranda Wright', 'Dick Tracy', 'Eddie Pemberani', 'Dr.Ludwig von Drake'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Siapa satu-satunya pengisi suara yang menjadi pembicara di semua film layar lebar Disney Pixar?',
			options: ['Tom Hanks', 'Dave Foley', 'Geoffrey terburu-buru', 'John Ratzenberger'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Siapa yang mengisi suara Finn di Adventure Time?',
			options: ['Nolan Utara', 'John Di Maggio', 'Jeremy Shada', 'Tom Kenny'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Dalam "Gravity Falls", apa yang dilakukan Quentin Trembley saat dia diusir dari Gedung Putih?',
			options: [
				'Tinggalkan dengan damai.',
				'Makan salamander dan lompat keluar jendela.',
				'Lompat keluar jendela.',
				'Lepaskan 1.000 salamander yang ditangkap ke dalam gedung putih.'
			],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama tokoh kartun Andy Capp di Jerman?',
			options: ['Dick Tingeler', 'Helmut Schmacker', 'Penyadap Batang', 'Willi Wakker'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Berapa frame rate standar untuk animasi?',
			options: ['12FPS', '30FPS', '60FPS', '24FPS'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Siapa nama lengkap Scooby Doo?',
			options: ['Skuter Doo', 'Scooby Dooby Doo', 'Scoobert Doo', 'Scoobity Doo'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Siapa yang mengisi suara Jin di "Aladdin" Disney?',
			options: ['Billy Kristal', 'Adam Sandler', 'Jim Carrey', 'Robin Williams'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Apa nama makhluk yang dilawan oleh protagonis webshow RWBY?',
			options: ['Grimm', 'Reaver', 'Kejam', 'Yang Gelap'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Sebelum menjadi pemimpin Autobot, Optimus Prime dikenal dengan nama apa di Cybertron?',
			options: ['Jarak Jauh', 'Hlm.138', 'Orion Pax', 'Teletran-1'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question:
				'Dalam acara Kartun tahun 1969 "Dastardly and Muttley in Their Flying Machines", manakah yang BUKAN salah satu lirik dalam lagu pembukanya?',
			options: ['Tangkap dia', 'Pukul dia', 'Tab dia', 'Tusuk dia'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: "Siapa penjahat di ''The Lion King''?",
			options: ['Bekas luka', 'Fred', 'Jafar', 'Vada'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Dalam acara "Fat Albert and the Cosby Kids", apa nama geng fiksi para tokohnya?',
			options: ['Geng Tempat Barang rongsokan', 'Rombongan Sampah', 'Tempat Sampah Tujuh', 'Pose Busuk'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Berapa nomor di baju Gerald di "Hey Arnold!"?',
			options: ['88', '38', '83', '33'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Siapa yang menciptakan serial Cartoon Network "Adventure Time"?',
			options: ['JG Quintel', 'Bangsal Pendleton', 'Ben Bocquelet', 'Rebecca Gula'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Yang mana karakter berikut ini hidup di dalam nanas di bawah laut dalam kartun "SpongeBob SquarePants".',
			options: ['Patrick Bintang', 'Tentakel Squidward', 'SpongeBob SquarePants', 'Tuan Krabs'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Apa hubungan Rick dan Morty di acara "Rick and Morty"?',
			options: ['Ayah dan Anak', 'Teman Terbaik', 'Kakek dan Cucu', 'Mitra Pemberantasan Kejahatan'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Tahun berapa film Disney "A Goofy Movie" dirilis?',
			options: ['1999', '2001', '1995', '1997'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Siapa yang menciptakan serial Cartoon Network "Regular Show"?',
			options: ['Ben Bocquelet', 'JG Quintel', 'Bangsal Pendleton', 'Rebecca Gula'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Manakah dari karakter kartun berikut yang TIDAK disuarakan oleh Rob Paulsen?',
			options: [
				'Carl Wheezer (Jimmy Neutron)',
				'Yakko Warner (Animaniak)',
				'Topeng (Topeng, Serial TV)',
				'Max Tennyson (Ben 10)'
			],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Dalam "Gravity Falls", berapa berat Waddles saat Mable memenangkannya di "The Time Traveller\'s Pig"?',
			options: ['20 pon', '10 pon', '15 pon', '30 pon'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question: 'Apa makanan favorit Everest di serial Nickelodeon/Nick Jr. "PAW Patrol"?',
			options: ['Ayam', 'Hati', 'Steak', 'Karibu'],
			correct: 1
		},
		{
			category: 'CARTOONS',
			question: 'Adam West adalah walikota kota kartun yang mana?',
			options: ['lapangan musim semi', 'Taman Selatan', 'Quahog', 'Air Terjun Langley'],
			correct: 2
		},
		{
			category: 'CARTOONS',
			question:
				'Manakah di antara berikut ini yang BUKAN merupakan slogan yang digunakan oleh Rick Sanchez dalam acara TV "Rick and Morty"?',
			options: ['Pergilah, Jack!', 'Rikki-Tikki-Tavi, jalang!', 'Wubba-lubba-dub-dub!', 'Slam dunk, hanya jaring!'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Manakah dari karakter dari "SpongeBob SquarePants" berikut yang bukan cumi-cumi?',
			options: ['Gary', 'Orvillie', 'Cumi-cumi', 'cumi-cumi'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Keluarga kartun manakah yang tinggal di 31 Spooner Street, Quahog, Rhode Island AS?',
			options: ['Simpsons', 'Keluarga Jetson', 'Perbukitan', 'Griffin'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Wendy O. Koopa muncul di Kartun Super Mario DIC, tapi dia dikenal sebagai apa?',
			options: ['pai sayang', 'kue wendy', 'pai madu', 'pai kootie'],
			correct: 3
		},
		{
			category: 'CARTOONS',
			question: 'Kapan tanggal rilis episode pertama "The Powerpuff Girls"?',
			options: ['18 November 1998', '25 Juni 1999', '28 Juli 2000', '14 April 2001'],
			correct: 0
		},
		{
			category: 'CARTOONS',
			question: 'Dalam "Avatar: The Last Airbender", elemen manakah yang mulai dipelajari Aang setelah dicairkan?',
			options: ['Udara', 'Bumi', 'Api', 'Air'],
			correct: 3
		}
	]
});
