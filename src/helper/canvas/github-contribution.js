import Canvas from '@napi-rs/canvas';
import _ from 'lodash';
import path from 'path';
import { Client } from 'undici';

const copyright = '© 2022 Hidden Finder, Inc | Made by Aestherix using Canvas Module.';

const { createCanvas, GlobalFonts, loadImage } = Canvas;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/IBM.ttf'), 'ibm');

/* eslint-disable-next-line */
const [icons_1, signature_1, icons_2, signature_2] = await Promise.all([
	loadImage('./src/media/assets/1_icon_github.png'),
	loadImage('./src/media/assets/1_icon_github_signature.png'),
	loadImage('./src/media/assets/2_icon_github.png'),
	loadImage('./src/media/assets/2_icon_github_signature.png')
]);

const graphQl = (username, { type, from, to }) => {
	if (type === 'YEARLY') {
		return `query {
					user(login: "${username}") {
						createdAt
					}
				}`;
	} else if (type === 'CONTRIBUTIONS') {
		return `query { 
					user(login: "${username}") {
	  					contributionsCollection(from: "${from}", to: "${to}") {
							contributionCalendar {
		  						totalContributions
		  						weeks {
									contributionDays {
			  							weekday
			  							date 
			  							contributionCount 
			  							color
              							contributionLevel
									}
		  						}
		  						months {
									name
			  						year
			  						firstDay
									totalWeeks
		  						}
							}
	  					}
					}
  				}`;
	}
};

const getLastDateOfMonth = (year, month) => {
	const nextMonthFirstDay = new Date(year, month, 1);

	const lastDate = new Date(nextMonthFirstDay - 1);

	return lastDate.getDate();
};

class API {
	constructor(username, theme) {
		this.username = username;
		this.theme = theme.GRAPH;
		this.dates = null;
		this.client = new Client('https://api.github.com');

		this.fetchDates = async () => {
			if (this.dates) {
				return this.dates;
			}

			const { body: $body1 } = await this.client.request({
				method: 'POST',
				path: '/graphql',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'nugraizy',
					Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
				},
				body: JSON.stringify({
					query: graphQl(username, { type: 'YEARLY' })
				})
			});

			const json = await $body1.json();

			const started = new Date(json.data.user.createdAt).getFullYear();

			const currentYear = new Date().getFullYear();
			const years = Array.from({ length: currentYear - started + 1 }, (_, i) => {
				const year = started + i;
				const date = new Date(Date.UTC(year, 0, 1));

				return {
					dates: date.toISOString(),
					year: year
				};
			});

			const dates = {
				started,
				dates: years
			};

			this.dates = dates;

			return dates;
		};

		this.parseDays = (data, theme) => {
			const firstWeekOfFirstMonth = data.weeks[0].contributionDays.length;
			const lastWeekOfLastMonth = data.weeks[data.weeks.length - 1].contributionDays.length;

			const container = {
				year: null,
				month: data.months.length,
				totContributionsInYear: data.totalContributions,
				firstWeekOfFirstMonth,
				lastWeekOfLastMonth,
				days: [...Array(7 - firstWeekOfFirstMonth).fill(undefined)]
			};

			data.weeks.forEach((item) => {
				const { contributionDays } = item;

				contributionDays.forEach((item2) => {
					const [year, month, day] = item2.date.split('-');
					const level =
						item2.contributionLevel === 'NONE'
							? 0
							: item2.contributionLevel === 'FIRST_QUARTILE'
								? 1
								: item2.contributionLevel === 'SECOND_QUARTILE'
									? 2
									: item2.contributionLevel === 'THIRD_QUARTILE'
										? 3
										: item2.contributionLevel === 'FOURTH_QUARTILE'
											? 4
											: 5;

					container.year = year;

					container.days.push({
						day,
						month,
						color: theme[level],
						level,
						totalContri: item2.contributionCount
					});
				});
			});

			container.days.push(...Array(7 - lastWeekOfLastMonth).fill(undefined));

			return container;
		};

