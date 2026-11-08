import { AUTH_KEY } from '$app/env/private';

// Constant-time-ish compare to avoid leaking the key via timing.
function safeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

// Verify `Authorization: Bearer <AUTH_KEY>`. Fails closed when unset.
export function isAuthorized(authorization: string | null): boolean {
	const key = AUTH_KEY;
	if (!key) return false;
	const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
	if (!token) return false;
	return safeEqual(token, key);
}
