import fs from 'fs/promises';
import path from 'path';
import { ChatGPTDialogue } from '../../../src/utils/ai/char-ai.js';

const DEFAULT_SESSIONS_PATH = 'data/chat-sessions.json';
const MAX_CONTEXT_MESSAGES = 40;

const SYSTEM_PROMPT = [
	'You are a helpful, friendly, and concise AI assistant.',
	'You provide clear, accurate, and well-structured responses.',
	'Use markdown formatting when it improves readability: headings, lists, code blocks, bold, italic.',
	'For code, always use fenced code blocks with the language identifier.',
	'Be direct and avoid unnecessary filler text.'
];

export function createChatService({ sessionsPath = DEFAULT_SESSIONS_PATH } = {}) {
	let sessions = new Map();

	function generateId() {
		return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
	}

	function generateTitle(firstMessage) {
		const clean = firstMessage.replace(/[^\w\s]/g, '').trim();
		const words = clean.split(/\s+/).slice(0, 6);

		if (words.length === 0) {
			return 'New Chat';
		}

		let title = words.join(' ');

		if (title.length > 40) {
			title = title.slice(0, 40) + '...';
		}

		return title.charAt(0).toUpperCase() + title.slice(1);
	}

	function createDialogue() {
		return new ChatGPTDialogue('Dashboard', new Date().toLocaleString('en-US'), null, {
			mode: 'agent',
			rolePrompts: SYSTEM_PROMPT
		});
	}

	async function load() {
		try {
			const raw = await fs.readFile(sessionsPath, 'utf-8');
			const entries = JSON.parse(raw);

			if (Array.isArray(entries)) {
				for (const session of entries) {
					sessions.set(session.id, session);
				}
			}
		} catch {
			// file may not exist yet
		}
	}

	async function save() {
		const dir = path.dirname(sessionsPath);

		await fs.mkdir(dir, { recursive: true });

		const entries = Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);

		await fs.writeFile(sessionsPath, JSON.stringify(entries, null, 2));
	}

	function listSessions() {
		return Array.from(sessions.values())
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.map((s) => ({
				id: s.id,
				title: s.title,
				messageCount: s.messages.length,
				createdAt: s.createdAt,
				updatedAt: s.updatedAt
			}));
	}

	function getSession(id) {
		const session = sessions.get(id);

		if (!session) {
			return null;
		}

		return {
			...session,
			contextCount: session.messages.filter((m) => m.role !== 'system').length
		};
	}

	function createSession() {
		const id = generateId();
		const now = Date.now();
		const session = {
			id,
			title: 'New Chat',
			messages: [],
			createdAt: now,
			updatedAt: now
		};

		sessions.set(id, session);
		void save();

		return session;
	}

	function deleteSession(id) {
		const deleted = sessions.delete(id);

		if (deleted) {
			void save();
		}

		return deleted;
	}

	function renameSession(id, title) {
		const session = sessions.get(id);

		if (!session) {
			return null;
		}

		session.title = title.slice(0, 60);
		session.updatedAt = Date.now();
		void save();

		return session;
	}

	async function sendMessage(sessionId, content) {
		const session = sessions.get(sessionId);

		if (!session) {
			return { error: 'Session not found' };
		}

		session.messages.push({
			role: 'user',
			content,
			timestamp: Date.now()
		});

		if (session.messages.length === 1) {
			session.title = generateTitle(content);
		}

		session.updatedAt = Date.now();

		const dialogue = createDialogue();
		const contextMessages = session.messages.slice(-MAX_CONTEXT_MESSAGES);

		for (const msg of contextMessages) {
			if (msg.role === 'user') {
				dialogue._chatHistory.addUserMessage(msg.content);
			} else if (msg.role === 'assistant') {
				dialogue._chatHistory.addAssistantMessage(msg.content);
			}
		}

		try {
			const response = await dialogue.sendMessage(content);

			if (response.error) {
				session.messages.push({
					role: 'assistant',
					content: response.message,
					timestamp: Date.now(),
					error: true
				});

				void save();

				return { error: response.message };
			}

			session.messages.push({
				role: 'assistant',
				content: response.message,
				timestamp: Date.now()
			});

			session.updatedAt = Date.now();
			void save();

			return {
				message: response.message,
				contextCount: session.messages.filter((m) => m.role !== 'system').length
			};
		} catch {
			const errorMsg = 'Failed to get response. Please try again.';

			session.messages.push({
				role: 'assistant',
				content: errorMsg,
				timestamp: Date.now(),
				error: true
			});

			void save();

			return { error: errorMsg };
		}
	}

	async function generateImage(sessionId, prompt) {
		const session = sessions.get(sessionId);

		if (!session) {
			return { error: 'Session not found' };
		}

		session.messages.push({
			role: 'user',
			content: `[Image request] ${prompt}`,
			timestamp: Date.now()
		});

		if (session.messages.length === 1) {
			session.title = generateTitle(prompt);
		}

		session.updatedAt = Date.now();

		try {
			const dialogue = createDialogue();
			const result = await dialogue.generateImage(prompt);

			if (!result?.data?.[0]?.b64_json) {
				const errorMsg = 'Failed to generate image. Please try again.';

				session.messages.push({
					role: 'assistant',
					content: errorMsg,
					timestamp: Date.now(),
					error: true
				});

				void save();

				return { error: errorMsg };
			}

			const imageData = result.data[0].b64_json;

			session.messages.push({
				role: 'assistant',
				content: `[Image] Generated from: "${prompt}"`,
				timestamp: Date.now(),
				image: imageData
			});

			session.updatedAt = Date.now();
			void save();

			return { image: imageData, prompt };
		} catch {
			const errorMsg = 'Image generation failed. Please try again.';

			session.messages.push({
				role: 'assistant',
				content: errorMsg,
				timestamp: Date.now(),
				error: true
			});

			void save();

			return { error: errorMsg };
		}
	}

	async function processImage(sessionId, imageBuffer, caption) {
		const session = sessions.get(sessionId);

		if (!session) {
			return { error: 'Session not found' };
		}

		const imageBase64 = imageBuffer.toString('base64');
		const userContent = caption || 'What do you see in this image?';

		session.messages.push({
			role: 'user',
			content: userContent,
			timestamp: Date.now(),
			image: imageBase64
		});

		if (session.messages.length === 1) {
			session.title = generateTitle(caption || 'Image analysis');
		}

		session.updatedAt = Date.now();

		try {
			const dialogue = createDialogue();
			const result = await dialogue.processImage(imageBuffer, userContent);

			if (!result) {
				const errorMsg = 'Failed to process the image. Please try again.';

				session.messages.push({
					role: 'assistant',
					content: errorMsg,
					timestamp: Date.now(),
					error: true
				});

				void save();

				return { error: errorMsg };
			}

			const assistantContent = result.choices?.[0]?.Message?.content
				|| result.choices?.[0]?.message?.content
				|| 'I could not analyze this image.';

			session.messages.push({
				role: 'assistant',
				content: assistantContent,
				timestamp: Date.now()
			});

			session.updatedAt = Date.now();
			void save();

			return { message: assistantContent };
		} catch {
			const errorMsg = 'Image processing failed. Please try again.';

			session.messages.push({
				role: 'assistant',
				content: errorMsg,
				timestamp: Date.now(),
				error: true
			});

			void save();

			return { error: errorMsg };
		}
	}

	return {
		load,
		listSessions,
		getSession,
		createSession,
		deleteSession,
		renameSession,
		sendMessage,
		generateImage,
		processImage
	};
}
