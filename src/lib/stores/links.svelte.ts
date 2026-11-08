import { sortLinksByMode } from '#lib/sorting';
import { getFromLocalStorage, setToLocalStorage, getLinksCacheKey } from '#lib/utils/storage';
import { logger } from '#lib/logger';
import { Effect } from 'effect';
import { untrack } from 'svelte';
import type { Link, RankMode } from '#lib/types';

const LINKS_PER_PAGE = 10;

export interface PaginatedLinksInitial {
	items: Link[];
	total: number;
	hasMore: boolean;
}

// Paginated links with infinite scroll + cache. A server `initial` page skips the first fetch.
export function createPaginatedLinks(
	getMode: () => RankMode,
	initial?: PaginatedLinksInitial
) {
	const mode = $derived(getMode());

	let links = $state<Link[] | null>(initial ? initial.items : null);
	let isLoading = $state(initial ? false : true);
	let hasMore = $state(initial ? initial.hasMore : true);
	let offset = $state(initial ? initial.items.length : 0);
	let allLinksCount = $state(initial ? initial.total : 0);

	let isSeeded = Boolean(initial);

	const fetchLinks = (pageOffset: number) =>
		Effect.gen(function* () {
			if (pageOffset === 0) {
				const cacheKey = getLinksCacheKey(mode);
				const cached = getFromLocalStorage<Link[]>(cacheKey);
				if (cached) {
					links = sortLinksByMode(cached, mode);
				}
			}

			const res = yield* Effect.promise(() =>
				fetch(
					`/api/links?mode=${mode}&offset=${pageOffset}&limit=${LINKS_PER_PAGE}`
				)
			);
			if (!res.ok) {
				logger.warn(`Failed to fetch links: ${res.status}`);
				if (pageOffset === 0) isLoading = false;
				return;
			}

			const data = yield* Effect.promise(() => res.json());
			const sorted = sortLinksByMode(data.items || [], mode);

			if (pageOffset === 0) {
				links = sorted;
				setToLocalStorage(getLinksCacheKey(mode), sorted);
			} else {
				links = [...(links ?? []), ...sorted];
			}

			allLinksCount = data.total || 0;
			hasMore = data.items?.length >= LINKS_PER_PAGE;
			offset = pageOffset + (data.items?.length || 0);
		});

	$effect(() => {
		void mode;
		// First client run keeps the SSR seed, then loads more via effect.
		if (isSeeded) {
			isSeeded = false;
			const startOffset = untrack(() => offset);
			Effect.runPromise(fetchLinks(startOffset)).catch(() => {
				// ignore errors on seeded load
			});
			return;
		}
		links = null;
		offset = 0;
		allLinksCount = 0;
		hasMore = true;
		isLoading = true;
		Effect.runPromise(fetchLinks(0)).catch(() => {
			// ignore errors
		});
	});

	function loadMore() {
		if (!isLoading && hasMore) {
			Effect.runPromise(fetchLinks(offset)).catch(() => {
				// ignore errors
			});
		}
	}

	return {
		get links() {
			return links;
		},
		get isLoading() {
			return isLoading;
		},
		get hasMore() {
			return hasMore;
		},
		loadMore
	};
}