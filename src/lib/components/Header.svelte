<script lang="ts">
	import posthog from 'posthog-js';
	import type { Snippet } from 'svelte';
	import { GitPullRequestArrow, Rss } from 'lucide-svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<a class="skip-link" href="#main-content">Skip to content</a>
<header class="header">
	<div class="header-row">
		<a href="/" class="header-logo" aria-label="linkstash home">L</a>
		<a href="/" class="site-title">linkstash</a>
		<div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">
			{#if children}
				<div class="header-context">{@render children()}</div>
			{/if}
			<a
				href="/api/feed"
				onclick={() => posthog.capture('rss_feed_clicked')}
				style="display: inline-flex; align-items: center; gap: 4px;"
			>
				<Rss size=13 /> feed
			</a>
			<div class="header-actions">
				<a
					href="https://github.com/homebrew-foss/linkstash"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="GitHub repository"
					onclick={() => posthog.capture('github_link_clicked')}
					style="display: inline-flex; align-items: center; gap: 4px;"
				>
					<GitPullRequestArrow size=13 /> github
				</a>
			</div>
		</div>
	</div>
</header>