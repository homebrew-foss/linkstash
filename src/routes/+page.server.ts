import { Effect } from 'effect';
import { getPaginatedLinks } from '#lib/server/db';
import type { LinksPage } from '#lib/server/db';

// SSR the first feed page; the client hydrates into infinite scroll.
export const load = () =>
	Effect.runPromise(
		Effect.gen(function* () {
			const page = yield* Effect.promise(() =>
				getPaginatedLinks({ mode: 'latest', offset: 0, limit: 50 })
			);
			return { page };
		})
	)