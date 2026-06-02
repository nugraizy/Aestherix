export class ManualSolveError extends Error {
	constructor({ challengeId, solveUrl, service, url }) {
		super(`Manual solve required for ${service}: ${url}`);
		this.name = 'ManualSolveError';
		this.challengeId = challengeId;
		this.solveUrl = solveUrl;
		this.service = service;
		this.url = url;
	}
}
