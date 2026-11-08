import { createClient, type Client } from '@libsql/client';
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '$app/env/private';
import {
	SCHEMA_DDL,
	EMBEDDING_DIM,
	ensureVectorIndex,
	migrateLinkIndex
} from './schema';

export interface LinkRecord {
	id: string;
	url: string;
	domain: string;
	content?: string; // content stored inline now
	ts: number;
	count: number;
	meta?: Record<string, any>;
	submittedBy?: string; // who submitted the link
}

// Lazily initialized so non-DB routes pay nothing.
let _client: Client | null = null;

export function getClient(): Client {
	if (!_client) {
		const url = TURSO_DATABASE_URL;
		if (!url) {
			throw new Error('TURSO_DATABASE_URL environment variable is not set');
		}
		_client = createClient({
			url,
			authToken: TURSO_AUTH_TOKEN
		});
	}
	return _client;
}

let attemptedVectorIndexInit = false;

// Initialize database schema
export async function initDb(): Promise<void> {
	if (!TURSO_DATABASE_URL) {
		return;
	}

	const c = getClient();

	for (const ddl of SCHEMA_DDL) {
		await c.execute(ddl);
	}

	if (!attemptedVectorIndexInit) {
		attemptedVectorIndexInit = true;
		await ensureVectorIndex(c);
	}

	await migrateLinkIndex(c);
}

export { EMBEDDING_DIM };

// Strip sensitive fields from public API responses.
export function sanitizeLink(obj: any): any {
	const out = { ...obj };
	delete out.submittedBy;
	delete out.roomId;
	delete out.submitted_by;
	delete out.room_id;
	if (out.meta && typeof out.meta === 'object') {
		delete out.meta.submittedBy;
		delete out.meta.roomId;
		delete out.meta.submitted_by;
		delete out.meta.room_id;
		delete out.meta.voteState;
	}
	return out;
}

function normalizeUrl(u: string): string {
	if (!u || typeof u !== 'string') return '';
	try {
		const nu = new URL(u);
		const path = nu.pathname.replace(/\/+$|^$/, '');
		return nu.origin + (path || '/') + nu.search;
	} catch (e) {
		return u.replace(/\/+$/, '');
	}
}

export function rowToLink(row: any): any {
	const meta = row.meta ? JSON.parse(row.meta as string) : {};
	const base: any = { id: row.id as string, ts: row.ts as number, count: row.count as number };
	if (row.url) base.url = row.url as string;
	if (row.domain) base.domain = row.domain as string;
	return Object.assign(base, meta);
}

export interface LinksPage {
	items: any[];
	total: number;
	offset: number;
	limit: number;
	hasMore: boolean;
}

// Shared by `/api/links` and SSR load so server HTML matches the API.
export async function getPaginatedLinks(options: {
	mode?: 'latest' | 'top';
	offset?: number;
	limit?: number;
}): Promise<LinksPage> {
	await initDb();
	const client = getClient();

	const mode = options.mode === 'top' ? 'top' : 'latest';
	const offset = options.offset && options.offset > 0 ? options.offset : 0;
	const limit = options.limit && options.limit > 0 ? Math.min(options.limit, 200) : 50;

	const orderClause = mode === 'top' ? 'ORDER BY l.count DESC, li.ts DESC' : 'ORDER BY li.ts DESC';

	const result = await client.execute({
		sql: `SELECT l.id, l.url, li.domain, l.submitted_by, li.ts, l.count, COALESCE(l.meta, li.meta) AS meta
          FROM link_index li
          LEFT JOIN links l ON l.id = li.link_id
          ${orderClause}
          LIMIT ? OFFSET ?`,
		args: [limit, offset]
	});

	const countResult = await client.execute({
		sql: 'SELECT COUNT(*) AS count FROM link_index',
		args: []
	});
	const total = (countResult.rows[0]?.count as number) || 0;

	const items = result.rows.map((row: any) => sanitizeLink(rowToLink(row)));

	return { items, total, offset, limit, hasMore: offset + limit < total };
}

export async function getLinkByUrl(url: string): Promise<any | null> {
	await initDb();

	const qnorm = normalizeUrl(url);

	const result = await getClient().execute({
		sql: `SELECT l.id, l.url, l.domain, l.submitted_by, l.ts, l.count, COALESCE(l.meta, li.meta) AS meta
          FROM link_index li
          JOIN links l ON l.id = li.link_id
          WHERE li.normalized_url = ?
          LIMIT 1`,
		args: [qnorm]
	});

	if (result.rows.length === 0) return null;
	return sanitizeLink(rowToLink(result.rows[0]));
}

export async function deleteLinkById(id: string): Promise<boolean> {
	await initDb();
	try {
		// FK cascades, but clean both tables to be safe.
		await getClient().execute({ sql: 'DELETE FROM links WHERE id = ?', args: [id] });
		await getClient().execute({ sql: 'DELETE FROM link_index WHERE link_id = ?', args: [id] });
		return true;
	} catch (e) {
		console.error('deleteLinkById error', e);
		return false;
	}
}
