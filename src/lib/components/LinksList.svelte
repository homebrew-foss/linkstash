<script lang="ts">
	import LinkItem from '#lib/components/LinkItem.svelte';
	import type { Link } from '#lib/types';

	interface Props {
		links: Link[];
		isLoading: boolean;
		onOpenReader: (link: Link) => void;
	}

	let { links, isLoading, onOpenReader }: Props = $props();
</script>

{#if isLoading}
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
{/if}