/* global client, botNum */
import configuration from '../../connect.js';
import { shuffleArray } from '../../helper/index.js';

const WEREWOLF_SCRIPTING = {
	success: {
		join: 'Kamu berhasil join ke permainan Werewolf! Silahkan tunggu saat room master memulai permainan.\n\nPlayer yang telah bergabung : ',
		starting:
			'Permainan berhasil dimulai. Tunggu sebentar. Bot sedang mengacak peran dan membuat nya se-balance mungkin! Jika sudah selesai, Bot akan memberi tahu peran yang telah dibagikan di private chat!',
		killWerewolf: 'Kamu berhasil membunuh ',
		killedByWerewolf:
			'Kamu dibunuh oleh Werewolf! Untuk waktu setelah itu kamu harus ditetapkan untuk diam sampai permainan selesai!',
		voted: 'Kamu berhasil melakukan voting! Tunggu sebentar.',
		exit: 'Kamu berhasil keluar dari permainan Werewolf!',
		delete: 'Sukses menghapus sesi permainan Werewolf!',
		guarded: 'Sukses menjaga {0}. Ia akan tidur nyenyak malam ini!',
		exitAndDelete: 'Karena pemain di sesi ini tidak ada, Maka permainan otomatis dibubarkan.',
	},
	error: {
		afk: [
			'Sesi ini sudah berakhir. Dikarenakan sesi ini sudah 3x tidak mengambil keputusan pada saat sesi Voting.',
			'Sesi permainan berakhir, Sesi ini diakhiri dikarenakan sudah 3x pemain-pemain tidak mengambil keputusan saat sesi Voting.',
			'Permainan diakhiri. Sesi Voting sudah berlangsung dan permainan sudah 3x tidak ada pengambilan keputusan suara.',
		],
		notRoomMaster: 'Kamu bukan merupakan room master!',
		notEnoughPlayer: 'Room belum full! Tunggu sampai 5 orang atau lebih!\n\nTotal player sekarang : ',
		started: 'Permainan telah dimulai! Tunggu permainan sampai selesai.',
		joined: 'Kamu telah bergabung ke room ini!',
		full: 'Room telah penuh! Tunggu permainan sampai selesai.',
		wrongRole: 'Peranmu bukanlah {0}. Melainkan {1}',
		wrongKill: 'Kamu tidak dapat membunuh sesama Werewolf.',
		alreadyAction: 'Kamu telah bertindak sebelumnya! Tunggu malam selanjutnya untuk bertindak sesuai peran mu.',
		protected:
			'Kamu berusaha membunuh seseorang yang dilindungi. Sekarang posisi mu terbongkar! Bohongi warga lain jika orang yang kamu berusaha bunuh menuduhmu!',
		wrongKillProtected:
			'Serigala {0} berusaha membunuh mu! Tetapi karena kamu lagi di Jaga, kamu tidak mati pada malam ini! Tetap Hati-hati untuk malam selanjutnya! Jika kamu mendapat ',
		dead: 'Kamu sudah mati! Tunggu sesi permainan berikutnya. Untuk sekarang silahkan tonton permainan. Tetaplah diam!',
		wrongTime:
			'Belum saatnya mengambil tindakan! Tunggu waktu yang tepat untuk mengambil tindakan. Waktu yang dibolehkan adalah {0}, Sekarang waktu nya adalah {1}',
		victimAlreadyDead: 'Orang yang ingin kamu {0} sudah mati!',
		alreadyVoted: 'Kamu sudah pernah memberi suara pada sesi ini! Tunggu sesi permainan berikutnya.',
		gameStarted: 'Permainan sudah dimulai. Kamu dilarang keluar dari game.',
		noSessionExist: 'Sesi permainan tidak ada! Silahkan buat permainan baru.',
		gameStartedTryingToDelete: 'Sesi permainan Werewolf sudah dimulai. Tunggu permainan selesai.',
		gameStartedTryingToMakeNewOne: 'Sesi permainan Werewolf sudah dimulai. Tunggu permainan selesai lalu buat baru.',
		gameExistsTryingToMakeNewOne:
			'Sesi permainan Werewolf sudah ada. Kamu tidak bisa membuat baru. Hapus dahulu sesi lalu buat baru.',
		notJoined: 'Kamu belum bergabung ke dalam sesi permainan Werewolf!',
		cantActionSelf: 'Kamu tidak bisa mengambil tindakan {0} pada diri sendiri!',
	},
	nightTime: [
		'Malam telah datang, pergilah ke tempat tidur mu. Tetap berhati-hati dengan Werewolf yang berkeliaran!\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!',
		'Tidur dan beristirahatlah sejenak.\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!',
		'Pergilah tidur dan tetaplah berhati-hati dengan Werewolf yang berkeliaran.\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!',
	],
	dayTime: {
		kill: [
			'Pagi telah tiba, warga sekitar mencium bau {0} yang tergeletak dijalan meninggal.',
			'Matahari telah terbit, Saat warga sedang mencium bau menyengat lalu menemukan {0} meninggal dengan kepala terpotong',
			'Pagi telah tiba, warga sekitar melihat jejak Werewolf yang memiliki bercak darah. Warga mengikuti jejak tersebut lalu menemukan {0} meninggal dengan tubuh tercabik-cabik',
		],
		noKill: [
			'Pagi telah tiba, Matahari terbit dengan cuaca yang cerah tanpa tanda-tanda warga yang dibunuh.',
			'Hari ini cuacanya sangat cerah. Warga tidak menemukan siapapun yang hilang atau dibunuh oleh Werewolf.',
			'Warga sekitar telah pada bangun. Mereka sadar tidak ada yang dibunuh oleh Werewolf.',
		],
		voting: [
			'Saat nya Warga berkumpul untuk pengambilan suara. Vote seseorang untuk di hukum!\n\nCheck private chat mu bot telah mengirim kan list untuk memudahkan pengambilan suara. Hasil pungutan suara akan dikirimkan kembali ke group.',
			'Warga diwajibkan untuk berkumpul dan melakukan pengambilan suara. Gunakan tindakan mu segera! Bot akan mengirimkan list pengambilan suara di private chat mu. Hasil pungutan suara akan dikirimkan kembali ke group.',
		],
	},
	lynchKillNotWerewolf: [
		'Penduduk telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia bukan Werewolf, melainkan {1}',
		'Warga telah setuju untuk melempar {0} ke gunung merapi karena diduga sebagai Werewolf. Yang aslinya dia adalah {1}',
		'{0} diduga sebagai Werewolf. Warga pun melakukan suntik mati terhadapnya. Warga menyadari bahwa {0} meninggal seketika. Dan warga menduga dia bukan Werewolf melainkan {1}',
		'Warga setuju untuk menghukum gantung {0} karena diduga sebagai Werewolf. Warga menyadari bahwa {0} bukan lah Werewolf, melainkan {1}',
	],
	lynchKillWerewolf: [
		'Penduduk sekitar telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia emang benar Werewolf. Selamat warga.',
		'{0} merupakan Werewolf, karena Warga sadar saat ia di lempar ke gunung merapi, ia tidak langsung meninggal.',
		'{0} di setujui untuk dihukum gantung. Warga mengetahui kalau ia adalah Werewolf. Dan emang benar ia merupakan Werewolf.',
	],
	lynchDraws: [
		'Sayang sekali pungutan suara yang dilakukan hari ini mengalami Draw! Warga tidak dapat memutuskan siapa yang akan dihukum. Pastikan orang yang kamu hukum adalah Werewolf dan pastikan kamu berbincang dahulu.',
		'Sesi Voting hari ini hasilnya adalah Draw! Tidak ada yang dihukum. Pastikan kamu berbincang dahulu untuk menyetujui seseorang untuk dihukum.',
	],
	lynchNoOne: ['Warga sama sekali tidak ada mengambil suara. Jika sudah 3x maka permainan akan berakhir'],
	characterDialogue: {
		seer: 'Kamu berperan sebagai Seer atau Penerawang. Tindakan yang bisa kamu lakukan ialah menerawang seseorang tiap malam untuk mengetahui apakah ia adalah Werewolf atau merupakan peran lain.',
		villager:
			'Kamu berperan sebagai Penduduk. Tindakan yang bisa kamu lakukan hanya menjadi orang biasa tanpa keahlian lain. Ikuti permainannya dan tunggu waktu pagi hari untuk memungut suara untuk memutuskan siapa yang akan dihukum.',
		werewolf:
			'Kamu berperan sebagai Werewolf. Tindakan yang kamu lakukan setiap malam adalah membunuh salah satu player lain. Berhati-saat berpura-pura baik! Agar peran lainnya tidak mengetahui peranmu. Teman Werewolf mu yang lain adalah {0}',
		guard:
			'Kamu berperan sebagai Guard atau Penjaga. Tindakan yang bisa kamu lakukan tiap malam ialah memilih salah satu player untuk dijadikan teman Penjaga. Player yang kamu pilih tidak akan bisa dibunuh, tetapi kamu bisa. Jadi berhati-hati lah!',
	},
	characterInAction: {
		seer: {
			guessing: [
				'Kamu menerawang {0} dan mengetahui bahwa ia adalah {1}',
				'Kamu bermimpi dan melihat kilasan-kilasan dari mimpi mu dan melihat {0} adalah {1}',
				'Pada malam hari kamu terbangun dari tempat tidur dan sempat termenung. Saat itu juga firasat mu mengatakan bahwa {0} adalah {1}',
			],
			notGuessingWerewolf: [
				'Kamu menerawang bahwa {0} bukanlah Werewolf.',
				'Kamu sempat bermimpi lima menit yang lalu dan melihat {0} bukan lah Werewolf.',
				'Mimpi mu mengatakan jika {0} bukanlah Werewolf, tapi kamu tidak yakin dengan hal itu.',
			],
		},
		guard: [
			'Kamu beruntung malam ini Penjaga menjaga mu. Kamu tidak akan bisa dibunuh oleh Werewolf.',
			'Malam ini kamu tidak akan bisa dibunuh oleh Werewolf dikarenakan kamu telah dijaga oleh Penjaga',
		],
	},
	winner: {
		werewolf: 'Werewolf memenangkan Permainan ini. Selamat kepada pihak Werewolf!\n\nStatistic :\n\n',
		villager: 'Pihak Warga memenangkan Permainan ini. Selamat kepada pihak Warga!\n\nStatistic :\n\n',
	},
};

