// Shared Supabase client for Vercel serverless functions
// Usage:
//   import { getSupabaseAdmin, getSupabasePublic, ensureEnv, formatSupabaseError } from './_lib/supabase.js'
//   const supabase = getSupabaseAdmin() // privileged server-side ops
//   const supabasePublic = getSupabasePublic() // public operations (anon)
//
// Environment variables:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE (preferred for server-side privileged ops; fallback to SUPABASE_ANON_KEY)
//   - SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js';

let adminClient;
let publicClient;

/**
 * Validate environment variables needed by Supabase.
 * For admin: requires SUPABASE_URL and either SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY.
 * For public: requires SUPABASE_URL and SUPABASE_ANON_KEY.
 * Throws descriptive Error when missing.
 */
export function ensureEnv(target = 'admin') {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }

  if (target === 'public') {
    if (!anonKey) {
      throw new Error('Missing SUPABASE_ANON_KEY environment variable required for public client.');
    }
  } else {
    if (!serviceKey && !anonKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY environment variable. At least one is required for admin client.');
    }
  }

  return { url, serviceKey, anonKey };
}

/**
 * Singleton Supabase client for server-side privileged operations.
 * Uses SUPABASE_SERVICE_ROLE if provided, otherwise falls back to SUPABASE_ANON_KEY.
 */
export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const { url, serviceKey, anonKey } = ensureEnv('admin');
  const key = serviceKey || anonKey;

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

/**
 * Singleton Supabase client for public (anon) operations.
 * Always uses SUPABASE_ANON_KEY.
 */
export function getSupabasePublic() {
  if (publicClient) return publicClient;

  const { url, anonKey } = ensureEnv('public');

  publicClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return publicClient;
}

/**
 * Minimal helper to format Supabase/Postgrest errors into HTTP responses.
 */
export function formatSupabaseError(errOrResponse) {
  const err = errOrResponse?.error ?? errOrResponse;
  const status = errOrResponse?.status ?? err?.status ?? 500;

  const message =
    (err && (err.message || err.msg)) ||
    (typeof err === 'string' ? err : 'Unexpected error');
  const code = err?.code || 'supabase_error';
  const details = err?.details;

  return {
    status,
    body: {
      error: code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export default {
  getSupabaseAdmin,
  getSupabasePublic,
  ensureEnv,
  formatSupabaseError,
};