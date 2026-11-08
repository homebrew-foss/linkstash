
import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$app/env/public';

let initialized = false;

export function initPostHog(): void {
	if (initialized || typeof window === 'undefined') return;
	const key = PUBLIC_POSTHOG_KEY;
	if (!key) return;

	posthog.init(key, {
		api_host: PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
		capture_exceptions: true,
		debug: import.meta.env.DEV
	});

	initialized = true;
}
