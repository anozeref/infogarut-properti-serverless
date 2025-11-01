import { getSupabaseAdmin, formatSupabaseError } from '../../_lib/supabase.js';

function toIso(val) { return val ? new Date(val).toISOString() : null; }

function dbToUser(row) {
  if (!row) return null;
  return {
    id: row.id ?? null,
    nama: row.nama ?? null,
    username: row.username ?? null,
    email: row.email ?? null,
    password: row.password ?? null,
    no_hp: row.no_hp ?? null,
    role: row.role ?? null,
    kecamatan: row.kecamatan ?? null,
    desa: row.desa ?? null,
    alamat: row.alamat ?? null,
    joinedAt: row.joined_at ? toIso(row.joined_at) : null,
    verified: row.verified ?? false,
    suspendedUntil: row.suspended_until ?? null,
    banned: row.banned ?? false,
    bannedAt: row.banned_at ? toIso(row.banned_at) : null,
  };
}

function parseIdFromUrl(url = '') {
  const m = url.match(/\/users\/([^/]+)\/unban/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Method Not Allowed',
    });
  }

  try {
    const id = (req.query && req.query.id) || parseIdFromUrl(req.url);
    if (!id) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Missing user id in path',
      });
    }

    const { data: user, error: loadErr, status: loadStatus } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (loadErr) {
      if (loadStatus === 404 || loadStatus === 406) {
        return res.status(404).json({
          error: 'not_found',
          message: 'User not found',
        });
      }
      const resp = formatSupabaseError({ error: loadErr, status: loadStatus });
      return res.status(resp.status).json(resp.body);
    }

    let finalUser = user;

    if (user.banned === true) {
      const { data: updated, error: updErr, status: updStatus } = await supabase
        .from('users')
        .update({ banned: false, banned_at: null })
        .eq('id', id)
        .select('*')
        .single();

      if (updErr) {
        const resp = formatSupabaseError({ error: updErr, status: updStatus });
        return res.status(resp.status).json(resp.body);
      }
      finalUser = updated;

      // Best-effort: close latest open ban in user_bans if table exists
      try {
        const { data: openRows, error: qErr } = await supabase
          .from('user_bans')
          .select('id')
          .eq('user_id', id)
          .is('unbanned_at', null)
          .order('banned_at', { ascending: false })
          .limit(1);

        if (!qErr && Array.isArray(openRows) && openRows.length > 0) {
          const openId = openRows[0].id;
          await supabase
            .from('user_bans')
            .update({ unbanned_at: new Date().toISOString() })
            .eq('id', openId);
        }
        // Ignore any errors (including undefined_table) by design
      } catch (e) {
        // ignore
      }
    }

    return res.status(200).json({ success: true, user: dbToUser(finalUser) });
  } catch (err) {
    const resp = formatSupabaseError(err);
    return res.status(resp.status).json(resp.body);
  }
}