export class Werewolf {
	constructor(roomMaster, roomId, client, name, status) {
		const data = this.getDataGame(roomId);

		if (data) {
			return data;
		}

		this.roomId = roomId;
		this.roomMaster = roomMaster;
		this.roomMasterName = name;
		this.playersData = [];
		this.playersAlive = [];
		this.playersKilled = [];
		this.playersDead = [];
		this.playerVoted = [];
		this.gameStarted = false;
		this.gameWinner = null;
		this.gameTime = 60;
		this.gameTimeCycle = 'night';
		this.gameDialogue = '';
		this.gameCycler = null;
		this.gameTimeStarted = null;
		this.gameAfk = 0;
		this.firstNight = true;
		this.timeSpent = 1;
		this.reduceTime = true;
		this.client = client;

		if (status) {
			this.setNewGame();
		}

		this.werewolfJoin = (id, roomId, name) => {
			const data = this.getDataGame(roomId);

			if (!data) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			}

			const isStarted = data.gameStarted;
			const isJoined = data.playersData.some((v) => v.id === id);
			const isFull = data.playersData.length >= 7;

			if (isStarted) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.started };
			}

			if (isJoined) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.joined };
			}

			if (isFull) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.full };
			}

			data.playersData.push({
				id,
				index: data.playersData.length,
				name,
				role: '',
				dialogue: '',
				isProtected: false,
				isAlive: true,
				isAction: false,
				isVoted: false,
			});
			return {
				error: false,
				message: WEREWOLF_SCRIPTING.success.join + data.playersData.length,
				mentions: data.playersData.map((v) => v.id),
			};
		};

		this.startGame = (playerId, roomId) => {
			const data = this.getDataGame(roomId);

			if (!data) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			}

			const isStarted = data.gameStarted;
			const isRoomMaster = data.roomMaster === playerId;
			const isNotFull = data.playersData.length < 5;

			if (!isRoomMaster) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.notRoomMaster };
			}

			if (isStarted) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.started };
			}

			if (isNotFull) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.notEnoughPlayer + data.playersData.length };
			}

			data.gameStarted = true;
			data.gameDialogue = this.randomizeDialogue(roomId);
			data.playersData = this.randomizeRole();
			data.playersData.forEach((v) => (v.dialogue = WEREWOLF_SCRIPTING.characterDialogue[v.role]));
			data.playersAlive = data.playersData.filter((v) => v.isAlive).map((v) => v.id);
			data.gameTimeStarted = new Date().getTime();
			return { error: false, message: WEREWOLF_SCRIPTING.success.starting, data };
		};

		this.checkIfSpectate = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			const player = data.playersData.filter((v) => v.id === playerId);

			if (player.length === 0) {
				return;
			}

			if (!player[0].isAlive) {
				return false;
			}

			return true;
		};

		this.checkRole = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			const player = data.playersData.filter((v) => v.id === playerId);

			if (player.length === 0) {
				return;
			}

			return player[0].role;
		};

		this.killPlayerAsWerewolf = (playerId, playerIdKill, roomId) => {
			return this.checkValidKill(playerId, playerIdKill, roomId);
		};

		this.seerSomeone = (playerId, playerIdSeer, roomId) => {
			return this.checkValidSeer(playerId, playerIdSeer, roomId);
		};

		this.voteSomeone = (playerId, playerIdVoted, roomId) => {
			return this.checkValidVote(playerId, playerIdVoted, roomId);
		};

		this.guardSomeone = (playerId, playerIdGuarded, roomId) => {
			return this.checkValidGuard(playerId, playerIdGuarded, roomId);
		};

		this.exitGame = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			const player = data.playersData.findIndex((v) => v.id === playerId);

			if (player == -1) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.notJoined };
			}

			if (data.gameStarted) {
				return { error: true, message: WEREWOLF_SCRIPTING.error.gameStarted };
			}

			data.playersData.splice(player, 1);

			if (data.playersData.length === 0) {
				this.deleteGame(playerId);
				return {
					error: false,
					message: WEREWOLF_SCRIPTING.success.exitAndDelete,
				};
			}

			return {
				error: false,
				message: WEREWOLF_SCRIPTING.success.exit,
			};
		};
	}

	deleteGame = (playerId) => {
		const data = this.getDataGame(this.roomId);

		if (!data) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
		}

		if (data.gameStarted) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.gameStartedTryingToDelete };
		}

		if (playerId !== data.roomMaster) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.notRoomMaster };
		}

		clearTimeout(this.gameCycler);
		configuration.games.werewolf.delete(this.roomId);
		return { error: false, message: WEREWOLF_SCRIPTING.success.delete };
	};

	setNewGame = () => {
		const data = this.getDataGame(this.roomId);

		if (!data) {
			configuration.games.werewolf.set(this.roomId, this);
			configuration.games.werewolf.get(this.roomId).playersData.push({
				id: this.roomMaster,
				index: 0,
				name: this.roomMasterName,
				role: '',
				isProtected: false,
				isAlive: true,
				isAction: false,
			});
			return;
		}

		return !data.gameStarted
			? { error: true, message: WEREWOLF_SCRIPTING.error.gameExistsTryingToMakeNewOne }
			: { error: true, message: WEREWOLF_SCRIPTING.error.gameStartedTryingToMakeNewOne };
	};

	randomSeer = (playerSeerRole, playerSeerName) => {
		if (playerSeerRole == 'werewolf') {
			const dialogue = WEREWOLF_SCRIPTING.characterInAction.seer.guessing;

			return dialogue[Math.floor(Math.random() * dialogue.length)]
				.replace('{0}', playerSeerName)
				.replace('{1}', playerSeerRole);
		} else {
			const dialogue = shuffleArray([
				...WEREWOLF_SCRIPTING.characterInAction.seer.guessing,
				...WEREWOLF_SCRIPTING.characterInAction.seer.notGuessingWerewolf,
			]);

			return dialogue[0].replace('{0}', playerSeerName).replace('{1}', playerSeerRole);
		}
	};

	randomGuard = () => {
		return WEREWOLF_SCRIPTING.characterInAction.guard[
			Math.floor(Math.random() * WEREWOLF_SCRIPTING.characterInAction.guard.length)
		];
	};

	checkValidGuard = (playerId, playerIdGuard, roomId) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
		}

		const player = data.playersData.findIndex((v) => v.id === playerId);

		if (player == -1) {
			return;
		}

		const playerGuard = data.playersData.findIndex((v) => v.id === playerIdGuard || v.index == playerIdGuard - 1);

		if (playerGuard == -1) {
			return;
		}

		if (this.checkRole(data.playersData[player].id, roomId) !== 'guard') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongRole
					.replace('{0}', 'Guard')
					.replace('{1}', data.playersData[player].role.capitalize()),
			};
		}

		if (data.gameTimeCycle == 'day') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongTime.replace('{0}', 'Malam Hari').replace('{1}', 'Pagi Hari'),
			};
		}

		if (!data.playersData[player].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
		}

		if (data.playersData[player].isAction) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyAction };
		}

		if (data.playersData[playerGuard].id == playerId) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.cantActionSelf.replace('{0}', 'Menjaga') };
		}

		if (!data.playersData[playerGuard].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead.replace('{0}', 'Jaga') };
		}

		data.playersData[player].isAction = true;
		return {
			error: false,
			data: [
				{
					id: data.playersData[player].id,
					message: WEREWOLF_SCRIPTING.success.guarded.replace('{0}', data.playersData[playerGuard].name),
				},
				{ id: data.playersData[playerGuard].id, message: data.randomGuard() },
			],
		};
	};

	checkValidSeer = (playerId, playerIdSeer, roomId) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
		}

		const player = data.playersData.findIndex((v) => v.id === playerId);

		if (player == -1) {
			return;
		}

		const playerSeer = data.playersData.findIndex((v) => v.id === playerIdSeer || v.index == playerIdSeer - 1);

		if (playerSeer == -1) {
			return;
		}

		if (this.checkRole(data.playersData[player].id, roomId) !== 'seer') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongRole
					.replace('{0}', 'Seer')
					.replace('{1}', data.playersData[player].role.capitalize()),
			};
		}

		if (data.gameTimeCycle == 'day') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongTime.replace('{0}', 'Malam Hari').replace('{1}', 'Pagi Hari'),
			};
		}

		if (!data.playersData[player].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
		}

		if (data.playersData[player].isAction) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyAction };
		}

		if (data.playersData[playerSeer].id == playerId) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.cantActionSelf.replace('{0}', 'Menerawang') };
		}

		if (!data.playersData[playerSeer].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead.replace('{0}', 'Terawang') };
		}

		data.playersData[player].isAction = true;
		return {
			error: false,
			data: [
				{
					id: data.playersData[player].id,
					message: data.randomSeer(data.playersData[playerSeer].role, data.playersData[playerSeer].name),
				},
			],
		};
	};

	checkValidKill = (playerId, playerIdKill, roomId) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
		}

		const player = data.playersData.findIndex((v) => v.id === playerId);

		if (player == -1) {
			return;
		}

		const playerKill = data.playersData.findIndex((v) => v.id === playerIdKill || v.index == playerIdKill - 1);

		if (playerKill == -1) {
			return;
		}

		if (this.checkRole(data.playersData[player].id, roomId) !== 'werewolf') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongRole
					.replace('{0}', 'Werewolf')
					.replace('{1}', data.playersData[player].role.capitalize()),
			};
		}

		if (data.gameTimeCycle == 'day') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongTime.replace('{0}', 'Malam Hari').replace('{1}', 'Pagi Hari'),
			};
		}

		if (!data.playersData[player].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
		}

		if (data.playersData[playerKill].id == playerId) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.cantActionSelf.replace('{0}', 'Membunuh') };
		}

		if (this.checkRole(data.playersData[playerKill].id, roomId) === 'werewolf') {
			return { error: true, message: WEREWOLF_SCRIPTING.error.wrongKill };
		}

		if (!data.playersData[playerKill].isAlive) {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.victimAlreadyDead.replace('{0}', data.playersData[playerKill].id),
			};
		}

		if (data.playersData[player].isAction) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyAction.replace('{0}', 'Bunuh') };
		}

		if (data.playersData[playerKill].isProtected) {
			data.playersData[player].isAction = true;
			return {
				error: true,
				data: [
					{
						id: data.playersData[playerKill].id,
						message: WEREWOLF_SCRIPTING.error.protectedMessage.replace('{0}', playerKill + 1),
					},
					{
						id: data.playersData[player].id,
						message: WEREWOLF_SCRIPTING.error.protected,
					},
				],
			};
		}

		if (data.playersData[playerKill].isAlive) {
			data.playersData[player].isAction = true;
			data.playersData[playerKill].isAlive = false;
			data.playersKilled.push(data.playersData[playerKill]);
			data.playersAlive.splice(
				data.playersAlive.findIndex((v) => v.id == data.playersData[playerKill].id),
				1,
			);
			return {
				error: false,
				mentions: [data.playersData[playerKill].id],
				data: [
					{ id: data.playersData[playerKill].id, message: WEREWOLF_SCRIPTING.success.killedByWerewolf },
					{
						id: data.playersData[player].id,
						message: `${WEREWOLF_SCRIPTING.success.killWerewolf}${data.playersData[playerKill].name}`,
					},
				],
			};
		}
	};

	checkValidVote = (playerId, playerIdVoted, roomId) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
		}

		const player = data.playersData.findIndex((v) => v.id === playerId);

		if (player == -1) {
			return;
		}

		const playerVoted = data.playersData.findIndex((v) => v.id === playerIdVoted);

		if (playerVoted == -1) {
			return;
		}

		if (!data.playersData[player].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
		}

		if (data.gameTimeCycle !== 'voting') {
			return {
				error: true,
				message: WEREWOLF_SCRIPTING.error.wrongTime.replace('{0}', 'Pemilihan').replace('{1}', data.gameTimeCycle),
			};
		}

		if (data.playersData[player].isVoted) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyVoted };
		}

		if (!data.playersData[playerVoted].isAlive) {
			return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead.replace('{0}', 'Pilih') };
		}

		data.playersData[player].isVoted = true;
		data.playerVoted.push({ ...data.playersData[playerVoted], voter: data.playersData[player].name });
		return {
			error: false,
			data: [{ id: data.playersData[player].id, message: WEREWOLF_SCRIPTING.success.voted }],
		};
	};

	startGameCycle = (roomId, timer) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return;
		}

		const isStarted = data.gameStarted;

		if (!isStarted) {
			return;
		}

		const timers = data.gameTime;

		data.gameCycler = setTimeout(() => {
			const dataGame = this.getDataGame(roomId);

			if (!dataGame) {
				return;
			}

			if (dataGame.firstNight) {
				dataGame.firstNight = false;
				dataGame.gameTimeCycle = 'day';
			}

			if (dataGame.gameTimeCycle == 'day') {
				this.resetPerks(dataGame.roomId);
				let peopleKilledMention = [];
				let message = WEREWOLF_SCRIPTING.dayTime.noKill[Math.floor(Math.random() * WEREWOLF_SCRIPTING.dayTime.noKill.length)];
				const isSomeoneKilled = dataGame.playersKilled.length > 0;

				if (isSomeoneKilled) {
					const peopleKilled = dataGame.playersKilled.map((v) => `@${v.id.split('@')[0]}`).join(', ');

					peopleKilledMention = dataGame.playersKilled.map((v) => v.id);
					message = WEREWOLF_SCRIPTING.dayTime.kill[
						Math.floor(Math.random() * WEREWOLF_SCRIPTING.dayTime.kill.length)
					].replace('{0}', peopleKilled);
					dataGame.playersKilled.forEach((v) => {
						dataGame.playersData.forEach((w) => {
							if (w.id == v.id) {
								w.isAlive = false;
								dataGame.playersAlive.splice(
									dataGame.playersAlive.findIndex((x) => x.id == v.id),
									1,
								);
								dataGame.playersDead.push(v);
							}
						});
					});
				}

				dataGame.playersKilled = [];
				dataGame.gameDialogue = message;
				client[botNum].ev.emit('werewolf.cycle', {
					error: false,
					peopleKilledMention,
					message,
					id: dataGame.roomId,
					...client,
					...dataGame,
					time: 'day',
				});
				dataGame.gameTimeCycle = 'evening';
				dataGame.gameTime = 20;
				this.startGameCycle(roomId, timer);
			} else if (dataGame.gameTimeCycle == 'evening') {
				if (!dataGame) {
					return;
				}

				let message;

				if (dataGame.gameAfk == 3) {
					const statisticPlayer = dataGame.playersData.map(() => ({
						good: dataGame.playersData.filter((w) => w.role !== 'werewolf'),
						bad: dataGame.playersData.filter((w) => w.role == 'werewolf'),
					}));

					message =
						WEREWOLF_SCRIPTING.error.afk[Math.floor(Math.random() * WEREWOLF_SCRIPTING.error.afk.length)] +
						`\n\nStatistic : \n\nPihak Baik:\n${statisticPlayer[0].good
							.map((v) => `@${v.id.split('@')[0]} ${v.isAlive ? '😄 Hidup' : '💀 Mati'} - ${v.role.capitalize()}\n`)
							.join('')}\nPihak Jahat:\n${statisticPlayer[0].bad
							.map((v) => `@${v.id.split('@')[0]} ${v.isAlive ? '😄 Hidup' : '💀 Mati'} - ${v.role.capitalize()}\n`)
							.join('')}\n\nLama permainan : ${dataGame.timeLength}`;
					clearTimeout(dataGame.gameCycler);
					const data = dataGame;

					configuration.games.werewolf.delete(roomId);
					client[botNum].ev.emit('werewolf.cycle', {
						error: true,
						message,
						id: dataGame.roomId,
						...client,
						...data,
						status: false,
						time: 'failAfk',
					});
					return;
				}

				message = WEREWOLF_SCRIPTING.dayTime.voting[Math.floor(Math.random() * WEREWOLF_SCRIPTING.dayTime.voting.length)];
				dataGame.gameDialogue = message;
				dataGame.gameTime = 30;
				client[botNum].ev.emit('werewolf.cycle', {
					error: false,
					message,
					id: dataGame.roomId,
					...client,
					...dataGame,
					time: 'evening',
					status: false,
				});
				dataGame.gameTimeCycle = 'voting';
				this.startGameCycle(roomId, timer);
			} else if (dataGame.gameTimeCycle == 'voting') {
				if (!dataGame) {
					return;
				}

				let message;
				const voters = dataGame.playersData.filter((v) => v.isVoted);
				const isVoting = voters.length > 0;
				let ids = [];
				let voteData = {};

				if (isVoting) {
					const peopleVoted = dataGame.shortVoters(roomId);

					ids = Object.entries(peopleVoted);
					const isDraw = ids.length > 1 && ids[0][1].length == ids[1][1].length;

					if (isDraw) {
						message =
							WEREWOLF_SCRIPTING.lynchDraws[Math.floor(Math.random() * WEREWOLF_SCRIPTING.lynchDraws.length)] +
							`\n\n${ids.map((v, i) => `${i + 1}. @${v[0].split('@')[0]}: ${v[1].join(', ')}`).join('\n')}`;
					} else {
						voteData = {
							voted: ids[0][0],
							voters: ids[0][1],
						};
						const isWerewolf = dataGame.playersData.some((v) => v.id === ids[0][0] && v.role === 'werewolf');

						message = isWerewolf
							? `${WEREWOLF_SCRIPTING.lynchKillWerewolf[
									Math.floor(Math.random() * WEREWOLF_SCRIPTING.lynchKillWerewolf.length)
							  ] /* eslint-disable-line */
									.replace(/\{0\}/g, `${ids.map((v) => `@${v[0].split('@')[0]}`)}`)
									.replace('{1}', dataGame.playersData.find((v) => v.id === ids[0][0]).role.capitalize())}\n\n${ids
									.map((v, i) => `${i + 1}. @${v[0].split('@')[0]}: ${v[1].join(', ')}`)
									.join('\n')}`
							: `${WEREWOLF_SCRIPTING.lynchKillNotWerewolf[
									Math.floor(Math.random() * WEREWOLF_SCRIPTING.lynchKillNotWerewolf.length)
							  ] /* eslint-disable-line */
									.replace(/\{0\}/g, `${ids.map((v) => `@${v[0].split('@')[0]}`)}`)
									.replace('{1}', dataGame.playersData.find((v) => v.id === ids[0][0]).role.capitalize())}\n\n${ids
									.map((v, i) => `${i + 1}. @${v[0].split('@')[0]}: ${v[1].join(', ')}`)
									.join('\n')}`;
						dataGame.playersData[dataGame.playersData.findIndex((v) => v.id === ids[0][0])].isAlive = false;
					}

					dataGame.playerVoted = [];
				} else {
					message = WEREWOLF_SCRIPTING.lynchNoOne[0];
					dataGame.gameAfk++;
				}

				const isWinning =
					dataGame.playersData.filter((v) => v.isAlive && v.role == 'werewolf').length ==
					dataGame.playersData.filter((v) => v.isAlive && v.role !== 'werewolf').length
						? 'werewolf'
						: dataGame.playersData.filter((v) => v.isAlive && v.role == 'werewolf').length == 0
						? 'villager'
						: 'none';

				dataGame.gameDialogue = message;
				client[botNum].ev.emit('werewolf.cycle', {
					error: false,
					voteData,
					message,
					id: dataGame.roomId,
					...client,
					...dataGame,
					time: 'voting',
				});

				if (isWinning !== 'none') {
					setTimeout(() => {
						const statisticPlayer = dataGame.playersData.map(() => ({
							good: dataGame.playersData.filter((w) => w.role !== 'werewolf'),
							bad: dataGame.playersData.filter((w) => w.role == 'werewolf'),
						}));

						dataGame.gameDialogue =
							WEREWOLF_SCRIPTING.winner[isWinning] +
							`Pihak Baik:\n${statisticPlayer[0].good
								.map((v) => `@${v.id.split('@')[0]} ${v.isAlive ? '😄 Hidup' : '💀 Mati'} - ${v.role.capitalize()}\n`)
								.join('')}\nPihak Jahat:\n${statisticPlayer[0].bad
								.map((v) => `@${v.id.split('@')[0]} ${v.isAlive ? '😄 Hidup' : '💀 Mati'} - ${v.role.capitalize()}\n`)
								.join('')}\n\nLama permainan : ${dataGame.timeLength}`;
						client[botNum].ev.emit('werewolf.cycle', {
							error: false,
							peopleMention: dataGame.playersData.map((v) => v.id),
							message,
							id: dataGame.roomId,
							...client,
							...dataGame,
							status: false,
							isWinning,
							time: 'voting',
						});
						clearTimeout(dataGame.gameCycler);
						configuration.games.werewolf.delete(dataGame.roomId);
					}, 3000);
					return;
				}

				dataGame.gameTimeCycle = 'dawn';
				dataGame.gameTime = 30;
				this.startGameCycle(roomId, timer);
			} else if (dataGame.gameTimeCycle == 'dawn') {
				dataGame.gameTime = 40;
				const message = WEREWOLF_SCRIPTING.nightTime[Math.floor(Math.random() * WEREWOLF_SCRIPTING.nightTime.length)].replace(
					'{0}',
					dataGame.gameTime,
				);

				dataGame.gameDialogue = message;
				client[botNum].ev.emit('werewolf.cycle', {
					error: false,
					...(dataGame.firstNight ? {} : message),
					...client,
					id: dataGame.roomId,
					...dataGame,
					time: 'dawn',
				});
				dataGame.gameTimeCycle = 'night';
				this.startGameCycle(roomId);
			} else if (dataGame.gameTimeCycle == 'night') {
				const message = WEREWOLF_SCRIPTING.nightTime[Math.floor(Math.random() * WEREWOLF_SCRIPTING.nightTime.length)].replace(
					'{0}',
					dataGame.gameTime,
				);

				dataGame.gameDialogue = message;
				client[botNum].ev.emit('werewolf.cycle', {
					error: false,
					...(dataGame.firstNight ? {} : message),
					...client,
					id: dataGame.roomId,
					...dataGame,
					time: 'night',
				});
				dataGame.gameTimeCycle = 'day';
				dataGame.timeSpent += 1;
				dataGame.gameTime = 30;
				this.startGameCycle(roomId);
			}
		}, timers * 1000);
	};

	resetPerks(roomId) {
		const data = this.getDataGame(roomId);

		if (!data) {
			return;
		}

		data.playersData.forEach((v) => {
			v.isProtected = false;
			v.isAction = false;
			v.isVoted = false;
		});
	}

	randomizeRole() {
		let roles = [];

		if (this.playersData.length === 7) {
			roles = ['villager', 'guard', 'werewolf', 'villager', 'werewolf', 'villager', 'seer'];
		} else if (this.playersData.length === 6) {
			roles = ['villager', 'villager', 'werewolf', 'guard', 'werewolf', 'seer'];
		} else {
			roles = ['guard', 'villager', 'werewolf', 'villager', 'seer'];
		}

		const shuffled = shuffleArray(roles);

		this.playersData.forEach((v, i) => (v.role = shuffled[i]));
		return this.playersData;
	}

	shortVoters = (roomId) => {
		const data = this.getDataGame(roomId);

		if (!data) {
			return;
		}

		const voters = data.playerVoted;
		const sorted = {};

		voters.forEach((v) => {
			if (sorted[v.id]) {
				sorted[v.id].push(v.voter);
			} else {
				sorted[v.id] = [v.voter];
			}
		});
		return sorted;
	};

	randomizeDialogue(roomId) {
		const data = this.getDataGame(roomId);

		if (!data) {
			return;
		}

		return WEREWOLF_SCRIPTING.nightTime[Math.floor(Math.random() * WEREWOLF_SCRIPTING.nightTime.length)];
	}

	getDataGame(roomId) {
		const data = configuration.games.werewolf.get(roomId);

		if (data === undefined) {
			return false;
		}

		return data;
	}

	get timeLength() {
		const data = this.getDataGame(this.roomId);
		const difference = new Date().getTime() - data.gameTimeStarted;
		const minutes = Math.floor(difference / (1000 * 60)) % 60;
		const seconds = Math.floor(difference / 1000) % 60;

		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
}
