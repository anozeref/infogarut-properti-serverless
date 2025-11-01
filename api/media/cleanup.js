import { getSupabaseAdmin, formatSupabaseError } from '../_lib/supabase.js';

const BUCKET = 'media';
const LIST_LIMIT = 100;
const REMOVE_CHUNK_SIZE = 100;

// List all file objects (names only) under a given prefix with pagination.
// Skips subdirectories; returns files only.
export async function listAllObjects(supabase, prefix) {
  const names = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, {
        limit: LIST_LIMIT,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      // On error, stop listing for this prefix but allow caller to continue for others
      break;
    }

    // Filter files only: files have metadata (e.g., size/mimetype) while folders typically have null metadata/id
    for (const item of data || []) {
      if (item?.metadata && typeof item.metadata.size === 'number') {
        names.push(item.name);
      }
    }

    if (!data || data.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }

  return names;
}

// List directory names (top-level subfolders) under a given prefix with pagination.
async function listDirectories(supabase, prefix) {
  const dirs = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, {
        limit: LIST_LIMIT,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) {
      break;
    }

    for (const item of data || []) {
      // Heuristic: directory entries typically have null metadata (and often null id)
      if (!item?.metadata) {
        // item.name is directory name relative to prefix
        dirs.push(item.name);
      }
    }

    if (!data || data.length < LIST_LIMIT) break;
    offset += LIST_LIMIT;
  }

  return dirs;
}

// Split an array into chunks of given size
export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const supabase = getSupabaseAdmin();

  // 1) Query DB references
  const { data: refs, error: dbError, status: dbStatus } = await supabase
    .from('property_media')
    .select('property_id, filename');

  if (dbError) {
    const { status, body } = formatSupabaseError({ error: dbError, status: dbStatus || 500 });
    res.status(status).json(body);
    return;
  }

  // Build map: propertyId -> Set(filenames)
  const refMap = new Map();
  for (const row of refs || []) {
    const pid = String(row.property_id);
    const fname = String(row.filename);
    if (!refMap.has(pid)) refMap.set(pid, new Set());
    refMap.get(pid).add(fname);
  }

  // Also list property folders present in storage to detect properties with no DB references
  const storagePropertyIds = await listDirectories(supabase, 'properties');

  // Union of propertyIds from DB references and storage folders
  const propertyIds = new Set([
    ...Array.from(refMap.keys()),
    ...storagePropertyIds.map(String),
  ]);

  let totalDeleted = 0;

  // 2) For each propertyId, list existing files and compute orphans
  for (const propertyId of propertyIds) {
    // List all files in storage for this property
    const storageFiles = await listAllObjects(supabase, `properties/${propertyId}`);

    if (!storageFiles.length) {
      continue;
    }

    const referenced = refMap.get(propertyId) || new Set(); // if missing, treat all as orphans
    const orphans = storageFiles.filter((name) => !referenced.has(name));

    if (!orphans.length) continue;

    // 4) Batch remove
    const keys = orphans.map((name) => `properties/${propertyId}/${name}`);
    const batches = chunk(keys, REMOVE_CHUNK_SIZE);

    for (const batch of batches) {
      const { data: removed, error: rmError } = await supabase.storage.from(BUCKET).remove(batch);
      if (rmError) {
        // Continue with next property/batch even if error occurs
        continue;
      }
      // Count deletions from API response if available; fallback to batch size
      if (Array.isArray(removed)) {
        totalDeleted += removed.length;
      } else {
        totalDeleted += batch.length;
      }
    }
  }

  // 5) Return legacy-style message
  res.status(200).json({
    message: `${totalDeleted} file tidak terpakai telah dihapus.`,
  });
}