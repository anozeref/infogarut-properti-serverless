import supabase from "./_lib/supabase.js";

// Helper: compute base public URL for storage objects
function __computeMediaBase() {
  const m = process.env.MEDIA_BASE_URL;
  if (typeof m === "string" && /^https?:\/\//.test(m)) return m.replace(/\/+$/, "/");
  const s = process.env.SUPABASE_URL;
  if (typeof s === "string" && /^https?:\/\//.test(s)) return s.replace(/\/+$/, "") + "/storage/v1/object/public/media/";
  return null;
}

// Helper: normalize a single media item (string or object) into absolute URL when possible
function __transformMediaItem(item, base) {
  const u = (typeof item === "object" && item)
    ? (typeof item.url === "string" ? item.url : (typeof item.path === "string" ? item.path : ""))
    : String(item || "");
  if (!u) return "";
  if (/^https?:\/\//.test(u)) return u;
  return base ? `${base}${u}` : u;
}

// Helper: normalize row.media into an array of URLs (absolute if base known)
// - Supports legacy shapes: stringified JSON array, comma-separated string, single object/string
function __normalizeMediaRow(row, base) {
  const copy = { ...row };
  let media = copy.media;

  if (typeof media === "string") {
    let parsed = null;
    try {
      parsed = JSON.parse(media);
    } catch (_) {
      parsed = media.split(",").map(s => s.trim()).filter(Boolean);
    }
    media = parsed;
  }

  if (media && !Array.isArray(media)) {
    media = [media];
  }
  if (!Array.isArray(media)) {
    copy.media = [];
    return copy;
  }

  copy.media = media
    .map(m => __transformMediaItem(m, base))
    .filter(Boolean);

  return copy;
}

export default async function handler(req, res) {
  try {
    const { id } = req.query || {};

    if (req.method === "GET") {
      const { ownerId, statusPostingan, _sort, _order } = req.query || {};

      // GET single by id (for rewrites: /api/properties/:id -> /api/properties?id=:id)
      if (id) {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", String(id))
          .single();

        if (error) {
          return res.status(404).json({ error: "Not Found" });
        }
        const __base = __computeMediaBase();
        const __row = __normalizeMediaRow(data, __base);
        return res.status(200).json(__row);
      }

      // GET list
      let query = supabase.from("properties").select("*");

      if (ownerId) query = query.eq("ownerId", String(ownerId));
      if (statusPostingan) query = query.eq("statusPostingan", String(statusPostingan));
      if (_sort) {
        const ascending = String(_order || "asc").toLowerCase() !== "desc";
        query = query.order(_sort, { ascending });
      }

      const { data, error } = await query;
      if (error) {
        console.error("Properties GET error");
        return res.status(400).json({ error: error.message || "Query error" });
      }
      const __base = __computeMediaBase();
      const mapped = (data || []).map((row) => __normalizeMediaRow(row, __base));
      return res.status(200).json(mapped);
    }

    if (req.method === "POST") {
      const body = req.body || {};
      
      // Minimal validation for required fields
      const { namaProperti, ownerId, harga } = body;
      if (!namaProperti || !ownerId || typeof harga !== "number") {
        return res.status(400).json({ error: "Missing required fields", code: "validation_error" });
      }
      
      const now = new Date();
      const ddmmyyyy = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      const payload = {
        postedAt: body.postedAt || ddmmyyyy,
        ...body,
      };

      const { data: created, error } = await supabase
        .from("properties")
        .insert([payload])
        .select()
        .single();

      if (error) {
        const code = error?.code;
        const status = code === "23505" ? 409 : code === "42501" ? 403 : 400;
        try { console.error("properties.create error", { path: "/api/properties:POST", code, message: error?.message }); } catch (_) {}
        return res.status(status).json({ error: error?.message || "Operation failed", code });
      }
      return res.status(201).json(created);
    }

    if (req.method === "PATCH") {
      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }
      const updated = req.body || {};
      if (Object.prototype.hasOwnProperty.call(updated, "id")) {
        delete updated.id;
      }

      const { data, error } = await supabase
        .from("properties")
        .update(updated)
        .eq("id", String(id))
        .select()
        .single();

      if (error) {
        const code = error?.code;
        const status = code === "23505" ? 409 : code === "42501" ? 403 : 400;
        try { console.error("properties.update error", { path: "/api/properties:PATCH", code, message: error?.message }); } catch (_) {}
        return res.status(status).json({ error: error?.message || "Operation failed", code });
      }
      return res.status(200).json(data);
    }

    if (req.method === "DELETE") {
      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", String(id));

      if (error) {
        console.error("Properties DELETE error");
        return res.status(400).json({ error: error.message || "Delete error" });
      }
      return res.status(200).json({});
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Properties route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}