// Migration script: legacy JSON + filesystem media to Supabase
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL environment variable.');
  }
  if (!SUPABASE_SERVICE_ROLE && !SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY environment variable. Provide at least one.');
  }
  const key = SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY;
  return { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY, key };
}

function parseDMY(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [_, dd, mm, yyyy, HH = '00', MM = '00', SS = '00'] = m;
  const iso = `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}Z`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toIso(d) {
  if (!d) return null;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof d === 'string') {
    // Try ISO
    const isoCandidate = new Date(d);
    if (!isNaN(isoCandidate.getTime())) {
      return isoCandidate.toISOString();
    }
    // Try DD/MM/YYYY HH:mm:ss
    const parsed = parseDMY(d);
    return parsed;
  }
  return null;
}

function mapUser(u) {
  return {
    id: u.id,
    name: u.nama ?? null,
    username: u.username ?? null,
    email: u.email ?? null,
    // WARNING: do not migrate plaintext passwords; store for now as legacy_password for manual handling
    legacy_password: u.password ?? null,
    phone: u.no_hp ?? null,
    role: u.role ?? 'user',
    district: u.kecamatan ?? null,
    village: u.desa ?? null,
    address: u.alamat ?? null,
    joined_at: toIso(u.joinedAt),
    verified: u.verified ?? null,
    suspended_until: toIso(u.suspendedUntil),
    banned: u.banned ?? null,
    banned_at: toIso(u.bannedAt),
  };
}

function mapProperty(p) {
  // Normalize jenisProperti to snake-cased enum if needed
  const kind = p.jenisProperti ? String(p.jenisProperti).toLowerCase() : null; // 'jual'|'sewa'
  return {
    id: p.id,
    name: p.namaProperti ?? null,
    listing_kind: kind,
    property_type: p.tipeProperti ?? null,
    location: p.lokasi ?? null,
    district: p.kecamatan ?? null,
    village: p.desa ?? null,
    price: p.harga ?? null,
    land_area: p.luasTanah ?? null,
    building_area: p.luasBangunan ?? null,
    bedrooms: p.kamarTidur ?? null,
    bathrooms: p.kamarMandi ?? null,
    period_number: p.periodeAngka ?? null,
    period_unit: p.periodeSatuan ?? null,
    rent_period: p.periodeSewa ?? null,
    description: p.deskripsi ?? null,
    owner_id: p.ownerId ?? p.userId ?? null,
    status_postingan: p.statusPostingan ?? null,
    posted_at: toIso(p.postedAt),
    lat: p.koordinat?.lat ?? null,
    lng: p.koordinat?.lng ?? null,
  };
}

function mapNotification(n) {
  return {
    id: n.id,
    user_id: n.userId ?? null,
    text: n.text ?? null,
    is_read: n.isRead ?? false,
    created_at: toIso(n.createdAt),
    link: n.link ?? null,
  };
}

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.avif':
      return 'image/avif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function chunk(arr, size = 500) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  try {
    const { SUPABASE_URL, key } = getEnv();
    const supabase = createClient(SUPABASE_URL, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Load legacy dataset
    const db = JSON.parse(fs.readFileSync('backend/db.json', 'utf-8'));
    if (!db || !db.users || !db.properties || !db.notifications) {
      throw new Error('Legacy dataset missing required keys: users, properties, notifications');
    }

    // Upsert users
    const mappedUsers = db.users.map(mapUser);
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .upsert(mappedUsers, { onConflict: 'id' });
    if (usersErr) throw usersErr;
    console.log(`Users upserted: ${mappedUsers.length}`);

    // Upsert properties
    const mappedProperties = db.properties.map(mapProperty);
    const { data: propsData, error: propsErr } = await supabase
      .from('properties')
      .upsert(mappedProperties, { onConflict: 'id' });
    if (propsErr) throw propsErr;
    console.log(`Properties upserted: ${mappedProperties.length}`);

    // Media migration
    let mediaUploaded = 0;
    let mediaSkipped = 0;
    const propertyMediaRows = [];
    for (const p of db.properties) {
      const propId = p.id;
      const files = Array.isArray(p.media) ? p.media : [];
      for (const f of files) {
        const filePath = path.join('backend', 'public', 'media', f);
        if (!fs.existsSync(filePath)) {
          mediaSkipped++;
          console.warn(`Media missing, skipping: property=${propId} file=${f}`);
          continue;
        }
        try {
          const buffer = fs.readFileSync(filePath);
          const contentType = getContentType(f);
          const storagePath = `properties/${propId}/${f}`;
          const { data: upData, error: upErr } = await supabase
            .storage
            .from('media')
            .upload(storagePath, buffer, {
              contentType,
              cacheControl: '3600',
              upsert: true,
            });
          if (upErr) {
            console.error(`Upload failed for ${storagePath}:`, upErr.message || upErr);
            continue;
          }
          mediaUploaded++;
          propertyMediaRows.push({
            property_id: propId,
            filename: f,
            storage_path: storagePath,
            mime_type: contentType,
            size_bytes: buffer.length,
          });
        } catch (e) {
          console.error(`Error processing media for property=${propId} file=${f}:`, e);
        }
      }
    }

    // Insert property_media in batches
    let mediaRowsInserted = 0;
    const batches = chunk(propertyMediaRows, 500);
    for (const batch of batches) {
      if (batch.length === 0) continue;
      const { data: pmData, error: pmErr } = await supabase
        .from('property_media')
        .upsert(batch, { onConflict: 'property_id,filename' });
      if (pmErr) {
        console.error('property_media upsert batch error:', pmErr);
        continue;
      }
      mediaRowsInserted += batch.length;
    }
    console.log(`Media uploaded: ${mediaUploaded}, media rows inserted: ${mediaRowsInserted}, missing files skipped: ${mediaSkipped}`);

    // Upsert notifications
    const mappedNotifications = db.notifications.map(mapNotification);
    const { data: notifData, error: notifErr } = await supabase
      .from('notifications')
      .upsert(mappedNotifications, { onConflict: 'id' });
    if (notifErr) throw notifErr;
    console.log(`Notifications upserted: ${mappedNotifications.length}`);

    // Insert user bans where applicable and update users.banned_at
    let bansInserted = 0;
    for (const u of db.users) {
      const banned = !!u.banned;
      const bannedAtIso = toIso(u.bannedAt) || new Date().toISOString();
      if (banned) {
        const banRow = {
          user_id: u.id,
          reason: 'imported from legacy',
          banned_at: bannedAtIso,
        };
        const { data: banData, error: banErr } = await supabase
          .from('user_bans')
          .upsert([banRow], { onConflict: 'user_id' });
        if (banErr) {
          console.error(`Failed to upsert user_bans for user ${u.id}:`, banErr);
        } else {
          bansInserted += 1;
        }
      }
      if (u.bannedAt) {
        const { error: updErr } = await supabase
          .from('users')
          .update({ banned_at: bannedAtIso })
          .eq('id', u.id);
        if (updErr) {
          console.error(`Failed to update users.banned_at for user ${u.id}:`, updErr);
        }
      }
    }
    console.log(`User bans inserted (or ensured via upsert): ${bansInserted}`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Kick off
main();