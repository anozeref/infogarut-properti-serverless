import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { username, password } = req.query;
      if (username && password) {
        // Login logic
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();
        if (error || !data) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.status(200).json(data);
      } else {
        // Fetch all users (existing logic)
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        res.status(200).json(data);
      }
    } catch (error) {
      console.error('Supabase connection or query error in users GET:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else if (req.method === 'POST') {
    try {
      const { data, error } = await supabase.from('users').insert(req.body).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      console.error('Supabase connection or query error in users POST:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      const { data, error } = await supabase.from('users').update(req.body).eq('id', id).select();
      if (error) throw error;
      res.status(200).json(data[0]);
    } catch (error) {
      console.error('Supabase connection or query error in users PATCH:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}