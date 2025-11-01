import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // CORS: wildcard for compatibility; frontend prefers same-origin "/api/"
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      let query = supabase.from('notifications').select('*');
      if (userId) {
        query = query.eq('userId', userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      console.error('Supabase connection or query error in notifications GET:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else if (req.method === 'POST') {
    try {
      const { data, error } = await supabase.from('notifications').insert(req.body).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Supabase connection or query error in notifications POST:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      const { data, error } = await supabase.from('notifications').update(req.body).eq('id', id).select();
      if (error) throw error;
      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Supabase connection or query error in notifications PATCH:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}