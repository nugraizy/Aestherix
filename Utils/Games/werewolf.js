import { shuffleArray } from "../../Helper/index.js";

const WEREWOLF_SCRIPTING = {
	success: {
		join: "Kamu berhasil join ke permainan Werewolf! Silahkan tunggu saat room master memulai permainan.\n\nPlayer yang telah bergabung : ",
		starting:
			"Permainan berhasil dimulai. Tunggu sebentar. Bot sedang mengacak peran dan membuat nya se-balance mungkin! Jika sudah selesai, Bot akan memberi tahu peran yang telah dibagikan di private chat!",
		killWerewolf: "Kamu berhasil membunuh ",
		killedByWerewolf: "Kamu dibunuh oleh Werewolf! Untuk waktu setelah itu kamu harus ditetapkan untuk diam sampai permainan selesai!",
		voted: "Kamu berhasil melakukan voting! Tunggu sebentar.",
		exit: "Kamu berhasil keluar dari permainan Werewolf!",
	},
	error: {
		afk: [
			"Sesi ini sudah berakhir. Dikarenakan sesi ini sudah 3x tidak mengambil keputusan pada saat sesi Voting.",
			"Sesi permainan berakhir, Sesi ini diakhiri dikarenakan sudah 3x pemain-pemain tidak mengambil keputusan saat sesi Voting.",
			"Permainan diakhiri. Sesi Voting sudah berlangsung dan permainan sudah 3x tidak ada pengambilan keputusan suara.",
		],
		notRoomMaster: "Kamu bukan merupakan room master!",
		notEnoughPlayer: "Room belum full! Tunggu sampai 5 orang atau lebih!\n\nTotal player sekarang : ",
		started: "Permainan telah dimulai! Tunggu permainan sampai selesai.",
		joined: "Kamu telah bergabung ke room ini!",
		full: "Room telah penuh! Tunggu permainan sampai selesai.",
		wrongRole: "Peranmu bukanlah {0}. Melainkan {1}",
		wrongKill: "Kamu tidak dapat membunuh sesama Werewolf.",
		alreadyAction: "Kamu telah bertindak sebelumnya! Tunggu malam selanjutnya untuk bertindak sesuai peran mu.",
		protected: "Kamu berusaha membunuh seseorang yang dilindungi. Sekarang posisi mu terbongkar! Bohongi warga lain jika orang yang kamu berusaha bunuh menuduhmu!",
		dead: "Kamu sudah mati! Tunggu sesi permainan berikutnya. Untuk sekarang silahkan tonton permainan. Tetaplah diam!",
		wrongTime: "Belum saatnya mengambil tindakan! Tunggu waktu yang tepat untuk mengambil tindakan. Waktu yang dibolehkan adalah {0}, Sekarang waktu nya adalaha {1}",
		victimAlreadyDead: "Orang yang ingin kamu {0} sudah mati! Sayang sekali tindakan mu tetap terpakai!",
		alreadyVoted: "Kamu sudah pernah memberi suara pada sesi ini! Tunggu sesi permainan berikutnya.",
		gameStarted: "Permainan sudah dimulai. Kamu dilarang keluar dari game.",
		noSessionExist: "Sesi permainan tidak ada! Silahkan buat permainan baru.",
	},
	nightTime: [
		"Malam telah datang, pergilah ke tempat tidur mu. Tetap berhati-hati dengan Werewolf yang berkeliaran!\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!",
		"Tidur dan beristirahatlah sejenak.\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!",
		"Pergilah tidur dan tetaplah berhati-hati dengan Werewolf yang berkeliaran.\n\nPemain malam : Kamu memiliki waktu {0} detik, Gunakan tindakan mu segera!",
	],
	dayTime: {
		kill: [
			"Pagi telah tiba, warga sekitar mencium bau {0} yang tergeletak dijalan meninggal.",
			"Matahari telah terbit, Saat warga sedang mencium bau menyengat lalu menemukan {0} meninggal dengan kepala terpotong",
			"Pagi telah tiba, warga sekitar melihat jejak Werewolf yang memiliki bercak darah. Warga mengikuti jejak tersebut lalu menemukan {0} meninggal dengan tubuh tercabik-cabik",
		],
		noKill: [
			"Pagi telah tiba, Matahari terbit dengan cuaca yang cerah tanpa tanda-tanda warga yang dibunuh.",
			"Hari ini cuacanya sangat cerah. Warga tidak menemukan siapapun yang hilang atau dibunuh oleh Werewolf.",
			"Warga sekitar telah pada bangun. Mereka sadar tidak ada yang dibunuh oleh Werewolf.",
		],
		voting: [
			"Saat nya Warga berkumpul untuk pengambilan suara. Vote seseorang untuk di hukum!\n\nCheck priavte chat mu bot telah mengirim kan list untuk memudahkan pengambilan suara. Hasil pungutan suara akan dikirimkan kembali ke group.",
			"Warga diwajibkan untuk berkumpul dan melakukan pengambilan suara. Gunakan tindakan mu segera! Bot akan mengirimkan list pengambilan suara di private chat mu. Hasil pungutan suara akan dikirimkan kembali ke group.",
		],
	},
	lynchKillNotWerewolf: [
		"Penduduk telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia bukan Werewolf, melainkan {1}",
		"Warga telah setuju untuk melempar {0} ke gunung merapi karena diduga sebagai Werewolf. Yang aslinya dia adalah {1}",
		"{0} diduga sebagai Werewolf. Warga pun melakukan suntik mati terhadapnya. Warga menyadari bahwa {0} meninggal seketika. Dan warga menduga dia bukan Werewolf melainkan {1}",
		"Warga setuju untuk menghukum gantung {0} karena diduga sebagai Werewolf. Warga menyadari bahwa {0} bukan lah Werewolf, melainkan {1}",
	],
	lynchKillWerewolf: [
		"Penduduk sekitar telah memutuskan {0} untuk digantung karena diduga adalah Werewolf. Ternyata dia emang benar Werewolf. Selamat warga.",
		"{0} merupakan Werewolf, karena Warga sadar saat ia di lempar ke gunung merapi, ia tidak langsung meninggal.",
		"{0} di setujui untuk dihukum gantung. Warga mengetahui kali ia adalah Werewolf. Dan emang benar ia merupakan Werewolf.",
	],
	lynchDraws: [
		"Sayang sekali pungutan suara yang dilakukan hari ini mengalami Draw! Warga tidak dapat memutuskan siapa yang akan dihukum. Pastikan orang yang kamu hukum adalah Werewolf dan pastikan kamu berbincang dahulu.",
		"Sesi Voting hari ini hasilnya adalah Draw! Tidak ada yang dihukum. Pastikan kamu berbincang dahulu untuk menyetujui seseorang untuk dihukum.",
	],
	lynchNoOne: ["Warga sama sekali tidak ada mengambil suara. Jika sudah 3x maka permainan akan berakhir"],
	characterDialogue: {
		seer:
			"Kamu berperan sebagai Seer atau Penerawang. Tindakan yang bisa kamu lakukan ialah menerawang seseorang tiap malam untuk mengetahui apakah ia adalah Werewolf atau merupakan peran lain.",
		villager:
			"Kamu berperan sebagai Penduduk. Tindakan yang bisa kamu lakukan hanya menjadi orang biasa tanpa keahlian lain. Ikuti permainannya dan tunggu waktu pagi hari untuk memungut suara untuk memutuskan siapa yang akan dihukum.",
		werewolf:
			"Kamu berperan sebagai Werewolf. Tindakan yang kamu lakukan setiap malam adalah membunuh salah satu player lain. Berhati-saat berpura-pura baik! Agar peran lainnya tidak mengetahui peranmu. Teman Werewolf mu yang lain adalah {0}",
		guard:
			"Kamu berperan sebagai Guard atau Penjaga. Tindakan yang bisa kamu lakukan tiap malam ialah memilih salah satu player untuk dijadikan teman Penjaga. Player yang kamu pilih tidak akan bisa dibunuh, tetapi kamu bisa. Jadi berhati-hati lah!",
	},
	characterInAction: {
		seer: {
			guessing: [
				"Kamu menerawang {0} dan mengetahui bahwa ia adalah {1}",
				"Kamu bermimpi dan melihat kilasan-kilasan dari mimpi mu dan melihat {0} adalah {1}",
				"Pada malam hari kamu terbangun dari tempat tidur dan sempat termenung. Saat itu juga firasat mu mengatakan bahwa {0} adalah {1}",
			],
			notGuessingWerewolf: [
				"Kamu menerawang bahwa {0} bukanlah Werewolf.",
				"Kamu sempat bermimpi lima menit yang lalu dan melihat {0} bukan lah Werewolf.",
				"Mimpi mu mengatakan jika {0} bukanlah Werewolf, tapi kamu tidak yakin dengan hal itu.",
			],
		},
	},
};

