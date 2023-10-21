import Canvas from '@napi-rs/canvas';
import path from 'path';
import _ from 'lodash';
import { fetchTEXT, cheerioLOAD } from '../../utils/modules/index.js';

const copyright = '© 2022 Hidden Finder, Inc | Made by Nanda using Canvas Module.';

const { createCanvas, GlobalFonts, loadImage } = Canvas;

GlobalFonts.registerFromPath(path.join(__dirname, 'src/media/fonts/IBM.ttf'), 'ibm');

/* eslint-disable-next-line */
const [icons_1, signature_1, icons_2, signature_2] = await Promise.all([
	await loadImage('./src/media/assets/1_icon_github.png'),
	await loadImage('./src/media/assets/1_icon_github_signature.png'),
	await loadImage('./src/media/assets/2_icon_github.png'),
	await loadImage('./src/media/assets/2_icon_github_signature.png')
]);

export class GitHubGraph {
	/**
	 * @private
	 */
	#_themes = {
		DEFAULT: {
			isDark: false,
			GENERAL: ['#FFFFFF', '#8B6CFA', 'rgba(175,143,251,0.3)', '#245278', 'rgba(108, 122, 137, 0.3'],
			GRAPH: ['#9BB1DA', '#668ADA', '#4771DA', '#1E53D9', '#012D5E']
		},
		DRACULA: {
			isDark: true,
			GENERAL: ['#282A36', '#F8F8F2', '#FF79C6', '#50FA7B', 'rgba(239, 239, 240, 0.3)'],
			GRAPH: ['#1E1738', '#503E69', '#745A99', '#BD36F9', '#FF79C6']
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
		/**
		 * @type {import('../../types/Canvas').GithubGraph<Omit<GitHubGraph, 'init' | 'createGitHubGraph'>>}
		 */
		this.createGitHubGraph = () => {
			return this._createGitHubGraph();
		};

		/**
		 * @type {import('../../types/Canvas').InitGithubGraph<Omit<GitHubGraph, 'init'>>}
		 */
		this.init = (username, { theme, round } = { theme: 'DEFAULT', round: false }) => {
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

		const dates = await this.#_api.fetchDates();
		let yPos = 290;

		for (const { dates: date, year } of dates) {
			const data = await this.#_api.getTotalContribution(date, year);

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

		const totalYears = await this.#_api.fetchTotalYears();

		for (let i = 0; i < totalYears; i++) {
			if (totalYears > 1) {
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

		this.#_ctx.fillText(
			`${data.year} : ${data.totContributionsInYear} Contribution`,
			70,
			yPos - 50,
			this.#_canvas.width - 130
		);
		this._fillLineInBetween(70, yPos + 400, this.#_canvas.width - 120, yPos + 400);

		for (let i = 0; i < months; i++) {
			let multiple = yPos + 40;
			let h = 50;

			for (let j = 0; j < data.days.length; j++) {
				if (data.days[j]) {
					this._activityColor(h, multiple, data.days[j].color);

					if (!String(j / 7).includes('.')) {
						h += 40;
						multiple = yPos + 40;
						continue;
					}
				}

				if (String(j / 7).includes('.')) {
					multiple += 40;
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

		await this._dates();

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
				this._round(this.#_canvas.width - 440 + multiple, 12, 30, 30, 5);
			} else {
				this.#_ctx.fillRect(this.#_canvas.width - 440 + multiple, 125, 30, 30);
			}

			multiple += 34;
		}
	}

	/**
	 * @private
	 */
	async _dates() {
		let i = 290;
		const dates = await this.#_api.fetchDates();

		for (const { dates: date, year } of dates) {
			const data = await this.#_api.getTotalContribution(date, year);

			this._calendars(data.month, i, data);
			i += 550;
		}
	}

	/**
	 * @private
	 */
	_calendars(month, y, data) {
		const dim = this._calculateDates();
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

		this.#_ctx.font = '32px ibm';
		this.#_ctx.fillStyle = this.#_theme.GENERAL[3];

		this.#_ctx.fillText(`${data.year} : ${data.totContributionsInYear} Contribution`, 70, y - 50, this.#_canvas.width - 130);
		this._fillLineInBetween(70, y + 400, this.#_canvas.width - 120, y + 400);

		for (let i = 0; i < month; i++) {
			let multiple = y + 40;
			let h = 50;

			for (let j = 0; j < data.days.length; j++) {
				if (data.days[j]) {
					this._activityColor(h, multiple, data.days[j].color);

					if (!String(j / 7).includes('.')) {
						h += 40;
						multiple = y + 40;
						continue;
					}
				}

				if (String(j / 7).includes('.')) {
					multiple += 40;
				}
			}

			this.#_ctx.fillStyle = this.#_theme.GENERAL[3];
			this.#_ctx.font = '22px ibm';

			this.#_ctx.fillText(months[i], dim[i][Math.round(dim[i].length / 2)] - 30, y, this.#_canvas.width - 120);
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

class API {
	constructor(username, theme) {
		this.username = username;

		this.fetchDates = async () => {
			const $ = await this.request(`/${this.username}`);
			const date = $('.js-year-link').get();

			if (!date) {
				const err = 'Username not found or has private activity';

				throw new Error(err);
			}

			return date.map((el) => {
				el = $(el);
				const dates = el.attr('href');

				return {
					dates,
					year: parseInt(el.text())
				};
			});
		};

		this.fetchTotalYears = async () => {
			return (await this.fetchDates()).length;
		};

		this.getTotalContribution = async (path, year) => {
			const data = await this.request(path);

			const contributionsInYearTotal = data('.js-yearly-contributions > div.position-relative > h2.f4').text().trim();
			const parseTotal = contributionsInYearTotal.match(/^([0-9,]+)\s/)[1];

			const dates = {
				startYear: 0,
				endYear: 0
			};

			for (let i = 0; i < 7; i++) {
				const datesCalender = data(`table.ContributionCalendar-grid.js-calendar-graph-table > tbody > tr:nth-child(${i + 1})`);

				const index = datesCalender.find('td:not([class])').index();

				if (index !== -1) {
					if (index === 0) {
						dates.startYear += 1;
					} else {
						dates.endYear += 1;
					}
				}
			}

			const firstWeekOfFirstMonth = dates.startYear;
			const lastWeekOfLastMonth = dates.endYear;

			return {
				totContributionsInYear: parseTotal,
				firstWeekOfFirstMonth,
				lastWeekOfLastMonth,
				year,
				month: Math.round(
					parseInt(
						data(
							`tbody > tr:nth-child(1) > td.ContributionCalendar-day:nth-child(${
								data('tbody > tr:nth-child(1) > td.ContributionCalendar-day').get().length
							})`
						)
							.attr('data-date')
							.split('-')[1]
					)
				),
				days: [
					...new Array(firstWeekOfFirstMonth).fill(undefined),
					...data('tbody > tr > td.ContributionCalendar-day').get()
				].map((v, i) => {
					if (v && data('tbody > tr > td.ContributionCalendar-day').get().length - lastWeekOfLastMonth > i) {
						const level = parseInt(data(v).attr('data-level'));
						const month = Math.round(parseInt(data(v).attr('data-date').split('-')[1]));
						const contri = data(v).text();
						const totalContri = contri.startsWith('No contributions') ? 0 : parseInt(contri.match(/([0-9]+)/)[1]);

						return {
							level,
							month,
							totalContri,
							color: theme.GRAPH[level]
						};
					}

					return undefined;
				})
			};
		};
	}

	async request(param) {
		try {
			const data = await fetchTEXT(`https://github.com${param}`);

			if (data.includes('Not Found')) {
				const err = 'User not found';

				throw new Error(err);
			}

			if (data.includes('activity is private')) {
				const err = 'User has private activity';

				throw new Error(err);
			}

			return cheerioLOAD(data);
		} catch (err) {
			throw new Error(err);
		}
	}
}
