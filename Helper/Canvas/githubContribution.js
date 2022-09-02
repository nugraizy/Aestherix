import Canvas from "canvas";
import jsSplit from "js-split";
import { fetchTEXT, cheerioLOAD } from "../Modules/index.js";
const { createCanvas, registerFont } = Canvas;

export class GithubGraph {
	constructor() {
		this._themes = {
			DEFAULT: {
				GENERAL: ["#FFFFFF", "#8B6CFA", "rgba(175,143,251,0.3)", "#245278", "rgba(108, 122, 137, 0.3)"],
				GRAPH: ["#9BB1DA", "#668ADA", "#4771DA", "#1E53D9", "#012D5E"],
			},
			DRACULA: {
				GENERAL: ["#282A36", "#F8F8F2", "#FF79C6", "#50FA7B", "rgba(239, 239, 240, 0.3)"],
				GRAPH: ["#1E1738", "#503E69", "#745A99", "#BD36F9", "#FF79C6"],
			},
		};
		this._username = null;
		this._theme = null;
		this._api = null;
		this.canvas = null;
		this.ctx = null;

		this.init = async (username, theme) => {
			if (!username) {
				throw new Error("Username is required.");
			}

			this._username = username;
			this._theme = this._themes[theme || "DEFAULT"];

			this._api = new API(this._username, this._theme);

			if (this.canvas || this.ctx) {
				throw new Error("GitHub Graph already been initialized.");
			}

			if (!this.canvas || !this.ctx) {
				await this.initCanvas();
			}

			return this;
		};

		this.createLines = (opts) => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			if (typeof opts !== "object" && opts) {
				const err = `Expected opts to be Object. Got : ${typeof opts}`;
				throw new Error(err);
			}

			if (!opts) {
				opts = {};
			}

			if (!opts.round) {
				opts.round = false;
			}

			const strokeLine = (x, y, x1, y1, round) => {
				this.ctx.beginPath();
				this.ctx.moveTo(x, y);
				this.ctx.lineTo(x1, y1);
				this.ctx.strokeStyle = this._theme.GENERAL[2];
				this.ctx.lineWidth = 4;
				this.ctx.lineCap = round ? "round" : "butt";
				this.ctx.stroke();
				this.ctx.closePath();
			};

			strokeLine(70, 200, this.canvas.width - 130, 200, opts.round);
			return this;
		};