export class Werewolf {
	constructor(roomMaster, roomId, client) {
		this.roomId = roomId;
		this.roomMaster = roomMaster;
		this.playersData = [];
		this.playersAlive = [];
		this.playersKilled = [];
		this.playersDead = [];
		this.playerVoted = [];
		this.gameStarted = false;
		this.gameWinner = null;
		this.gameTime = 20;
		this.gameTimeCycle = "night";
		this.gameDialogue = "";
		this.gameCycler = null;
		this.gameTimeStarted = null;
		this.gameAfk = 0;
		this.firstNight = true;
		this.client = client;
		(this.setNewGame = () => {
			games.werewolf.set(this.roomId, this);
			return games.werewolf.get(this.roomId).playersData.push({
				id: this.roomMaster,
				role: "",
				isProtected: false,
				isAlive: true,
				isAction: false,
			});
		})();

		this.werewolfJoin = (id, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const isStarted = data.gameStarted;
			const isJoined = data.playersData.some((v) => v.id === id);
			const isFull = data.playersData.length >= 7;
			if (isStarted) return { error: true, message: WEREWOLF_SCRIPTING.error.started };
			if (isJoined) return { error: true, message: WEREWOLF_SCRIPTING.error.joined };
			if (isFull) return { error: true, message: WEREWOLF_SCRIPTING.error.full };
			data.playersData.push({
				id,
				role: "",
				dialogue: "",
				isProtected: false,
				isAlive: true,
				isAction: false,
				isVoted: false,
			});
			return { error: false, message: WEREWOLF_SCRIPTING.success.join + data.playersData.length, mentions: data.playersData.map((v) => v.id) };
		};

		this.startGame = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const isStarted = data.gameStarted;
			const isRoomMaster = data.roomMaster === playerId;
			const isNotFull = data.playersData.length < 5;
			if (!isRoomMaster) return { error: true, message: WEREWOLF_SCRIPTING.error.notRoomMaster };
			if (isStarted) return { error: true, message: WEREWOLF_SCRIPTING.error.started };
			if (isNotFull) return { error: true, message: WEREWOLF_SCRIPTING.error.notEnoughPlayer + data.playersData.length };
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
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.filter((v) => v.id === playerId);
			if (player.length === 0) return;
			if (!player[0].isAlive) return false;
			return true;
		};

