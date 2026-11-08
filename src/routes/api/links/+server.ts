import type { RequestHandler } from '@sveltejs/kit';
import { getClient, initDb, sanitizeLink, getLinkByUrl, rowToLink, getPaginatedLinks } from '#lib/server/db';
import { sortLinksByMode, normalizeRankMode } from '#lib/sorting';
import { logger } from '#lib/logger';
import type { Link, RankMode } from '#lib/types';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// GET /api/links: `url` lookup, `mode` ranking, paginated (`limit` ≥ 10000 = search).
export const GET: RequestHandler = async (event) => {
	try {
		const search = event.url.searchParams;
		const queryUrl = search.get('url');
		const mode: RankMode = normalizeRankMode(search.get('mode'));

		const rawOffset = parseInt(search.get('offset') || '0', 10);
		const rawLimit = parseInt(search.get('limit') || String(DEFAULT_LIMIT), 10);
		const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;
		let limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT;


		const isSearchQuery = limit >= 10000;
		if (!isSearchQuery) {
			limit = Math.min(limit, MAX_LIMIT);
		}

		// Single-link lookup by normalized URL.
		if (queryUrl) {
			const link = await getLinkByUrl(queryUrl);
			if (!link) {
				return Response.json({ error: 'Link not found' }, { status: 404 });
			}
			return Response.json(link);
		}

		await initDb();
		const client = getClient();

		const mapRow = (row: any): Link => {
			const l = rowToLink(row);
			return sanitizeLink(l) as Link;
		};

		// Rising needs the full dataset for scoring; sort in memory.
		if (mode === 'rising') {
			const fullResult = await client.execute({
				sql: `SELECT l.id, l.url, li.domain, l.submitted_by, li.ts, l.count, COALESCE(l.meta, li.meta) AS meta
              FROM link_index li
              LEFT JOIN links l ON l.id = li.link_id`,
				args: []
			});

			const links: Link[] = fullResult.rows.map(mapRow);
			const sorted = sortLinksByMode(links, mode);
			const total = sorted.length;
			const paged = sorted.slice(offset, offset + limit);

			return Response.json({
				items: paged,
				total,
				offset,
				limit,
				hasMore: offset + limit < total
			});
		}


		if (isSearchQuery) {
			const fullResult = await client.execute({
				sql: `SELECT l.id, l.url, li.domain, l.submitted_by, li.ts, l.count, COALESCE(l.meta, li.meta) AS meta
              FROM link_index li
              LEFT JOIN links l ON l.id = li.link_id
              ORDER BY li.ts DESC`,
				args: []
			});

			const links: Link[] = fullResult.rows.map(mapRow).slice(offset, offset + limit);

			const total = fullResult.rows.length;
			return Response.json({
				items: links,
				total,
				offset,
				limit,
				hasMore: offset + limit < total
			});
		}


		const page = await getPaginatedLinks({ mode: mode as 'latest' | 'top', offset, limit });
			return Response.json({
			items: page.items,
			total: page.total,
			offset: page.offset,
			limit: page.limit,
			hasMore: page.hasMore
		});
	} catch (error) {
		logger.error('Error fetching links', error);
			return Response.json({ error: 'Internal server error' }, { status: 500 });
	}
};
