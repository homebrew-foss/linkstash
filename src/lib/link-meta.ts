// Field accessors with fallbacks for flattened or `meta`-nested link data.

import type { Link } from './types';

function metaString(link: Link, key: string): string {
	const value = link.meta?.[key];
	return typeof value === 'string' ? value : '';
}

export function getLinkUrl(link: Link): string {
	return link.url || metaString(link, 'url');
}

export function getLinkTitle(link: Link): string {
	return link.title || metaString(link, 'title') || getLinkUrl(link) || 'Untitled';
}

export function getLinkDomain(link: Link): string {
	const direct = link.domain || metaString(link, 'domain');
	if (direct) return direct;

	const url = getLinkUrl(link);
	if (!url) return '';
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

export function getRoomComment(link: Link): string {
	return metaString(link, 'roomComment') || '';
}

export function getVoteCount(link: Link): number {
	return Number(link.count || 0);
}
