import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}