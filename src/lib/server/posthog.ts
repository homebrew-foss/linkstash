import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$app/env/public';

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog {
	if (!posthogClient) {
		posthogClient = new PostHog(PUBLIC_POSTHOG_KEY ?? '', {
			host: PUBLIC_POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 0
		});
		// @ts-expect-error - import.meta.dev is injected by Vite/SvelteKit at build time
		if (import.meta.dev) {
			posthogClient.debug(true);
		}
	}
	return posthogClient;
}

export async function shutdownPostHog(): Promise<void> {
	if (posthogClient) {
		await posthogClient.shutdown();
	}
}
