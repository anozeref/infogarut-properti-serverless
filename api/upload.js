import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const files = req.body.files; // Array of file objects from frontend
      const uploadedUrls = [];

      for (const file of files) {
        // Upload to Vercel Blob
        const blob = await put(file.name, Buffer.from(file.data, 'base64'), {
          access: 'public',
        });
        uploadedUrls.push(blob.url);
      }

      res.status(200).json({ files: uploadedUrls });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};