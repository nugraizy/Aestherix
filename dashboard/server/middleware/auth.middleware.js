export function createAuthMiddleware({ auth }) {
	if (!auth) {
		throw new Error('auth.middleware: auth service is required');
	}

	const requireDashboardAuth = (req, res, next) => {
		if (auth.isAuthenticated(req)) {
			return next();
		}

		return res.status(401).json({ ok: false, message: 'Authentication required.' });
	};

	const requireOwnerAuth = (req, res, next) => {
		const session = auth.getSessionFromRequest(req);

		if (!session) {
			return res.status(401).json({ ok: false, message: 'Authentication required.' });
		}

		if (session.role !== 'owner' && session.role !== 'superOwner') {
			return res.status(403).json({ ok: false, message: 'Owner permission required.' });
		}

		req.dashboardSession = session;
		return next();
	};

	const requireSuperOwnerAuth = (req, res, next) => {
		const session = auth.getSessionFromRequest(req);

		if (!session) {
			return res.status(401).json({ ok: false, message: 'Authentication required.' });
		}

		if (session.role !== 'superOwner') {
			return res.status(403).json({ ok: false, message: 'Super owner permission required.' });
		}

		req.dashboardSession = session;
		return next();
	};

	return { requireDashboardAuth, requireOwnerAuth, requireSuperOwnerAuth };
}
