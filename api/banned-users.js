import { getSupabaseAdmin, formatSupabaseError } from './_lib/supabase.js';

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

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Method Not Allowed',
    });
  }

  try {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('banned', true);

    if (error) {
      const resp = formatSupabaseError({ error, status });
      return res.status(resp.status).json(resp.body);
    }

    const rows = Array.isArray(data) ? data : [];
    return res.status(200).json(rows.map(dbToUser));
  } catch (err) {
    const resp = formatSupabaseError(err);
    return res.status(resp.status).json(resp.body);
  }
}