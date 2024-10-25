import { object, string, array, number, boolean, mixed } from 'yup';

const random = () => ~~(Math.random() * 10);

const schema = object({
	name: string(),
	minifiedDescription: string().optional().default('This is minified description'),
	description: string().optional(),
	category: string().oneOf([
		'AI',
		'AL-Quran',
		'Anime',
		'Anonymous',
		'Converter',
		'Debugging',
		'Downloader',
		'Games',
		'Genshin Impact',
		'Helper',
		'Look-up',
		'Misc',
		'Moderation',
		'News',
		'Owner',
		'Search'
	]),
	usage: string(),
	aliases: array(string()),
	cooldown: number().integer().min(0).default(random),
	limit: number().integer().min(0).default(random),
	status: string().oneOf(['enable', 'disable']),
	restrict: boolean(),
	premium: boolean(),
	run: mixed()
		.test({
			test: (value) => typeof value === 'function',
			message: 'Run must be a function',
			name: 'run'
		})
		.default(() => {})
});

export class ModuleError extends Error {
	constructor(message) {
		super(message);

		this.name = this.constructor.name;
		this.info = this.name + ': ' + message.message.split('\n')[0];
		Error.captureStackTrace(this, this.constructor);
	}
}

export const isMissingProperty = async (data) => {
	try {
		const validate = await schema.validate(data);

		return validate;
	} catch (error) {
		throw new ModuleError(error);
	}
};
