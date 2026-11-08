<script lang="ts">
	import { goto } from '$app/navigation';
	import { createPaginatedLinks } from '#lib/stores/links.svelte';
	import Header from '#lib/components/Header.svelte';
	import LinksList from '#lib/components/LinksList.svelte';
	import { logger } from '#lib/logger';
	import type { Link } from '#lib/types';
	import type { PaginatedLinksInitial } from '#lib/stores/links.svelte';

	interface Props {
		initialPage?: PaginatedLinksInitial;
	}

	let { initialPage }: Props = $props();

	// svelte-ignore state_referenced_locally -- initialPage is read once to seed the store
	const store = createPaginatedLinks(() => 'latest', initialPage);

	function handleOpenReader(link: Link) {
		if (!link.id) {
			logger.warn('Cannot open reader for link without ID');
			return;
		}
		goto(`/reader/${encodeURIComponent(link.id)}`);
	}
</script>

<Header />

<main class="app-main" id="main-content">
	<LinksList
		links={store.links ?? []}
		isLoading={store.isLoading}
		onOpenReader={handleOpenReader}
	/>
</main>