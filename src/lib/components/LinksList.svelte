<script lang="ts">
	import LinkItem from '$lib/components/LinkItem.svelte';
	import type { Link } from '$lib/types';

	interface Props {
		links: Link[];
		isLoading: boolean;
		hasMore?: boolean;
		onOpenReader: (link: Link) => void;
		onLoadMore?: () => void;
	}

	let { links, isLoading, hasMore = false, onOpenReader, onLoadMore = () => {} }: Props = $props();

	let sentinel: HTMLDivElement | null = $state(null);

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && !isLoading && hasMore) {
						onLoadMore();
					}
				}
			},
			{ rootMargin: '300px' }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});
</script>

{#if isLoading && links.length === 0}
	<div class="loading">
		<p>Loading...</p>
	</div>
{:else if links.length === 0}
	<div class="empty">
		<p>No links found.</p>
		<p>Share a link in the WhatsApp group and it will show up here.</p>
	</div>
{:else}
	<ol class="hn-list">
		{#each links as link, idx (link.id || link.url || idx)}
			<LinkItem {link} rank={idx + 1} {onOpenReader} />
		{/each}
	</ol>

	{#if hasMore}
		<div bind:this={sentinel} class="load-more-sentinel">
			{#if isLoading}
				<div role="status">Loading...</div>
			{:else}
				<button type="button" onclick={onLoadMore}>More</button>
			{/if}
		</div>
	{/if}
{/if}
