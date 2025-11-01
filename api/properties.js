import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS: use wildcard to support previews and any origin. Frontend now prefers same-origin "/api/".
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    // Reply to preflight without body
    return res.status(204).end();
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('properties').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { data, error } = await supabase.from('properties').insert(req.body).select();
      if (error) throw error;
      return res.status(201).json(data?.[0] ?? null);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, deletedId: id });
    }

    if (req.method === 'PATCH') {
      const { id } = req.query;
      const { data, error } = await supabase.from('properties').update(req.body).eq('id', id).select();
      if (error) throw error;
      return res.status(200).json(data?.[0] ?? null);
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Supabase connection or query error in properties handler:', error?.message || error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
}