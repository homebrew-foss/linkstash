import type { RequestHandler } from '@sveltejs/kit';
import { deleteLinkById } from '#lib/server/db';
import { isAuthorized } from '#lib/server/auth';

// DELETE /api/admin/link: delete by id, gated by Bearer AUTH_KEY.
export const DELETE: RequestHandler = async (event) => {
	const authHeader = event.request.headers.get('authorization');
	if (!isAuthorized(authHeader)) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = (await event.request.json().catch(() => ({}))) as { id?: string };
		const { id } = body;
		if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

		const ok = await deleteLinkById(id);
		if (!ok) return Response.json({ error: 'Delete failed' }, { status: 500 });

		return Response.json({ ok: true });
	} catch (e) {
		console.error('admin delete error', e);
		return Response.json({ error: 'Server error' }, { status: 500 });
	}
};
