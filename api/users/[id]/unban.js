import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'PATCH') {
    try {
      const { id } = req.query;
      const { data, error } = await supabase.from('users').update({ banned: false }).eq('id', id).select();
      if (error) throw error;
      if (data.length === 0) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
      }
      res.status(200).json({ success: true, user: data[0] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}