<script lang="ts">
	import posthog from 'posthog-js';
	import type { Link } from '$lib/types';
	import { getLinkTitle, getLinkUrl, getLinkDomain, getRoomComment, getVoteCount } from '$lib/link-meta';

	interface Props {
		link: Link;
		rank: number;
		onOpenReader: (link: Link) => void;
	}

	let { link, rank, onOpenReader }: Props = $props();

	const url = $derived(getLinkUrl(link));
	const title = $derived(getLinkTitle(link));
	const domain = $derived(getLinkDomain(link));
	const roomComment = $derived(getRoomComment(link));
	const voteCount = $derived(getVoteCount(link));
	const ts = $derived(link.ts || 0);

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
</script>

<li class="linklist-item">
	<div class="link-row">
		<span class="rank" aria-hidden="true">{rank}.</span>
		<div class="link-main">
			{#if url}
				<a
					class="link-title"
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => {
						posthog.capture('link_clicked', {
							link_title: title,
							link_url: url,
							link_domain: domain,
							link_rank: rank,
							vote_count: voteCount
						});
					}}
				>
					{title}
				</a>
			{:else}
				<span class="link-title">{title}</span>
			{/if}
			{#if domain}<span class="link-domain"> ({domain})</span>{/if}
			<div class="link-meta">
				{#if voteCount > 0}<span>{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>{/if}
				{#if roomComment}<span>by {roomComment}</span>{/if}
				{#if ts}<span>{timeAgo(ts)}</span>{/if}
				{#if link.id}
					<span>
						<a
							href="/reader/{link.id}"
							aria-label="Open in reader view"
							onclick={() => {
								posthog.capture('reader_opened_from_link', {
									link_id: link.id,
									link_title: title,
									link_url: url
								});
								onOpenReader(link);
							}}>reader</a
						>
					</span>
				{/if}
			</div>
		</div>
	</div>
</li>
