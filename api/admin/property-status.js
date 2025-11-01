import { getSupabaseAdmin, formatSupabaseError } from './_lib/supabase.js';

function toIso(value) {
  if (!value) return null;
  try {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

function dbToProperty(row, media) {
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
    media: Array.isArray(media) ? media : [],
  };
}

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const id = body.id;
    const newStatus = body.statusPostingan;
    const note = body.note ?? null;
    const changedBy = body.adminId ?? null;
    const link = body.link ?? '/user/properti';

    if (!id) {
      res.status(400).json({ error: 'Missing required field: id' });
      return;
    }
    if (!newStatus || typeof newStatus !== 'string') {
      res.status(400).json({ error: 'Missing or invalid field: statusPostingan' });
      return;
    }

    // Load current property
    const { data: property, error: loadErr, status: loadStatus } = await supabase
      .from('properties')
      .select('id, owner_id, nama_properti, status_postingan, posted_at, lat, lng, jenis_properti, tipe_properti, lokasi, kecamatan, desa, harga, luas_tanah, luas_bangunan, kamar_tidur, kamar_mandi, periode_angka, periode_satuan, periode_sewa, deskripsi, user_id')
      .eq('id', id)
      .single();

    if (loadErr || !property) {
      if (loadStatus === 406) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const formatted = formatSupabaseError({ error: loadErr, status: loadStatus });
      res.status(formatted.status).json(formatted.body);
      return;
    }

    // Insert status change audit
    const { error: auditErr, status: auditStatus } = await supabase
      .from('property_status_changes')
      .insert([{
        property_id: id,
        changed_by: changedBy,
        previous_status: property.status_postingan,
        new_status: newStatus,
        note,
      }]);
    if (auditErr) {
      const formatted = formatSupabaseError({ error: auditErr, status: auditStatus });
      res.status(formatted.status).json(formatted.body);
      return;
    }

    // Update property status
    const { data: updated, error: updErr, status: updStatus } = await supabase
      .from('properties')
      .update({ status_postingan: newStatus })
      .eq('id', id)
      .select('*')
      .single();
    if (updErr) {
      const formatted = formatSupabaseError({ error: updErr, status: updStatus });
      res.status(formatted.status).json(formatted.body);
      return;
    }

    // Create notification to owner
    const text = `Status properti '${updated.nama_properti}' telah diperbarui menjadi ${newStatus}`;
    const { error: notifErr, status: notifStatus } = await supabase
      .from('notifications')
      .insert([{
        user_id: updated.owner_id,
        text,
        is_read: false,
        link,
      }]);
    if (notifErr) {
      const formatted = formatSupabaseError({ error: notifErr, status: notifStatus });
      res.status(formatted.status).json(formatted.body);
      return;
    }

    // Assemble media filenames
    const { data: mediaRows } = await supabase
      .from('property_media')
      .select('filename')
      .eq('property_id', id);
    const media = (mediaRows || []).map((m) => m.filename);

    res.json({
      success: true,
      property: dbToProperty(updated, media),
    });
  } catch (unexpected) {
    const formatted = formatSupabaseError(unexpected);
    res.status(formatted.status || 500).json(formatted.body || { error: 'Unexpected error' });
  }
}