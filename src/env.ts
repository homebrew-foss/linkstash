import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	TURSO_DATABASE_URL: {},
	TURSO_AUTH_TOKEN: {},
	AUTH_KEY: {},
	LAVA_URL: {},
	PUBLIC_POSTHOG_KEY: {
		public: true,
		schema: (value) => value || undefined
	},
	PUBLIC_POSTHOG_HOST: {
		public: true,
		schema: (value) => value || undefined
	}
});
