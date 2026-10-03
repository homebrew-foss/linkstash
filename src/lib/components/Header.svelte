<script lang="ts">
	import posthog from 'posthog-js';
	import type { Snippet } from 'svelte';

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
		<nav class="header-nav" aria-label="Primary">
			<a href="/">new</a>
			<span class="nav-sep" aria-hidden="true">|</span>
			<a href="/summary">past</a>
			<span class="nav-sep" aria-hidden="true">|</span>
			<a
				href="/api/feed"
				onclick={() => posthog.capture('rss_feed_clicked')}
			>feed</a>
		</nav>
		{#if children}
			<div class="header-context">{@render children()}</div>
		{/if}
		<div class="header-actions">
			<a
				href="https://github.com/homebrew-foss/linkstash"
				target="_blank"
				rel="noopener noreferrer"
				aria-label="GitHub repository"
				onclick={() => posthog.capture('github_link_clicked')}
			>
				github
			</a>
		</div>
	</div>
</header>
