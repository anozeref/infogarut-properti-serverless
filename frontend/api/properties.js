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

/**
 * Helper: generate or extract a correlation ID
 * - Prefer x-request-id header if provided
 * - Otherwise generate timestamp+random
 */
function __getCorrelationId(req) {
  try {
    const h =
      (req && req.headers && (req.headers["x-request-id"] || req.headers["X-Request-Id"] || req.headers["x-requestid"])) ||
      null;
    if (typeof h === "string" && h.trim()) return h.trim();
  } catch (_) {}
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rnd}`;
}

/**
 * Helper: build validation details for POST /api/properties
 * Only checks existing required fields enforced by the route:
 * - namaProperti missing/empty
 * - ownerId missing/empty
 * - harga must be a finite number
 */
function __buildValidationDetails(body) {
  const details = [];
  const { namaProperti, ownerId, harga } = body || {};

  if (!namaProperti || (typeof namaProperti === "string" && !namaProperti.trim())) {
    details.push({ field: "namaProperti", issue: "missing or empty" });
  }
  if (!ownerId || (typeof ownerId === "string" && !String(ownerId).trim())) {
    details.push({ field: "ownerId", issue: "missing or empty" });
  }
  if (!(typeof harga === "number" && Number.isFinite(harga))) {
    details.push({ field: "harga", issue: "must be a finite number" });
  }

  return details;
}

export default async function handler(req, res) {
  let __corrId = null;
  try {
    __corrId = __getCorrelationId(req);
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
      const correlationId = __corrId;
      const body = req.body || {};

      // Request logging (minimal payload summary; no secrets)
      try {
        console.info("[properties][POST]", {
          correlationId,
          keys: Object.keys(body || {}),
          mediaCount: Array.isArray(body?.media) ? body.media.length : 0,
        });
      } catch (_) {}

      // Enhanced validation with standardized error shape
      const details = __buildValidationDetails(body);
      if (details.length) {
        try { console.warn("[properties][POST][validation]", { correlationId, details }); } catch (_) {}
        return res.status(400).json({
          error: "Validation failed",
          code: "validation_error",
          details,
          correlationId,
        });
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
        const dbErr = {
          message: error?.message,
          hint: error?.hint || null,
          details: error?.details || null,
          code: error?.code || null,
          constraint: error?.constraint || null,
        };
        try { console.error("[properties][POST][db_error]", { correlationId, db: dbErr }); } catch (_) {}
        return res.status(status).json({
          error: "Database insert failed",
          code: "db_insert_error",
          db: dbErr,
          correlationId,
        });
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
    const correlationId = __corrId || __getCorrelationId(req);
    try {
      console.error("[properties][unhandled_exception]", {
        correlationId,
        stack: (e && e.stack) || (e && e.message) || String(e),
      });
    } catch (_) {}
    return res.status(400).json({ error: "Bad Request", code: "unhandled_exception", correlationId });
  }
}