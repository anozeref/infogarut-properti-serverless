import { getSupabaseAdmin, getSupabasePublic, formatSupabaseError } from './_lib/supabase.js';

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
  const m = url.match(/\/users\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function handleGet(req, res, supabase) {
  const { username, password, email } = req.query || {};

  if (username && password) {
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password);
    if (error) {
      const resp = formatSupabaseError({ error, status });
      return res.status(resp.status).json(resp.body);
    }
    const rows = Array.isArray(data) ? data : [];
    return res.status(200).json(rows.map(dbToUser));
  }

  let query = supabase.from('users').select('*');
  if (username) query = query.eq('username', username);
  if (email) query = query.eq('email', email);

  const { data, error, status } = await query;
  if (error) {
    const resp = formatSupabaseError({ error, status });
    return res.status(resp.status).json(resp.body);
  }
  const rows = Array.isArray(data) ? data : [];
  return res.status(200).json(rows.map(dbToUser));
}

function buildInsertPayload(body = {}) {
  const payload = {
    id: body.id,
    nama: body.nama,
    username: body.username,
    email: body.email,
    password: body.password,
    no_hp: body.no_hp,
    role: body.role ?? 'user',
    kecamatan: body.kecamatan,
    desa: body.desa,
    alamat: body.alamat,
    joined_at: body.joinedAt ? new Date(body.joinedAt).toISOString() : undefined,
    verified: body.verified ?? false,
    suspended_until: body.suspendedUntil ?? null,
    banned: body.banned ?? false,
    banned_at: body.bannedAt ?? null,
  };
  // Remove undefined keys to avoid overwriting defaults
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return payload;
}

function buildUpdatePayload(body = {}) {
  const payload = {};
  const assign = (key, val) => {
    if (val !== undefined) payload[key] = val;
  };
  assign('nama', body.nama);
  assign('username', body.username);
  assign('email', body.email);
  assign('password', body.password);
  assign('no_hp', body.no_hp);
  assign('role', body.role);
  assign('kecamatan', body.kecamatan);
  assign('desa', body.desa);
  assign('alamat', body.alamat);
  assign('verified', body.verified);
  assign('suspended_until', body.suspendedUntil);
  assign('banned', body.banned);
  assign('banned_at', body.bannedAt);
  if (body.joinedAt !== undefined) {
    payload.joined_at = body.joinedAt ? new Date(body.joinedAt).toISOString() : null;
  }
  return payload;
}

async function handlePost(req, res, supabase) {
  const body = req.body || {};
  const { username, email } = body;

  if (!username || !email) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'username and email are required',
    });
  }

  const { data: existing, error: existErr, status: existStatus } = await supabase
    .from('users')
    .select('id,username,email')
    .or(`username.eq.${username},email.eq.${email}`)
    .limit(1);
  if (existErr) {
    const resp = formatSupabaseError({ error: existErr, status: existStatus });
    return res.status(resp.status).json(resp.body);
  }
  if (existing && existing.length > 0) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Username or email already exists',
    });
  }

  const insertPayload = buildInsertPayload(body);
  const { data, error, status } = await supabase
    .from('users')
    .insert([insertPayload])
    .select('*')
    .single();
  if (error) {
    const resp = formatSupabaseError({ error, status });
    return res.status(resp.status).json(resp.body);
  }
  return res.status(200).json(dbToUser(data));
}

async function handlePut(req, res, supabase) {
  const idFromUrl = parseIdFromUrl(req.url);
  const id = req.query?.id ?? idFromUrl ?? req.body?.id;
  if (!id) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Missing user id in path or body',
    });
  }

  const updatePayload = buildUpdatePayload(req.body || {});
  const { data, error, status } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    // Not-found after update
    if (status === 404) {
      return res.status(404).json({
        error: 'not_found',
        message: 'User not found',
      });
    }
    const resp = formatSupabaseError({ error, status });
    return res.status(resp.status).json(resp.body);
  }
  return res.status(200).json(dbToUser(data));
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();
  try {
    if (req.method === 'GET') return await handleGet(req, res, supabase);
    if (req.method === 'POST') return await handlePost(req, res, supabase);
    if (req.method === 'PUT') return await handlePut(req, res, supabase);
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Method Not Allowed',
    });
  } catch (err) {
    const resp = formatSupabaseError(err);
    return res.status(resp.status).json(resp.body);
  }
}