import Canvas from '@napi-rs/canvas';
import chroma from 'chroma-js';
import path from 'path';
import { Client } from 'undici';
import { fileURLToPath } from 'url';

import { BOT_NAME } from '../../core/constants.js';
import { createMeshGradient } from '../../utils/converter/mesh-gradient.js';
import { graphThemes } from './utils/themes.js';

function chunk(array, size) {
	const result = [];

	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}

	return result;
}

const getCopyright = () => `© 2026 Hidden Finder, Inc | Made by ${BOT_NAME ?? 'Bot'} using Canvas Module.`;

const { createCanvas, GlobalFonts, loadImage } = Canvas;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

GlobalFonts.registerFromPath(path.join(__dirname, '../../media/fonts/IBM.ttf'), 'ibm');

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

class GitHubAPI {
	#username;
	#theme;
	#client;
	#token;
	#dates = null;

	constructor(username, theme, token = process.env.GITHUB_AUTH_TOKEN) {
		this.#username = username;
		this.#theme = theme;
		this.#client = new Client('https://api.github.com');
		this.#token = token;
	}

	async #graphql(query) {
		const { body } = await this.#client.request({
			method: 'POST',
			path: '/graphql',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'nugraizy',
				Authorization: `Bearer ${this.#token}`
			},
			body: JSON.stringify({ query })
		});

		return body.json();
	}

	async fetchDates() {
		if (this.#dates) {
			return this.#dates;
		}

		const json = await this.#graphql(graphQl(this.#username, { type: 'YEARLY' }));
		const started = new Date(json.data.user.createdAt).getFullYear();
		const currentYear = new Date().getFullYear();

		const years = Array.from({ length: currentYear - started + 1 }, (_, i) => {
			const year = started + i;

			return { dates: new Date(Date.UTC(year, 0, 1)).toISOString(), year };
		});

		this.#dates = { started, dates: years };

		return this.#dates;
	}

	parseDays(data) {
		const firstWeekLen = data.weeks[0].contributionDays.length;
		const lastWeekLen = data.weeks[data.weeks.length - 1].contributionDays.length;

		const LEVEL_MAP = {
			NONE: 0,
			FIRST_QUARTILE: 1,
			SECOND_QUARTILE: 2,
			THIRD_QUARTILE: 3,
			FOURTH_QUARTILE: 4
		};

		const container = {
			year: null,
			month: data.months.length,
			totContributionsInYear: data.totalContributions,
			firstWeekOfFirstMonth: firstWeekLen,
			lastWeekOfLastMonth: lastWeekLen,
			days: [...Array(7 - firstWeekLen).fill(undefined)]
		};

		for (const week of data.weeks) {
			for (const day of week.contributionDays) {
				const [year, month, dayNum] = day.date.split('-');
				const level = LEVEL_MAP[day.contributionLevel] ?? 5;

				container.year = year;
				container.days.push({
					day: dayNum,
					month,
					color: this.#theme[level],
					level,
					totalContri: day.contributionCount
				});
			}
		}

		container.days.push(...Array(7 - lastWeekLen).fill(undefined));

		return container;
	}

	async getTotalContribution() {
		const { dates } = await this.fetchDates();

		const results = await Promise.all(
			dates.map(async ({ dates: dateStr }) => {
				const date = new Date(dateStr);

				date.setMonth(0);
				date.setDate(1);

				const to = new Date(Date.UTC(date.getFullYear(), 11));

				to.setDate(getLastDateOfMonth(date.getFullYear(), 12));

				const { data } = await this.#graphql(
					graphQl(this.#username, { type: 'CONTRIBUTIONS', from: date.toISOString(), to: to.toISOString() })
				);

				return this.parseDays(data.user?.contributionsCollection?.contributionCalendar);
			})
		);

		return results;
	}
}

export class GitHubGraph {
	/**
	 * @private
	 */
	#_themes = graphThemes;
	#_cachedDim = null;

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

	/**
	 * @private
	 */
	#_backgroundMesh = false;

	constructor() {
		this.themes = this.#_themes;
		/**
		 * @type {import('../../types/Canvas/index.js').GithubGraph<Omit<GitHubGraph, 'init' | 'createGitHubGraph'>>}
		 */
		this.createGitHubGraph = () => {
			return this._createGitHubGraph();
		};

		/**
		 * @type {import('../../types/Canvas/index.js').InitGithubGraph<Omit<GitHubGraph, 'init'>>}
		 */
		this.init = (username, { theme = 'DEFAULT', round = false, backgroundMesh = false } = {}) => {
			return this._init(username, { theme, round, backgroundMesh });
		};

		/**
		 * @type {import('../../types/Canvas/index.js').BufferGraph}
		 */
		this.toBuffer = () => {
			return this._toBuffer();
		};
	}

