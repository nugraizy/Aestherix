import { Router } from 'express';
import multer from 'multer';

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	}
});

export function createChatRouter({ services }) {
	const router = Router();
	const { chat, middleware } = services;

	router.get('/chat/sessions', middleware.requireDashboardAuth, (_req, res) => {
		res.json({ sessions: chat.listSessions() });
	});

	router.post('/chat/sessions', middleware.requireDashboardAuth, (_req, res) => {
		const session = chat.createSession();

		res.json({ session });
	});

	router.get('/chat/sessions/:id', middleware.requireDashboardAuth, (req, res) => {
		const session = chat.getSession(req.params.id);

		if (!session) {
			return res.status(404).json({ error: 'Session not found' });
		}

		res.json({ session });
	});

	router.delete('/chat/sessions/:id', middleware.requireDashboardAuth, (req, res) => {
		const deleted = chat.deleteSession(req.params.id);

		if (!deleted) {
			return res.status(404).json({ error: 'Session not found' });
		}

		res.json({ ok: true });
	});

	router.patch('/chat/sessions/:id', middleware.requireDashboardAuth, (req, res) => {
		const { title } = req.body;

		if (!title || typeof title !== 'string') {
			return res.status(400).json({ error: 'Title is required' });
		}

		const session = chat.renameSession(req.params.id, title);

		if (!session) {
			return res.status(404).json({ error: 'Session not found' });
		}

		res.json({ session });
	});

	router.post('/chat/sessions/:id/messages', middleware.requireDashboardAuth, async (req, res) => {
		const { content } = req.body;

		if (!content || typeof content !== 'string' || !content.trim()) {
			return res.status(400).json({ error: 'Message content is required' });
		}

		const result = await chat.sendMessage(req.params.id, content.trim());

		if (result.error) {
			return res.status(400).json({ error: result.error });
		}

		res.json(result);
	});

	router.post('/chat/sessions/:id/image', middleware.requireDashboardAuth, async (req, res) => {
		const { prompt } = req.body;

		if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
			return res.status(400).json({ error: 'Image prompt is required' });
		}

		const result = await chat.generateImage(req.params.id, prompt.trim());

		if (result.error) {
			return res.status(400).json({ error: result.error });
		}

		res.json(result);
	});

	router.post('/chat/sessions/:id/vision', middleware.requireDashboardAuth, upload.single('image'), async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: 'Image file is required' });
		}

		const caption = req.body?.caption || '';
		const result = await chat.processImage(req.params.id, req.file.buffer, caption);

		if (result.error) {
			return res.status(400).json({ error: result.error });
		}

		res.json(result);
	});

	return router;
}
