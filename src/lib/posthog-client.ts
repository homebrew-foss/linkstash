
import posthog from 'posthog-js';
import { env } from '$env/dynamic/public';

let initialized = false;

export function initPostHog(): void {
	if (initialized || typeof window === 'undefined') return;
	const key = env.PUBLIC_POSTHOG_KEY;
	if (!key) return;

	posthog.init(key, {
		api_host: env.PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
		capture_exceptions: true,
		debug: import.meta.env.DEV
	});

	initialized = true;
}