	/**
	 * @private
	 */
	async _createGitHubGraph() {
		await (await this._fillBackground())
			._createLines({ round: this.#_optsRound })
			._placeCopyright()
			._placeIcons()
			._textHeaders();

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
	async _init(username, { theme, round, backgroundMesh }) {
		if (!username) {
			throw new Error('Username is required.');
		}

		this.#_username = username;
		this.#_theme = this.#_themes[theme];
		this.#_optsRound = round;
		this.#_backgroundMesh = backgroundMesh;
		this.#_api = new GitHubAPI(this.#_username, this.#_theme.graph);

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
		this.#_ctx.fillStyle = this.#_theme.text;
		this.#_ctx.fillText(String(data.totContributionsInYear), 70, yPos - 50, this.#_canvas.width - 130);

		this.#_ctx.fillStyle = this.#_theme.accent;
		this.#_ctx.fillText(
			` Contribution in ${data.year}`,
			70 + this.#_ctx.measureText(String(data.totContributionsInYear)).width,
			yPos - 50,
			this.#_canvas.width - 130
		);
		this._fillLineInBetween(70, yPos + 400, this.#_canvas.width - 120, yPos + 400);

		const colorBatches = new Map();

		let h = 25;
		let multiple = yPos + 40;

		for (let j = 0; j < data.days.length; j++) {
			if (data.days[j]) {
				const color = data.days[j].color;

				if (!colorBatches.has(color)) {
					colorBatches.set(color, []);
				}

				colorBatches.get(color).push([h, multiple]);
			}

			multiple += 40;

			if ((j + 1) % 7 === 0) {
				multiple = yPos + 40;
				h += 40;
			}
		}

		for (const [color, rects] of colorBatches) {
			this.#_ctx.fillStyle = color;

			for (const [x, y] of rects) {
				this.#_ctx.fillRect(x, y, 30, 30);
			}
		}

		this.#_ctx.fillStyle = this.#_theme.text;
		this.#_ctx.font = '22px ibm';

		for (let i = 0; i < months; i++) {
			this.#_ctx.fillText(monthsAbbreviations[i], dim[i][Math.round(dim[i].length / 2)] - 30, yPos, this.#_canvas.width - 120);
		}
	}

	/**
	 * @private
	 */
	_calculateDates() {
		if (this.#_cachedDim) {
			return this.#_cachedDim;
		}

		const { width } = this.#_canvas;
		const calculated = width / 12;
		const arr = [];

		for (let i = 1; i < width; i++) {
			arr.push(i);
		}

		this.#_cachedDim = chunk(arr, calculated);

		return this.#_cachedDim;
	}

	/**
	 * @private
	 */
	_fillLineInBetween(x, y, x1, y1) {
		this.#_ctx.beginPath();

		this.#_ctx.moveTo(x, y);
		this.#_ctx.lineTo(x1, y1);

		this.#_ctx.strokeStyle = this.#_theme.border;
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
	async _fillBackground() {
		if (this.#_backgroundMesh) {
			const meshColors = this.#_theme.graph.slice(1).map((color) => chroma(color).darken(1).hex());
			const meshBuffer = await createMeshGradient({
				colors: meshColors,
				width: this.#_canvas.width,
				height: this.#_canvas.height,
				seed: Math.floor(Math.random() * 1000)
			});
			const image = await loadImage(meshBuffer);

			this.#_ctx.drawImage(image, 0, 0, this.#_canvas.width, this.#_canvas.height);
		} else {
			this.#_ctx.fillStyle = this.#_theme.background;
			this.#_ctx.fillRect(0, 0, this.#_canvas.width, this.#_canvas.height);
		}

		return this;
	}

	/**
	 * @private
	 */
	_placeCopyright(watermark = getCopyright()) {
		this.#_ctx.fillStyle = this.#_theme.text;
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
			this.#_ctx.strokeStyle = this.#_theme.accentFaded;
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
		this.#_ctx.fillStyle = this.#_theme.accent;
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

		for (const color of this.#_theme.graph) {
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
