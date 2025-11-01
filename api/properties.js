import { getSupabaseAdmin, formatSupabaseError } from './_lib/supabase.js';

function parseIdFromUrl(req) {
  try {
    const raw = req.url || '';
    const path = raw.split('?')[0];
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1];
    return last && last !== 'properties' ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

function toIso(value) {
  if (!value) return null;
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function buildInsertPayload(body) {
  const koordinat = body.koordinat || {};
  return {
    id: body.id, // client must provide legacy short id
    nama_properti: body.namaProperti,
    jenis_properti: body.jenisProperti,
    tipe_properti: body.tipeProperti,
    lokasi: body.lokasi ?? null,
    kecamatan: body.kecamatan ?? null,
    desa: body.desa ?? null,
    harga: typeof body.harga === 'number' ? body.harga : (body.harga ? Number(body.harga) : null),
    luas_tanah: body.luasTanah ?? null,
    luas_bangunan: body.luasBangunan ?? null,
    kamar_tidur: body.kamarTidur ?? null,
    kamar_mandi: body.kamarMandi ?? null,
    periode_angka: body.periodeAngka ?? null,
    periode_satuan: body.periodeSatuan ?? null,
    periode_sewa: body.periodeSewa ?? null,
    deskripsi: body.deskripsi ?? null,
    owner_id: body.ownerId,
    user_id: body.userId ?? body.ownerId ?? null,
    status_postingan: body.statusPostingan ?? 'pending',
    posted_at: toIso(body.postedAt) ?? new Date().toISOString(),
    lat: koordinat.lat ?? null,
    lng: koordinat.lng ?? null,
  };
}

function buildUpdatePayload(body) {
  const p = {};
  if ('namaProperti' in body) p.nama_properti = body.namaProperti;
  if ('jenisProperti' in body) p.jenis_properti = body.jenisProperti;
  if ('tipeProperti' in body) p.tipe_properti = body.tipeProperti;
  if ('lokasi' in body) p.lokasi = body.lokasi;
  if ('kecamatan' in body) p.kecamatan = body.kecamatan;
  if ('desa' in body) p.desa = body.desa;
  if ('harga' in body) p.harga = typeof body.harga === 'number' ? body.harga : (body.harga ? Number(body.harga) : null);
  if ('luasTanah' in body) p.luas_tanah = body.luasTanah;
  if ('luasBangunan' in body) p.luas_bangunan = body.luasBangunan;
  if ('kamarTidur' in body) p.kamar_tidur = body.kamarTidur;
  if ('kamarMandi' in body) p.kamar_mandi = body.kamarMandi;
  if ('periodeAngka' in body) p.periode_angka = body.periodeAngka;
  if ('periodeSatuan' in body) p.periode_satuan = body.periodeSatuan;
  if ('periodeSewa' in body) p.periode_sewa = body.periodeSewa;
  if ('deskripsi' in body) p.deskripsi = body.deskripsi;
  if ('ownerId' in body) p.owner_id = body.ownerId;
  if ('userId' in body) p.user_id = body.userId;
  if ('statusPostingan' in body) p.status_postingan = body.statusPostingan;
  if ('postedAt' in body) p.posted_at = toIso(body.postedAt);
  if (body.koordinat && ('lat' in body.koordinat)) p.lat = body.koordinat.lat;
  if (body.koordinat && ('lng' in body.koordinat)) p.lng = body.koordinat.lng;
  return p;
}

function dbToProperty(row, mediaMap) {
  const media = mediaMap?.[row.id] || [];
  return {
    id: row.id,
    namaProperti: row.nama_properti ?? null,
    jenisProperti: row.jenis_properti ?? null,
    tipeProperti: row.tipe_properti ?? null,
    lokasi: row.lokasi ?? null,
    kecamatan: row.kecamatan ?? null,
    desa: row.desa ?? null,
    harga: typeof row.harga === 'number' ? row.harga : (row.harga ? Number(row.harga) : null),
    luasTanah: row.luas_tanah ?? null,
    luasBangunan: row.luas_bangunan ?? null,
    kamarTidur: row.kamar_tidur ?? null,
    kamarMandi: row.kamar_mandi ?? null,
    periodeAngka: row.periode_angka ?? null,
    periodeSatuan: row.periode_satuan ?? null,
    periodeSewa: row.periode_sewa ?? null,
    deskripsi: row.deskripsi ?? null,
    ownerId: row.owner_id ?? null,
    userId: row.user_id ?? row.owner_id ?? null,
    statusPostingan: row.status_postingan ?? null,
    postedAt: toIso(row.posted_at),
    koordinat: { lat: row.lat ?? null, lng: row.lng ?? null },
    media,
  };
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();
  const id = parseIdFromUrl(req);

  try {
    if (req.method === 'GET') {
      if (id) {
        const { data: property, error, status } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          const formatted = formatSupabaseError({ error, status });
          if (formatted.status === 406 || status === 406) {
            res.status(404).json({ error: 'Not found' });
            return;
          }
          res.status(formatted.status).json(formatted.body);
          return;
        }

        const { data: mediaRows } = await supabase
          .from('property_media')
          .select('property_id, filename')
          .eq('property_id', property.id);

        const mediaMap = {};
        (mediaRows || []).forEach((m) => {
          mediaMap[m.property_id] = mediaMap[m.property_id] || [];
          mediaMap[m.property_id].push(m.filename);
        });

        res.json(dbToProperty(property, mediaMap));
        return;
      }

      const q = supabase.from('properties').select('*');
      const { ownerId, statusPostingan } = req.query || {};
      if (ownerId) q.eq('owner_id', ownerId);
      if (statusPostingan) q.eq('status_postingan', statusPostingan);

      const { data: rows, error, status } = await q;
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      const ids = (rows || []).map((r) => r.id);
      let mediaMap = {};
      if (ids.length) {
        const { data: mediaRows } = await supabase
          .from('property_media')
          .select('property_id, filename')
          .in('property_id', ids);
        (mediaRows || []).forEach((m) => {
          mediaMap[m.property_id] = mediaMap[m.property_id] || [];
          mediaMap[m.property_id].push(m.filename);
        });
      }

      res.json((rows || []).map((r) => dbToProperty(r, mediaMap)));
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.id) {
        res.status(400).json({ error: 'Missing id' });
        return;
      }
      if (!body.namaProperti || !body.jenisProperti || !body.tipeProperti || !body.ownerId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const payload = buildInsertPayload(body);
      const { data: inserted, error, status } = await supabase
        .from('properties')
        .insert([payload])
        .select('*')
        .single();
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      // media insert
      const files = Array.isArray(body.media) ? body.media : [];
      if (files.length) {
        const rows = files.map((filename) => ({
          property_id: body.id,
          filename,
          storage_path: `properties/${body.id}/${filename}`,
        }));
        await supabase.from('property_media').insert(rows);
      }

      // best-effort move from staging tempId
      if (body.tempId && files.length) {
        const bucket = supabase.storage.from('media');
        await Promise.all(
          files.map(async (filename) => {
            const from = `staging/${body.tempId}/${filename}`;
            const to = `properties/${body.id}/${filename}`;
            try {
              await bucket.move(from, to);
            } catch {
              // ignore
            }
          })
        );
      }

      // fetch media to respond
      const { data: mediaRows } = await supabase
        .from('property_media')
        .select('property_id, filename')
        .eq('property_id', inserted.id);
      const mediaMap = {};
      (mediaRows || []).forEach((m) => {
        mediaMap[m.property_id] = mediaMap[m.property_id] || [];
        mediaMap[m.property_id].push(m.filename);
      });

      res.status(201).json(dbToProperty(inserted, mediaMap));
      return;
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      if (!id) {
        res.status(400).json({ error: 'Missing id in URL' });
        return;
      }
      const body = req.body || {};

      const { data: existing, error: errExisting, status: stExisting } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (errExisting || !existing) {
        if (stExisting === 406) {
          res.status(404).json({ error: 'Not found' });
          return;
        }
        const formatted = formatSupabaseError({ error: errExisting, status: stExisting });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      const payload = buildUpdatePayload(body);
      let statusChanged = false;
      if (payload.status_postingan && payload.status_postingan !== existing.status_postingan) {
        statusChanged = true;
        await supabase.from('property_status_changes').insert([{
          property_id: id,
          changed_by: body.adminId ?? body.userId ?? null,
          previous_status: existing.status_postingan,
          new_status: payload.status_postingan,
          note: body.note ?? null,
        }]);
      }

      const { data: updated, error, status } = await supabase
        .from('properties')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      if (statusChanged && ['approved', 'rejected'].includes(updated.status_postingan)) {
        await supabase.from('notifications').insert([{
          user_id: updated.owner_id,
          text: `Status properti '${updated.nama_properti}' telah diperbarui menjadi ${updated.status_postingan}`,
          is_read: false,
          link: body.link ?? '/user/properti',
        }]);
      }

      // media reconciliation: insert new ones, skip deletion
      if (Array.isArray(body.media)) {
        const { data: existingMedia } = await supabase
          .from('property_media')
          .select('filename')
          .eq('property_id', id);
        const current = new Set((existingMedia || []).map((m) => m.filename));
        const incoming = new Set(body.media);
        const newFiles = [...incoming].filter((f) => !current.has(f));
        if (newFiles.length) {
          const rows = newFiles.map((filename) => ({
            property_id: id,
            filename,
            storage_path: `properties/${id}/${filename}`,
          }));
            await supabase.from('property_media').insert(rows);
        }
      }

      // fetch media to respond
      const { data: mediaRows } = await supabase
        .from('property_media')
        .select('property_id, filename')
        .eq('property_id', updated.id);
      const mediaMap = {};
      (mediaRows || []).forEach((m) => {
        mediaMap[m.property_id] = mediaMap[m.property_id] || [];
        mediaMap[m.property_id].push(m.filename);
      });

      res.json(dbToProperty(updated, mediaMap));
      return;
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.status(400).json({ error: 'Missing id in URL' });
        return;
      }

      const { error, status } = await supabase.from('properties').delete().eq('id', id);
      if (error) {
        const formatted = formatSupabaseError({ error, status });
        res.status(formatted.status).json(formatted.body);
        return;
      }

      // best-effort storage cleanup
      try {
        const bucket = supabase.storage.from('media');
        const { data: objs } = await bucket.list(`properties/${id}`, { limit: 1000 });
        if (Array.isArray(objs) && objs.length) {
          const paths = objs.map((o) => `properties/${id}/${o.name}`);
          await bucket.remove(paths);
        }
      } catch {
        // ignore storage errors
      }

      res.json({ success: true, deletedId: String(id) });
      return;
    }

    res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE');
    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (unexpected) {
    const formatted = formatSupabaseError(unexpected);
    res.status(formatted.status || 500).json(formatted.body || { error: 'Unexpected error' });
  }
}