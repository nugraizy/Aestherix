import { array, boolean, mixed, number, object, string } from 'yup';

const schema = object({
	name: string().required(),
	minifiedDescription: string().optional().default('This is minified description'),
	description: string().optional(),
	category: string()
		.oneOf([
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
		])
		.required(),
	usage: string().required(),
	aliases: array(string()).default([]).optional(),
	cooldown: number().integer().min(0).required(),
	limit: number().integer().min(0).required(),
	status: string().oneOf(['enable', 'disable']).required(),
	restrict: boolean().default(false).optional(),
	premium: boolean().default(false).optional(),
	run: mixed()
		.test({
			test: (value) => typeof value === 'function',
			message: 'Run must be a function',
			name: 'run'
		})
		.required()
});

export class ModuleError extends Error {
	constructor(message) {
		super(message);

		this.name = this.constructor.name;
		this.info = this.name + ': ' + message.message.split('\n')[0];
		Error.captureStackTrace(this, this.constructor);
	}
}

export const isMissingProperty = (data) => {
	try {
		const validate = schema.validateSync(data);

		return validate;
	} catch (error) {
		throw new ModuleError(error);
	}
};
