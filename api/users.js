import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS: allow any origin since frontend now uses same-origin relative "/api/".
  // Keeping wildcard for compatibility with previews and local dev.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    // Use 204 for preflight responses
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const { username, password, email } = req.query;

      // Login: return single user object
      if (username && password) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (error || !data) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        return res.status(200).json(data);
      }

      // Username existence check (used by register flow)
      if (username) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username);
        if (error) throw error;
        return res.status(200).json(data ?? []);
      }

      // Email existence check (used by register flow)
      if (email) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email);
        if (error) throw error;
        return res.status(200).json(data ?? []);
      }

      // Default: fetch all users
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase.from('users').insert(req.body).select();
      if (error) throw error;
      return res.status(201).json(data[0]);
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { data, error } = await supabase.from('users').update(req.body).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Supabase connection or query error in users handler:', error?.message || error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}