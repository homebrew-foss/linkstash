<script lang="ts">
	import { goto } from '$app/navigation';
	import { createPaginatedLinks } from '$lib/stores/links.svelte';
	import Header from '$lib/components/Header.svelte';
	import LinksList from '$lib/components/LinksList.svelte';
	import { logger } from '$lib/logger';
	import posthog from 'posthog-js';
	import type { RankMode, Link } from '$lib/types';
	import type { PaginatedLinksInitial } from '$lib/stores/links.svelte';

	interface Props {
		initialPage?: PaginatedLinksInitial;
	}

	let { initialPage }: Props = $props();

	let rankMode: RankMode = $state('latest');

	// svelte-ignore state_referenced_locally -- initialPage is read once to seed the store
	const store = createPaginatedLinks(() => rankMode, initialPage);

	function handleOpenReader(link: Link) {
		if (!link.id) {
			logger.warn('Cannot open reader for link without ID');
			return;
		}
		goto(`/reader/${encodeURIComponent(link.id)}`);
	}

	function setMode(mode: RankMode) {
		rankMode = mode;
		posthog.capture('feed_sort_changed', { mode });
	}
</script>

<Header />

<main class="app-main" id="main-content">
	<div class="feed-toolbar" aria-label="Sort links">
		<button type="button" aria-pressed={rankMode === 'latest'} onclick={() => setMode('latest')}
			>new</button
		>
		<span aria-hidden="true">|</span>
		<button type="button" aria-pressed={rankMode === 'top'} onclick={() => setMode('top')}>top</button>
		<span aria-hidden="true">|</span>
		<button type="button" aria-pressed={rankMode === 'rising'} onclick={() => setMode('rising')}
			>rising</button
		>
		<span class="feed-count" aria-live="polite">
			{store.links ? `${store.links.length} shown` : ''}
		</span>
	</div>

	<LinksList
		links={store.links ?? []}
		isLoading={store.isLoading}
		hasMore={store.hasMore}
		onOpenReader={handleOpenReader}
		onLoadMore={store.loadMore}
	/>

	<footer class="hn-footer">
		<a href="/summary">past</a> | <a href="/api/feed">feed</a> |
		<a href="https://github.com/homebrew-foss/linkstash" target="_blank" rel="noopener noreferrer"
			>github</a
		>
	</footer>
</main>
