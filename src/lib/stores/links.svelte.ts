import { sortLinksByMode } from '$lib/sorting';
import { getFromLocalStorage, setToLocalStorage, getLinksCacheKey } from '$lib/utils/storage';
import { logger } from '$lib/logger';
import type { Link, RankMode } from '$lib/types';

const LINKS_PER_PAGE = 50;

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

	let isSeeded = $state(Boolean(initial));

	async function fetchLinks(pageOffset = 0) {
		try {
			if (pageOffset === 0) {
				const cacheKey = getLinksCacheKey(mode);
				const cached = getFromLocalStorage<Link[]>(cacheKey);
				if (cached) {
					links = sortLinksByMode(cached, mode);
				}
			}

			const response = await fetch(
				`/api/links?mode=${mode}&offset=${pageOffset}&limit=${LINKS_PER_PAGE}`
			);
			if (!response.ok) {
				logger.warn(`Failed to fetch links: ${response.status}`);
				if (pageOffset === 0) isLoading = false;
				return;
			}

			const data = await response.json();
			const sorted = sortLinksByMode(data.items || [], mode);

			if (pageOffset === 0) {
				links = sorted;
				setToLocalStorage(getLinksCacheKey(mode), sorted);
			} else {
				links = [...(links ?? []), ...sorted];
			}

			allLinksCount = data.total || 0;
			hasMore = pageOffset + LINKS_PER_PAGE < allLinksCount;
			offset = pageOffset + LINKS_PER_PAGE;
		} catch (error) {
			logger.error('Error fetching links', error);
			if (pageOffset === 0) isLoading = false;
		} finally {
			if (pageOffset === 0) isLoading = false;
		}
	}

	$effect(() => {

		void mode;
		// First client run keeps the SSR seed instead of re-fetching.
		if (isSeeded) {
			isSeeded = false;
			return;
		}
		links = null;
		offset = 0;
		allLinksCount = 0;
		hasMore = true;
		isLoading = true;
		fetchLinks(0);
	});

	function loadMore() {
		if (!isLoading && hasMore) {
			fetchLinks(offset);
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
