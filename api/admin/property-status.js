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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
 
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const { propertyId, status, namaProperti, ownerId } = req.body;

      // Update property status
      const { error: updateError } = await supabase
        .from('properties')
        .update({ statusPostingan: status })
        .eq('id', propertyId);

      if (updateError) throw updateError;

      // Create notification
      const statusText = status === 'approved' ? 'disetujui' : 'ditolak';
      const link = status === 'approved' ? '/user/propertiaktif' : '/user/propertiditolak';

      const notification = {
        userId: ownerId,
        text: `Properti '${namaProperti}' Anda telah ${statusText} oleh admin.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        link: link
      };

      const { error: notifError } = await supabase.from('notifications').insert(notification);
      if (notifError) throw notifError;

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Supabase connection or query error in property-status:', error.message);
      res.status(500).json({ error: 'Database connection failed' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}