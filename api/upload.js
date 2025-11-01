import Busboy from 'busboy';
import { getSupabaseAdmin, formatSupabaseError } from './_lib/supabase.js';

const BUCKET = 'media';
const MAX_FILES = 4;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Parse multipart/form-data using Busboy, collecting up to MAX_FILES under field "media"
export function parseMultipartWithBusboy(req) {
  return new Promise((resolve, reject) => {
    try {
      const bb = Busboy({ headers: req.headers, limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE } });
      const files = [];
      const fields = {};

      bb.on('file', (fieldname, file, info) => {
        const { filename, mimeType } = info;
        if (fieldname !== 'media') {
          // ignore non-"media" fields
          file.resume();
          return;
        }

        const chunks = [];
        let tooLarge = false;
        let size = 0;

        file.on('limit', () => {
          // triggered when file exceeds MAX_FILE_SIZE
          tooLarge = true;
        });

        file.on('data', (data) => {
          if (tooLarge) return; // ignore further chunks
          size += data.length;
          chunks.push(data);
        });

        file.on('end', () => {
          if (!tooLarge) {
            files.push({
              filename,
              mimetype: mimeType || 'application/octet-stream',
              buffer: Buffer.concat(chunks),
            });
          }
        });
      });

      bb.on('field', (name, val) => {
        if (typeof val === 'string') {
          fields[name] = val;
        }
      });

      bb.on('error', (err) => reject(err));
      bb.on('finish', () => resolve({ files, fields }));

      req.pipe(bb);
    } catch (err) {
      reject(err);
    }
  });
}

// Upload a single file buffer to Supabase Storage
export async function uploadFile(supabase, storagePath, buffer, contentType) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });
  return !error;
}

// ESM-style handler preserving legacy response shape
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const supabase = getSupabaseAdmin();

  let parsed;
  try {
    parsed = await parseMultipartWithBusboy(req);
  } catch (err) {
    res.status(400).json({ error: 'Invalid multipart/form-data' });
    return;
  }

  const { files, fields } = parsed;
  const propertyId = (fields.propertyId || '').trim() || null;
  const tempId = (fields.tempId || '').trim() || null;

  const targetPrefix = propertyId
    ? `properties/${propertyId}`
    : `staging/${tempId || 'anon'}`;

  const acceptedFilenames = [];

  // attempt upload each valid file; skip failures and too-large files already filtered
  for (const f of files) {
    if (!f || !f.buffer || f.buffer.length === 0) {
      // empty buffer likely due to size limit
      continue;
    }
    const storagePath = `${targetPrefix}/${f.filename}`;
    try {
      const ok = await uploadFile(supabase, storagePath, f.buffer, f.mimetype);
      if (ok) {
        acceptedFilenames.push(f.filename);
      }
    } catch {
      // skip on error; continue with remaining files
    }
  }

  if (acceptedFilenames.length === 0) {
    res.status(400).json({ error: 'Tidak ada file yang diterima. Pastikan ukuran per file <= 20MB dan format sesuai.' });
    return;
  }

  res.status(200).json({ files: acceptedFilenames });
}