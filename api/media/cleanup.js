import { createClient } from '@supabase/supabase-js';
import { list, del } from '@vercel/blob';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Get all properties to find used media files
      const { data: properties, error } = await supabase.from('properties').select('media');
      if (error) throw error;

      // Collect all used file URLs
      const usedFiles = new Set();
      properties.forEach(prop => {
        if (prop.media && Array.isArray(prop.media)) {
          prop.media.forEach(url => usedFiles.add(url));
        }
      });

      // List all files in Vercel Blob
      const { blobs } = await list();

      let deletedCount = 0;
      for (const blob of blobs) {
        if (!usedFiles.has(blob.url)) {
          await del(blob.url);
          deletedCount++;
        }
      }

      res.status(200).json({ message: `${deletedCount} file tidak terpakai telah dihapus.` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}