		this.fillBackground = () => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			this.ctx.fillStyle = this._theme.GENERAL[0];
			this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
			return this;
		};

		this.textHeaders = async (opts) => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			this.ctx.fillStyle = this._theme.GENERAL[1];
			this.ctx.font = "72px ibm";
			this.ctx.fillText(`@${this._username} Contribution`, 60, 150, this.canvas.width - 130);
			this.ctx.font = "32px ibm";
			this.ctx.fillText(`Less`, this.canvas.width - 497, 150, this.canvas.width - 1300);
			this.ctx.fillText(`More`, this.canvas.width - 220, 150, this.canvas.width - 400);
			this.activitySchedule(opts);
			await this.dates(opts);
			return this;
		};

		this.calendars = (month, y, data, opts) => {
			if (!this.canvas || !this.ctx) {
				throw new Error("Need initialization. Call .init() first.");
			}

			const dim = this.calculateDates();
			const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			this.ctx.font = "32px ibm";
			this.ctx.fillStyle = this._theme.GENERAL[3];
			this.ctx.fillText(`${data.year} : ${data.totContributionsInYear} Contribution`, 70, y - 50, this.canvas.width - 130);
			this.fillLineInBetween(70, y + 400, this.canvas.width - 120, y + 400);

			for (let i = 0; i < month; i++) {
				let multiple = y + 40;
				let h = 50;
				for (let j = 0; j < data.days.slice(1).length; j++) {
					if (data.days[j]) {
						this.activityColor(h, multiple, data.days[j].color, opts);
						if (!String(j / 7).includes(".")) {
							h += 40;
							multiple = y + 40;
							continue;
						}
					}
					if (String(j / 7).includes(".")) {
						multiple += 40;
					}
				}
				this.ctx.fillStyle = this._theme.GENERAL[3];
				this.ctx.font = "22px ibm";
				this.ctx.fillText(months[i], dim[i][Math.round(dim[i].length / 2)] - 30, y, this.canvas.width - 120);
			}
		};

		this.fillLineInBetween = (x, y, x1, y1) => {
			this.ctx.beginPath();
			this.ctx.moveTo(x, y);
			this.ctx.lineTo(x1, y1);
			this.ctx.strokeStyle = this._theme.GENERAL[4];
			this.ctx.lineWidth = 2;
			this.ctx.lineCap = "round";
			this.ctx.stroke();
			this.ctx.closePath();
			return this;
		};

		this.activityColor = (x, y, color, opts) => {
			if (typeof opts !== "object" && opts) {
				const err = `Expected opts to be Object. Got : ${typeof opts}`;
				throw new Error(err);
			}

			if (!opts) {
				opts = {};
			}

			if (!opts.round) {
				opts.round = false;
			}

			this.ctx.fillStyle = color;

			if (opts.round) {
				this.round(x, y, 30, 30, 5);
			} else {
				this.ctx.fillRect(x, y, 30, 30);
			}
		};

		this.activitySchedule = (opts) => {
			if (typeof opts !== "object" && opts) {
				const err = `Expected opts to be Object. Got : ${typeof opts}`;
				throw new Error(err);
			}

			if (!opts) {
				opts = {};
			}

			if (!opts.round) {
				opts.round = false;
			}

			let multiple = 34;
			for (const color of this._theme.GRAPH) {
				this.ctx.fillStyle = color;
				if (opts.round) {
					this.round(this.canvas.width - 440 + multiple, 120, 30, 30, 5);
				} else {
					this.ctx.fillRect(this.canvas.width - 1300 + multiple, 245, 30, 30);
				}
				multiple += 34;
			}
		};

		this.dates = async (opts) => {
			const dates = await this._api.fetchDates();
			const arr = [];
			for (const { dates: date, year } of dates) {
				const data = await this._api.getTotalContribution(date, year);
				arr.push(data);
			}

			let i = 290;
			for (const data of arr) {
				this.calendars(data.month, i, data, opts);
				i += 550;
			}
		};
	}

	calculateDates() {
		const { width } = this.canvas;
		const calculated = width / 12;
		const arr = [];
		for (let i = 1; i < width; i++) {
			arr.push(i);
		}
		return jsSplit(arr, calculated);
	}

	async calculateDimension() {
		const data = await this._api.fetchTotalYears();
		const width = 1080 * 2;
		let height = 290;
		for (let i = 0; i < data; i++) {
			if (data > 1) {
				height += 550;
			}
		}
		return [width, height];
	}

	async initCanvas() {
		const dimension = await this.calculateDimension();
		registerFont("./Media Files/Fonts/IBM.ttf", { family: "ibm" });
		this.canvas = createCanvas(dimension[0], dimension[1]);
		this.ctx = this.canvas.getContext("2d");
	}

	round(x, y, w, h, radius) {
		const r = x + w;
		const b = y + h;
		this.ctx.beginPath();
		this.ctx.moveTo(x + radius, y);
		this.ctx.lineTo(r - radius, y);
		this.ctx.quadraticCurveTo(r, y, r, y + radius);
		this.ctx.lineTo(r, y + h - radius);
		this.ctx.quadraticCurveTo(r, b, r - radius, b);
		this.ctx.lineTo(x + radius, b);
		this.ctx.quadraticCurveTo(x, b, x, b - radius);
		this.ctx.lineTo(x, y + radius);
		this.ctx.quadraticCurveTo(x, y, x + radius, y);
		this.ctx.fill();
	}

	toBuffer() {
		return this.canvas.toBuffer();
	}
}

class API {
	constructor(username, theme) {
		this._username = username;

		this.fetchDates = async () => {
			const $ = await this.req(`/${this._username}`);
			const date = $(".js-year-link").get();
			if (!date) {
				throw new Error("Username not found or privated their activity");
			}
			return date.map((el) => {
				el = $(el);
				const dates = el.attr("href");
				return {
					dates,
					year: parseInt(el.text()),
				};
			});
		};

		this.fetchTotalYears = async () => {
			return (await this.fetchDates()).length;
		};

		this.getTotalContribution = async (path, year) => {
			const data = await this.req(path);
			const totContributionsInYear = data(".js-yearly-contributions h2")
				.text()
				.trim()
				.match(/^([0-9,]+)\s/)[1];
			const dates = {
				startYear: data("g > g:nth-child(1)").find("rect").get().length,
				endYear: data(`g > g:nth-child(${data("g > g").length})`)
					.find("rect")
					.get().length,
			};
			const firstWeekOfFirstMonth = 8 - dates.startYear;
			const lastWeekOfLastMonth = 8 - dates.endYear;
			return {
				totContributionsInYear,
				firstWeekOfFirstMonth,
				lastWeekOfLastMonth,
				year,
				month: Math.round(
					parseInt(
						data(`g > g:nth-child(${data("g > g").length})`)
							.find("rect")
							.attr("data-date")
							.split("-")[1],
					),
				),
				days: [...new Array(firstWeekOfFirstMonth).fill(undefined), ...data("g").find("rect").get()].map((v, i) => {
					if (v && data("g").find("rect").get().length - lastWeekOfLastMonth > i) {
						const level = parseInt(data(v).attr("data-level"));
						const month = Math.round(parseInt(data(v).attr("data-date").split("-")[1]));
						return {
							level,
							month,
							totalContri: parseInt(data(v).attr("data-count")),
							color: theme.GRAPH[level],
						};
					}
					return undefined;
				}),
			};
		};
	}
	async req(param) {
		try {
			const data = await fetchTEXT(`https://github.com${param}`);
			if (data.includes("Not Found")) {
				throw new Error("User not found");
			}

			if (data.includes("activity is private")) {
				throw new Error("User not found");
			}

			return cheerioLOAD(data);
		} catch (err) {
			throw new Error("Something went wrong");
		}
	}
}
