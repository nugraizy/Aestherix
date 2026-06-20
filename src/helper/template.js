import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_FILE = path.join(__dirname, '../../databases/templates.json');

let templates = new Map();

const loadTemplates = () => {
	try {
		if (fs.existsSync(TEMPLATES_FILE)) {
			const data = fs.readJsonSync(TEMPLATES_FILE);

			for (const [id, template] of Object.entries(data)) {
				templates.set(id, template);
			}
		}
	} catch {
		templates = new Map();
	}
};

const saveTemplates = () => {
	try {
		const data = Object.fromEntries(templates);

		fs.writeJsonSync(TEMPLATES_FILE, data, { spaces: '\t' });
	} catch (error) {
		console.error('Failed to save templates:', error.message);
	}
};

const generateId = () => {
	return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
};

export const templateManager = {
	init: () => {
		loadTemplates();
	},

	add: (chatId, sender, name, content) => {
		const id = generateId();
		const template = {
			id,
			chatId,
			sender,
			name: name.toLowerCase(),
			content,
			useCount: 0,
			createdAt: Date.now()
		};

		templates.set(id, template);
		saveTemplates();

		return template;
	},

	remove: (id) => {
		if (!templates.has(id)) {
			return false;
		}

		templates.delete(id);
		saveTemplates();

		return true;
	},

	removeByName: (chatId, name) => {
		for (const [id, template] of templates) {
			if (template.chatId === chatId && template.name === name.toLowerCase()) {
				templates.delete(id);
				saveTemplates();
				return true;
			}
		}

		return false;
	},

	list: (chatId) => {
		const result = [];

		for (const [, template] of templates) {
			if (template.chatId === chatId) {
				result.push(template);
			}
		}

		return result.sort((a, b) => a.name.localeCompare(b.name));
	},

	get: (chatId, name) => {
		for (const [, template] of templates) {
			if (template.chatId === chatId && template.name === name.toLowerCase()) {
				return template;
			}
		}

		return null;
	},

	use: (chatId, name, variables = {}) => {
		const template = templateManager.get(chatId, name);

		if (!template) {
			return null;
		}

		let content = template.content;

		for (const [key, value] of Object.entries(variables)) {
			content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
		}

		template.useCount++;
		saveTemplates();

		return content;
	}
};
