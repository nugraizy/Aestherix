export function applyNoStoreJsonHeaders(res) {
	res.setHeader('Cache-Control', 'no-store');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
}

export function noStoreJson(_req, res, next) {
	applyNoStoreJsonHeaders(res);
	next();
}