		this.checkRole = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.filter((v) => v.id === playerId);
			if (player.length === 0) return;
			return player[0].role;
		};

		this.killPlayerAsWerewolf = (playerId, playerIdKill, roomId) => {
			return this.checkValidKill(playerId, playerIdKill, roomId);
		};

		this.checkValidKill = (playerId, playerIdKill, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.findIndex((v) => v.id === playerId);
			if (player == -1) return;
			const playerKill = data.playersData.findIndex((v) => v.id === playerIdKill);
			if (playerKill == -1) return;
			if (data.playersData[player].role !== "werewolf") return { error: true, message: WEREWOLF_SCRIPTING.error.wrongRole.replace("{0}", "Werewolf").replace("{1}", player[0].role) };
			if (data.gameTimeCycle == "day") return { error: true, message: WEREWOLF_SCRIPTING.error.wrongTime.replace("{0}", "Malam Hari").replace("{1}", "Pagi Hari") };
			if (!data.playersData[player].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
			if (data.playersData[playerKill].role === "werewolf") return { error: true, message: WEREWOLF_SCRIPTING.error.wrongKill };
			if (!data.playersData[playerKill].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead };
			if (data.playersData[player].isAction) return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyAction };
			if (data.playersData[playerKill].isProtected) {
				data.playersData[player].isAction = true;
				return {
					error: true,
					message: WEREWOLF_SCRIPTING.error.protected,
					data: {
						playerTriedToGetKilled: data.playersData[playerKill].id,
						playerTryingToKill: data.playersData[player].id,
					},
					mentions: [data.playersData[player].id],
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
					message: `${WEREWOLF_SCRIPTING.success.killWerewolf}@${data.playersData[playerKill].id.split("@")[0]}`,
					mentions: [data.playersData[playerKill].id],
					data: {
						playerTriedToGetKilled: data.playersData[playerKill].id,
						messageToSend: WEREWOLF_SCRIPTING.success.killedByWerewolf,
					},
				};
			}
			return { error: true, message: "Player is already dead" };
		};

		this.seerSomeone = (playerId, playerIdSeer, roomId) => {
			return this.checkValidSeer(playerId, playerIdSeer, roomId);
		};

		this.checkValidSeer = (playerId, playerIdSeer, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.findIndex((v) => v.id === playerId);
			if (player == -1) return;
			const playerSeer = data.playersData.findIndex((v) => v.id === playerIdSeer);
			if (playerSeer == -1) return;
			if (data.playersData[player].role !== "seer")
				return { error: true, message: WEREWOLF_SCRIPTING.error.wrongRole.replace("{0}", "Seer").replace("{1}", data.playersData[player].role) };
			if (data.gameTimeCycle == "day") return { error: true, message: WEREWOLF_SCRIPTING.error.wrongTime.replace("{0}", "Malam Hari").replace("{1}", "Pagi Hari") };
			if (!data.playersData[player].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
			if (data.playersData[player].isAction) return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyAction };
			if (!data.playersData[playerSeer].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead };
			data.playersData[player].isAction = true;
			client[botNum].ev.emit("werewolf.action", {
				error: false,
				playerId,
				playerActioned: playerIdSeer,
				roomId,
				message: data.randomSeer(data.playersData[playerSeer].role, data.playersData[playerSeer].id),
			});
		};

		this.voteSomeone = (playerId, playerIdVoted, roomId) => {
			return this.checkValidVote(playerId, playerIdVoted, roomId);
		};

		this.checkValidVote = (playerId, playerIdVoted, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.findIndex((v) => v.id === playerId);
			if (player == -1) return;
			const playerVoted = data.playersData.findIndex((v) => v.id === playerIdVoted);
			if (playerVoted == -1) return;
			if (!data.playersData[player].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.dead };
			if (data.playersData[player].isVoted) return { error: true, message: WEREWOLF_SCRIPTING.error.alreadyVoted };
			if (!data.playersData[playerVoted].isAlive) return { error: true, message: WEREWOLF_SCRIPTING.error.victimAlreadyDead };
			data.playersData[player].alreadyVoted = true;
			data.playerVoted.push(data.playersData[playerVoted]);
			return {
				error: false,
				message: WEREWOLF_SCRIPTING.success.voted,
				mentions: [data.playersData[playerVoted].id],
			};
		};

		this.exitGame = (playerId, roomId) => {
			const data = this.getDataGame(roomId);
			if (!data) return { error: true, message: WEREWOLF_SCRIPTING.error.noSessionExist };
			const player = data.playersData.findIndex((v) => v.id === playerId);
			if (player == -1) return;
			if (data.gameStarted) return { error: true, message: WEREWOLF_SCRIPTING.error.gameStarted };
			data.playersData.splice(player, 1);
			return {
				error: false,
				message: WEREWOLF_SCRIPTING.success.exit,
				mentions: [data.playersData[player].id],
			};
		};
	}

	randomSeer = (playerSeerRole, playerSeerId) => {
		if (playerSeerRole == "werewolf") {
			const dialogue = WEREWOLF_SCRIPTING.success.seer.guessing;
			return dialogue[Math.floor(Math.random() * dialogue.length)].replace("{0}", `@${playerSeerId.split("@")[0]}`).replace("{1}", playerSeerRole);
		} else {
			const dialogue = shuffleArray([...WEREWOLF_SCRIPTING.characterInAction.seer.guessing, ...WEREWOLF_SCRIPTING.characterInAction.seer.notGuessing]);
			return dialogue.replace("{0}", `@${playerSeerId.split("@")[0]}`).replace("{1}", playerSeerRole);
		}
	};

	startGameCycle = (roomId, timer) => {
		const data = this.getDataGame(roomId);
		if (!data) return;
		const isStarted = data.gameStarted;
		if (!isStarted) return;
		const timers = data.gameTime;
		data.gameCycler = setTimeout((timerly = timer) => {
			const dataGame = this.getDataGame(roomId);
			if (!dataGame) return;
			if (dataGame.gameTimeCycle == "day") {
				let peopleKilledMention = [];
				let message = WEREWOLF_SCRIPTING.dayTime.noKill;
				const isSomeoneKilled = dataGame.playersKilled.length > 0;
				timerly = "evening";
				dataGame.gameTimeCycle = timerly;
				dataGame.firstNight = false;
				if (isSomeoneKilled) {
					const peopleKilled = dataGame.playerKilled.map((v) => `${v.id.split("@")[0]}`).join("\n");
					peopleKilledMention = dataGame.playerKilled.map((v) => v.id);
					if (dataGame.playersD) message = WEREWOLF_SCRIPTING.dayTime.kill.replace("{0}", peopleKilled);
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
					dataGame.playersKilled = [];
				}
				this.startGameCycle(roomId, timer);
				client[botNum].ev.emit("werewolf.cycle", { error: false, peopleKilledMention, message, id: dataGame.roomId, ...client });
			} else if (dataGame.gameTimeCycle == "evening") {
				if (!dataGame) return;
				let message;
				if (dataGame.gameAfk == 3) {
					message = WEREWOLF_SCRIPTING.error.afk[Math.floor(Math.random() * WEREWOLF_SCRIPTING.error.afk.length)];
					dataGame.delete(roomId);
					return client[botNum].ev.emit("werewolf.cycle", { error: true, message, id: dataGame.roomId, ...client });
				}
				timerly = "voting";
				dataGame.gameTimeCycle = timerly;
				message = WEREWOLF_SCRIPTING.dayTime.voting[Math.floor(Math.random() * WEREWOLF_SCRIPTING.dayTime.voting.length)];
				this.startGameCycle(roomId, timer);
				client[botNum].ev.emit("werewolf.cycle", { error: false, message, id: dataGame.roomId, ...client });
			} else if (dataGame.gameTimeCycle == "voting") {
				if (!dataGame) return;
				let message;
				const voters = dataGame.playersData.filter((v) => v.isVoted);
				const isVoting = voters.length > 0;
				if (isVoting) {
					const peopleVoted = dataGame.shortVoters(roomId);
					const ids = Object.entries(peopleVoted);
					const isDraw = ids[0][1].length == ids[1][1].length;
					if (isDraw) {
						message = WEREWOLF_SCRIPTING.lynchDraws[Math.floor(Math.random() * WEREWOLF_SCRIPTING.lynchDraws.length)];
						timerly = "night";
					}
				} else {
					message = WEREWOLF_SCRIPTING.lynchNoOne;
					dataGame.gameAfk++;
				}
				this.startGameCycle(roomId, timer);
				client[botNum].ev.emit("werewolf.cycle", { error: false, playerVotedMention, message, id: dataGame.roomId, ...client });
			} else if (dataGame.gameTimeCycle == "night") {
				dataGame.gameTimeCycle = "day";
				this.startGameCycle(roomId);
				const message = WEREWOLF_SCRIPTING.nightTime[Math.floor(Math.random() * WEREWOLF_SCRIPTING.nightTime.length)];
				client[botNum].ev.emit("werewolf.cycle", { error: false, ...(dataGame.firstNight ? {} : message), ...client, id: dataGame.roomId });
			}
		}, timers * 1000);
	};

	randomizeRole() {
		let roles = [];
		const shuffled = shuffleArray(this.playersData);
		if (shuffled.length === 7) {
			roles = ["villager", "villager", "werewolf", "villager", "werewolf", "villager", "seer"];
		} else if (shuffled.length === 6) {
			roles = ["villager", "villager", "werewolf", "villager", "werewolf", "seer"];
		} else {
			roles = ["villager", "villager", "werewolf", "villager", "seer"];
		}
		shuffled.forEach((v, i) => (v.role = roles[i]));
		return shuffled;
	}

	shortVoters = (roomId) => {
		const data = this.getDataGame(roomId);
		if (!data) return;
		const voters = data.playerVoted;
		const sorted = {};
		voters.forEach((v) => {
			if (sorted[v.key]) {
				sorted[v.key].push(v.value);
			} else {
				sorted[v.key] = [v.value];
			}
		});
		return { error: false, sorted };
	};
	randomizeDialogue(roomId) {
		const data = this.getDataGame(roomId);
		if (!data) return;
		return WEREWOLF_SCRIPTING.nightTime[Math.floor(Math.random() * WEREWOLF_SCRIPTING.nightTime.length)];
	}

	getDataGame(roomId) {
		const data = games.werewolf.get(roomId);
		if (data === undefined) return false;
		return data;
	}
}
