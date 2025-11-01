import { getSupabaseAdmin, formatSupabaseError } from './_lib/supabase.js';

function parseIdFromUrl(req) {
  try {
    const raw = req.url || '';
    const path = raw.split('?')[0];
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last && last !== 'notifications' ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

function toIso(value) {
  if (!value) return null;
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function dbToNotification(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    text: row.text ?? null,
    isRead: !!row.is_read,
    createdAt: toIso(row.created_at),
    link: row.link ?? null,
  };
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  try {
    if (req.method === 'GET') {
      const { userId, _sort, _order } = req.query || {};
      if (!userId) {
        res.status(400).json({ error: 'Missing required query param: userId' });
        return;
      }

      let query = supabase.from('notifications').select('*').eq('user_id', userId);

      // Preserve existing sort usage: _sort=createdAt&_order=desc
      if (_sort === 'createdAt') {
        const ascending = String(_order).toLowerCase() === 'asc';
        query = query.order('created_at', { ascending });
      } else {
        // default: newest first (desc)
        query = query.order('created_at', { ascending: false });
      }

      const { data: rows, error, status } = await query;
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      res.json((rows || []).map(dbToNotification));
      return;
    }

    if (req.method === 'DELETE') {
      const id = parseIdFromUrl(req);
      if (!id) {
        res.status(400).json({ error: 'Missing id in URL' });
        return;
      }

      const { error, status } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      res.json({ success: true, id: String(id) });
      return;
    }

    res.setHeader('Allow', 'GET,DELETE');
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (unexpected) {
    const formatted = formatSupabaseError(unexpected);
    res.status(formatted.status || 500).json(formatted.body || { error: 'Unexpected error' });
  }
}