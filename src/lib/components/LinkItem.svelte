<script lang="ts">
	import posthog from 'posthog-js';
	import type { Link } from '#lib/types';
	import { getLinkTitle, getLinkUrl, getLinkDomain } from '#lib/link-meta';
	import { Book } from 'lucide-svelte';

	interface Props {
		link: Link;
		rank: number;
		onOpenReader: (link: Link) => void;
	}

	let { link, rank, onOpenReader }: Props = $props();

	const url = $derived(getLinkUrl(link));
	const title = $derived(getLinkTitle(link));
	const domain = $derived(getLinkDomain(link));
	const ts = $derived(link.ts || 0);

	const faviconUrl = $derived(domain ? `https://www.google.com/s2/favicons?domain=${domain}` : '');

	function timeAgo(t: number): string {
		if (!t) return '';
		const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function handleLinkClick() {
		posthog.capture('link_clicked', {
			link_title: title,
			link_url: url,
			link_domain: domain,
			link_rank: rank,
		});
	}

	function handleReaderClick(e: MouseEvent) {
		e.stopPropagation();
		posthog.capture('reader_opened_from_link', {
			link_id: link.id,
			link_title: title,
			link_url: url
		});
		onOpenReader(link);
	}
</script>

<li class="linklist-item">
	<div class="link-row">
		<span class="rank" aria-hidden="true">{rank}.</span>
		<div class="link-main">
			{#if faviconUrl}
				<img class="favicon" src={faviconUrl} alt="" />
			{/if}
			{#if url}
				<a
					class="link-title"
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					onclick={handleLinkClick}
				>
					{title}
				</a>
			{:else}
				<span class="link-title">{title}</span>
			{/if}
			<div class="link-meta">
				{#if link.id}
					<span style="display: inline-flex; align-items: center; gap: 4px;">
						<a
							href="/reader/{link.id}"
							aria-label="Open in reader view"
							onclick={handleReaderClick}
							style="display: inline-flex; align-items: center; cursor: pointer;"
						>
							<Book size=13 />
						</a>
					</span>
				{/if}
				{#if ts}<span>{timeAgo(ts)}</span>{/if}
			</div>
		</div>
	</div>
</li>

<style>
	.favicon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		margin-right: 4px;
	}

	.link-meta a {
		color: var(--muted);
		text-decoration: none;
		font-size: 8pt;
		cursor: pointer;
	}

	.link-meta a:hover {
		text-decoration: underline;
	}

	.link-meta > span {
		font-size: 8pt;
		color: var(--muted);
	}
</style>