		this.getTotalContribution = async () => {
			const container = [];

			const $data1 = await this.fetchDates();

			for (let i = 0; i < $data1.dates.length; i++) {
				const date = new Date($data1.dates[i].dates);

				date.setMonth(0);
				date.setDate(1);

				const to = new Date(Date.UTC(date.getFullYear(), 11));

				to.setDate(getLastDateOfMonth(date.getFullYear(), 12));

				const { body: $body2 } = await this.client.request({
					method: 'POST',
					path: '/graphql',
					headers: {
						'Content-Type': 'application/json',
						'User-Agent': 'nugraizy',
						Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`
					},
					body: JSON.stringify({
						query: graphQl(username, {
							type: 'CONTRIBUTIONS',
							from: date.toISOString(),
							to: to.toISOString()
						})
					})
				});

				const { data: $data2 } = await $body2.json();

				container.push(this.parseDays($data2.user?.contributionsCollection?.contributionCalendar, this.theme));
			}

			return container;
		};
	}
}

export class GitHubGraph {
	/**
	 * @private
	 */
	#_themes = {
		DEFAULT: {
			isDark: false,
			GENERAL: ['#FFFFFF', '#8B6CFA', 'rgba(175,143,251,0.3)', '#245278', 'rgba(108, 122, 137, 0.3'],
			GRAPH: ['#9BB1DA', '#668ADA', '#4771DA', '#2E63C9', '#1E53D9']
		},
		DRACULA: {
			isDark: true,
			GENERAL: ['#282A36', '#F8F8F2', '#FF79C6', '#50FA7B', 'rgba(239, 239, 240, 0.3)'],
			GRAPH: ['#3A2648', '#5A3E78', '#7A56A8', '#9A6ED8', '#BD36F9']
		},
		GRUVBOX: {
			isDark: true,
			GENERAL: ['#282828', '#EBDBB2', '#FB4934', '#B8BB26', 'rgba(235, 219, 178, 0.3)'],
			GRAPH: ['#3C3836', '#6C5036', '#9C6836', '#CC8036', '#FABD2F']
		},
		SOLARIZED_LIGHT: {
			isDark: false,
			GENERAL: ['#FDF6E3', '#657B83', '#268BD2', '#859900', 'rgba(101, 123, 131, 0.3)'],
			GRAPH: ['#EEE8D5', '#C9D6A2', '#A3C46F', '#7DB23C', '#859900']
		},
		SOLARIZED_DARK: {
			isDark: true,
			GENERAL: ['#002B36', '#839496', '#268BD2', '#2AA198', 'rgba(131, 148, 150, 0.3)'],
			GRAPH: ['#073642', '#1C4C60', '#316680', '#4680A0', '#268BD2']
		},
		NORD: {
			isDark: true,
			GENERAL: ['#2E3440', '#D8DEE9', '#88C0D0', '#A3BE8C', 'rgba(216, 222, 233, 0.3)'],
			GRAPH: ['#3B4252', '#47556A', '#537882', '#5F9B9A', '#88C0D0']
		},
		MONOKAI: {
			isDark: true,
			GENERAL: ['#272822', '#F8F8F2', '#F92672', '#A6E22E', 'rgba(248, 248, 242, 0.3)'],
			GRAPH: ['#49483E', '#6D6553', '#918268', '#B59F7D', '#FD971F']
		},
		CATPPUCCIN_LATTE: {
			isDark: false,
			GENERAL: ['#EFF1F5', '#4C4F69', '#D20F39', '#40A02B', 'rgba(76, 79, 105, 0.3)'],
			GRAPH: ['#BCC0CC', '#95A2D0', '#6E84D4', '#4866D8', '#1E66F5']
		},
		CATPPUCCIN_FRAPPE: {
			isDark: true,
			GENERAL: ['#303446', '#C6D0F5', '#E78284', '#A6D189', 'rgba(198, 208, 245, 0.3)'],
			GRAPH: ['#51576D', '#6675A0', '#7B93D3', '#90B1F6', '#8CAAEE']
		},
		CATPPUCCIN_MACCHIATO: {
			isDark: true,
			GENERAL: ['#24273A', '#CAD3F5', '#ED8796', '#A6DA95', 'rgba(202, 211, 245, 0.3)'],
			GRAPH: ['#494D64', '#6475A0', '#7F9DDC', '#9AC5FF', '#8AADF4']
		},
		CATPPUCCIN_MOCHA: {
			isDark: true,
			GENERAL: ['#1E1E2E', '#CDD6F4', '#F38BA8', '#A6E3A1', 'rgba(205, 214, 244, 0.3)'],
			GRAPH: ['#45475A', '#5D6A90', '#759DC6', '#8DD0FC', '#89B4FA']
		},
		ROSE_PINE: {
			isDark: true,
			GENERAL: ['#191724', '#E0DEF4', '#EB6F92', '#9CCFD8', 'rgba(224, 222, 244, 0.3)'],
			GRAPH: ['#2A1E34', '#5A3E64', '#8A5E94', '#BA7EC4', '#EB6F92']
		},
		ROSE_PINE_MOON: {
			isDark: true,
			GENERAL: ['#232136', '#E0DEF4', '#EB6F92', '#3E8FB0', 'rgba(224, 222, 244, 0.3)'],
			GRAPH: ['#393552', '#59607C', '#799BA6', '#99D6D0', '#9CCFD8']
		},
		ROSE_PINE_DAWN: {
			isDark: false,
			GENERAL: ['#FAF4ED', '#575279', '#B4637A', '#56949F', 'rgba(87, 82, 121, 0.3)'],
			GRAPH: ['#F2E9E1', '#D9C0B6', '#C0978B', '#A86E60', '#B4637A']
		},

		CITY_LIGHTS: {
			isDark: true,
			GENERAL: ['#1D252C', '#A0B3C5', '#70A5EB', '#5CCFE6', 'rgba(160, 179, 197, 0.3)'],
			GRAPH: ['#2C3E50', '#3E5878', '#5072A0', '#628CC8', '#70A5EB']
		},

		SYNTHWAVE84: {
			isDark: true,
			GENERAL: ['#2B213A', '#F5F5F5', '#FF6B97', '#FAD000', 'rgba(245, 245, 245, 0.3)'],
			GRAPH: ['#602260', '#802280', '#A020A0', '#C020C0', '#FF6B97']
		},

		ONE_DARK: {
			isDark: true,
			GENERAL: ['#282C34', '#ABB2BF', '#E06C75', '#98C379', 'rgba(171, 178, 191, 0.3)'],
			GRAPH: ['#3E4451', '#51607A', '#657CA3', '#7998CC', '#61AFEF']
		},

		MATERIAL: {
			isDark: true,
			GENERAL: ['#263238', '#ECEFF1', '#FF5370', '#C3E88D', 'rgba(236, 239, 241, 0.3)'],
			GRAPH: ['#37474F', '#4E6173', '#657B97', '#7C95BB', '#82AAFF']
		},

		TOKYO_NIGHT: {
			isDark: true,
			GENERAL: ['#1A1B26', '#C0CAF5', '#F7768E', '#9ECE6A', 'rgba(192, 202, 245, 0.3)'],
			GRAPH: ['#24283B', '#38446A', '#4C6099', '#607CC8', '#7AA2F7']
		}
	};

	/**
	 * @private
	 */
	#_username = null;

	/**
	 * @private
	 */
	#_theme = null;

	/**
	 * @private
	 */
	#_optsRound = null;

	/**
	 * @private
	 */
	#_api = null;

	/**
	 * @private
	 */
	#_canvas = null;

	/**
	 * @private
	 */
	#_ctx = null;

	constructor() {
		this.themes = this.#_themes;
		/**
		 * @type {import('../../types/Canvas').GithubGraph<Omit<GitHubGraph, 'init' | 'createGitHubGraph'>>}
		 */
		this.createGitHubGraph = () => {
			return this._createGitHubGraph();
		};

		/**
		 * @type {import('../../types/Canvas').InitGithubGraph<Omit<GitHubGraph, 'init'>>}
		 */
		this.init = (username, { theme = 'DEFAULT', round = false } = {}) => {
			return this._init(username, { theme, round });
		};

		/**
		 * @type {import('../../types/Canvas').BufferGraph}
		 */
		this.toBuffer = () => {
			return this._toBuffer();
		};
	}

	/**
	 * @private
	 */
	async _createGitHubGraph() {
		await this._fillBackground()._createLines({ round: this.#_optsRound })._placeCopyright()._placeIcons()._textHeaders();

		const dates = await this.#_api.getTotalContribution();
		let yPos = 290;

		for (const data of dates) {
			this._drawCalendar(data.month, yPos, data);
			yPos += 550;
		}

		delete this.createGitHubGraph;

		return this;
	}

	/**
	 * @private
	 */
	async _init(username, { theme, round }) {
		if (!username) {
			throw new Error('Username is required.');
		}

		this.#_username = username;
		this.#_theme = this.#_themes[theme];
		this.#_optsRound = round;
		this.#_api = new API(this.#_username, this.#_theme);

		await this._initCanvas();

		delete this.init;

		return this;
	}

	/**
	 * @private
	 */
	async _initCanvas() {
		const dimension = await this._calculateDimension();

		this.#_canvas = createCanvas(dimension[0], dimension[1]);
		this.#_ctx = this.#_canvas.getContext('2d');
	}

	/**
	 * @private
	 */
	async _calculateDimension() {
		let height = 290;
		const width = 1080 * 2;

		const totalYears = await this.#_api.fetchDates();

		for (let i = 0; i < totalYears.dates.length; i++) {
			if (totalYears.dates.length > 1) {
				height += 550;
			}
		}

		return [width, height];
	}

	/**
	 * @private
	 */
	_drawCalendar(months, yPos, data) {
		const dim = this._calculateDates();
		const monthsAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		this.#_ctx.font = '32px ibm';
		this.#_ctx.fillStyle = this.#_theme.GENERAL[3];
		this.#_ctx.fillText(String(data.totContributionsInYear), 70, yPos - 50, this.#_canvas.width - 130);

		this.#_ctx.fillStyle = this.#_theme.GENERAL[1];
		this.#_ctx.fillText(
			` Contribution in ${data.year}`,
			70 + this.#_ctx.measureText(String(data.totContributionsInYear)).width,
			yPos - 50,
			this.#_canvas.width - 130
		);
		this._fillLineInBetween(70, yPos + 400, this.#_canvas.width - 120, yPos + 400);

		for (let i = 0; i < months; i++) {
			let h = 25;
			let multiple = yPos + 40;

			for (let j = 0; j < data.days.length; j++) {
				if (data.days[j]) {
					this._activityColor(h, multiple, data.days[j].color);
				}

				multiple += 40;

				if ((j + 1) % 7 === 0) {
					multiple = yPos + 40;
					h += 40;
				}
			}

			this.#_ctx.fillStyle = this.#_theme.GENERAL[3];
			this.#_ctx.font = '22px ibm';

			this.#_ctx.fillText(monthsAbbreviations[i], dim[i][Math.round(dim[i].length / 2)] - 30, yPos, this.#_canvas.width - 120);
		}
	}

	/**
	 * @private
	 */
	_calculateDates() {
		const { width } = this.#_canvas;
		const calculated = width / 12;
		const arr = [];

		for (let i = 1; i < width; i++) {
			arr.push(i);
		}

		return _.chunk(arr, calculated);
	}

	/**
	 * @private
	 */
	_fillLineInBetween(x, y, x1, y1) {
		this.#_ctx.beginPath();

		this.#_ctx.moveTo(x, y);
		this.#_ctx.lineTo(x1, y1);

		this.#_ctx.strokeStyle = this.#_theme.GENERAL[4];
		this.#_ctx.lineWidth = 2;
		this.#_ctx.lineCap = this.#_optsRound ? 'round' : 'butt';

		this.#_ctx.stroke();
		this.#_ctx.closePath();
	}

	/**
	 * @private
	 */
	_activityColor(x, y, color) {
		this.#_ctx.fillStyle = color;
		this.#_ctx.fillRect(x, y, 30, 30);
	}

	/**
	 * @private
	 */
	_fillBackground() {
		this.#_ctx.fillStyle = this.#_theme.GENERAL[0];
		this.#_ctx.fillRect(0, 0, this.#_canvas.width, this.#_canvas.height);
		return this;
	}

	/**
	 * @private
	 */
	_placeCopyright(watermark = copyright) {
		this.#_ctx.fillStyle = this.#_theme.GENERAL[3];
		this.#_ctx.font = '32px ibm';
		this.#_ctx.fillText(watermark, 145, this.#_canvas.height - 65, this.#_canvas.width - 130);
		return this;
	}

	/**
	 * @private
	 */
	_createLines() {
		const strokeLine = (x, y, x1, y1) => {
			this.#_ctx.beginPath();
			this.#_ctx.moveTo(x, y);
			this.#_ctx.lineTo(x1, y1);
			this.#_ctx.strokeStyle = this.#_theme.GENERAL[2];
			this.#_ctx.lineWidth = 4;
			this.#_ctx.lineCap = this.#_optsRound ? 'round' : 'butt';
			this.#_ctx.stroke();
			this.#_ctx.closePath();
		};

		strokeLine(70, 200, this.#_canvas.width - 130, 200);

		return this;
	}

	/**
	 * @private
	 */
	_placeIcons() {
		const color = this.#_theme.isDark ? '1' : '2';
		const icons = color === '1' ? icons_1 : icons_2; // eslint-disable-line
		const signature = color === '1' ? signature_1 : signature_2; // eslint-disable-line

		this.#_ctx.drawImage(icons, 70, this.#_canvas.height - 100, icons.width / 2.9, icons.height / 2.9);
		this.#_ctx.drawImage(
			signature,
			this.#_canvas.width - signature.width / 6.8 - 55,
			this.#_canvas.height - 100,
			signature.width / 6.8,
			signature.height / 6.8
		);

		return this;
	}

	/**
	 * @private
	 */
	async _textHeaders() {
		this.#_ctx.fillStyle = this.#_theme.GENERAL[1];
		this.#_ctx.font = '72px ibm';

		this.#_ctx.fillText(`@${this.#_username} Contribution`, 60, 150, this.#_canvas.width - 130);

		this.#_ctx.font = '32px ibm';

		this.#_ctx.fillText('Less', this.#_canvas.width - 497, 150, this.#_canvas.width - 1300);
		this.#_ctx.fillText('More', this.#_canvas.width - 220, 150, this.#_canvas.width - 400);

		this._activitySchedule();

		return this;
	}

	/**
	 * @private
	 */
	async _activitySchedule() {
		let multiple = 34;

		for (const color of this.#_theme.GRAPH) {
			this.#_ctx.fillStyle = color;

			if (this.#_optsRound) {
				this._round(this.#_canvas.width - 440 + multiple, 125, 30, 30, 5);
			} else {
				this.#_ctx.fillRect(this.#_canvas.width - 440 + multiple, 125, 30, 30);
			}

			multiple += 34;
		}
	}

	/**
	 * @private
	 */
	_round(x, y, w, h, radius) {
		const r = x + w;
		const b = y + h;

		this.#_ctx.beginPath();

		this.#_ctx.moveTo(x + radius, y);
		this.#_ctx.lineTo(r - radius, y);
		this.#_ctx.quadraticCurveTo(r, y, r, y + radius);
		this.#_ctx.lineTo(r, y + h - radius);
		this.#_ctx.quadraticCurveTo(r, b, r - radius, b);
		this.#_ctx.lineTo(x + radius, b);
		this.#_ctx.quadraticCurveTo(x, b, x, b - radius);
		this.#_ctx.lineTo(x, y + radius);
		this.#_ctx.quadraticCurveTo(x, y, x + radius, y);

		this.#_ctx.fill();
	}

	/**
	 * @private
	 */
	_toBuffer() {
		delete this._toBuffer;
		return this.#_canvas.toBuffer('image/png');
	}
}
