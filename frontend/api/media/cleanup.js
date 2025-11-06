import supabase from "../_lib/supabase.js";

/**
 * Cleanup media:
 * - Recursively list ALL files in Supabase Storage bucket "media"
 * - Delete storage orphans (files not referenced anywhere in DB)
 * - Clean DB references (e.g., properties.media) that point to missing storage files
 *
 * Query/body controls:
 * - dryRun: boolean or ?dryRun=1   -> simulate, DO NOT delete/update, return preview
 * - cleanDb: boolean or ?cleanDb=0 -> toggle DB cleanup (default true)
 *
 * Notes:
 * - Requires SUPABASE_SERVICE_ROLE_KEY (checked by loader in ../_lib/supabase.js)
 * - Assumes properties.media is json/array-compatible (array of strings or objects with url/path)
 */

function escapeRegExp(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract a bucket-relative path from a value (full public URL or "media/..." or raw path)
// Returns: { path: "properties/123/abc.png", type: "bucket" } or { type: "external" } if not our bucket
function extractBucketPath(value, basePublic) {
  if (!value || typeof value !== "string") return { type: "none" };
  const s = value.trim();
  if (!s) return { type: "none" };

  // Full public URL of this project's "media" bucket
  if (basePublic && s.startsWith(basePublic)) {
    const rel = s.slice(basePublic.length);
    return rel ? { type: "bucket", path: rel.replace(/^\/+/, "") } : { type: "none" };
  }

  // Relative "media/<path>"
  if (s.startsWith("media/")) {
    return { type: "bucket", path: s.slice("media/".length).replace(/^\/+/, "") };
  }

  // Plain relative path that could be a bucket object
  // Heuristic: contains "/" and ends with a typical filename
  if (/[^/]+\/[^/]+/.test(s) && /\.[A-Za-z0-9]+$/.test(s)) {
    return { type: "bucket", path: s.replace(/^\/+/, "") };
  }

  // Non-bucket (external URL or something else)
  if (/^https?:\/\//i.test(s)) {
    return { type: "external" };
  }

  return { type: "none" };
}

function parseMediaField(media) {
  let m = media;
  if (typeof m === "string") {
    // Try JSON, fallback to comma list
    try {
      m = JSON.parse(m);
    } catch {
      m = m.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  if (m && !Array.isArray(m)) m = [m];
  if (!Array.isArray(m)) return [];
  return m;
}

function getItemUrlish(item) {
  if (item && typeof item === "object") {
    if (typeof item.url === "string" && item.url.trim()) return item.url.trim();
    if (typeof item.path === "string" && item.path.trim()) return item.path.trim();
  }
  if (typeof item === "string" && item.trim()) return item.trim();
  return "";
}

/**
 * Filter a media array by removing items that reference missing storage objects.
 * Keeps external URLs, removes "bucket" references not present in pathSet.
 * Returns { filtered, removedCount }
 */
function filterMediaAgainstBucket(media, pathSet, basePublic) {
  const arr = parseMediaField(media);
  const filtered = [];
  let removed = 0;

  for (const it of arr) {
    const val = getItemUrlish(it);
    if (!val) continue;

    const info = extractBucketPath(val, basePublic);
    if (info.type === "external") {
      filtered.push(it);
      continue;
    }
    if (info.type === "bucket") {
      const normalized = info.path.replace(/^public\//, "");
      if (pathSet.has(normalized)) {
        filtered.push(it);
      } else {
        removed++;
      }
      continue;
    }
    // Unknown/non-urlish -> keep as-is to avoid destructive edits
    filtered.push(it);
  }

  return { filtered, removedCount: removed };
}

async function listAllBucketPaths(bucket) {
  const result = [];
  const queue = [""];

  while (queue.length) {
    const prefix = queue.shift();
    // Page through possible large folders
    let offset = 0;
    const pageSize = 1000;
    /* eslint-disable no-constant-condition */
    while (true) {
      const { data: entries, error } = await supabase.storage
        .from(bucket)
        .list(prefix, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });

      if (error) return { error };
      if (!entries || entries.length === 0) break;

      for (const e of entries) {
        const isFile = e?.metadata && typeof e.metadata.size === "number";
        const full = prefix ? `${prefix.replace(/\/+$/, "")}/${e.name}` : e.name;
        if (isFile) {
          result.push(full);
        } else {
          // folder
          queue.push(`${full}/`);
        }
      }

      if (entries.length < pageSize) break;
      offset += entries.length;
    }
  }
  return { paths: result };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const bucket = "media";
    const supabaseUrl = process.env.SUPABASE_URL;
    const basePublic = `${(supabaseUrl || "").replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/`;

    const dryRun =
      String(req.query?.dryRun || "").trim() === "1" ||
      Boolean(req.body?.dryRun);

    const cleanDb =
      (req.query?.cleanDb === undefined && req.body?.cleanDb === undefined)
        ? true
        : !(
            String(req.query?.cleanDb || "").trim() === "0" ||
            req.body?.cleanDb === false
          );

    // 1) Recursively list ALL storage files in bucket
    const { paths: allPaths, error: listErr } = await listAllBucketPaths(bucket);
    if (listErr) {
      return res.status(400).json({ error: listErr.message || "Storage list error" });
    }
    const pathSet = new Set((allPaths || []).map((p) => p.replace(/^\/+/, "")));

    // 2) Scan DB rows to collect referenced paths (same heuristic as before)
    const [{ data: props, error: propErr }, { data: users, error: userErr }] =
      await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("users").select("*"),
      ]);

    if (propErr) return res.status(400).json({ error: propErr.message || "Failed to query properties" });
    if (userErr) return res.status(400).json({ error: userErr.message || "Failed to query users" });

    const referenced = new Set();

    const collectFromString = (s) => {
      if (!s || typeof s !== "string") return;

      if (basePublic) {
        const reFull = new RegExp(`${escapeRegExp(basePublic)}([^"\\s)]+)`, "g");
        let m;
        while ((m = reFull.exec(s)) !== null) {
          const p = m[1];
          if (p) referenced.add(p);
        }
      }
      const reMedia = /(?:^|[^A-Za-z0-9_])media\/([A-Za-z0-9._\-\/]+)/g;
      let m2;
      while ((m2 = reMedia.exec(s)) !== null) {
        const p2 = m2[1];
        if (p2) referenced.add(p2);
      }
    };

    const walkObject = (obj) => {
      if (obj == null) return;
      if (typeof obj === "string") {
        collectFromString(obj);
        return;
      }
      if (Array.isArray(obj)) {
        for (const v of obj) walkObject(v);
        return;
      }
      if (typeof obj === "object") {
        for (const k of Object.keys(obj)) {
          walkObject(obj[k]);
        }
      }
    };

    for (const row of props || []) walkObject(row);
    for (const row of users || []) walkObject(row);

    // Normalize referenced set
    const normalizedRef = new Set(
      Array.from(referenced)
        .map((p) => {
          try {
            const cleaned = String(p).replace(/^\/+/, "");
            return cleaned.startsWith("public/") ? cleaned.slice("public/".length) : cleaned;
          } catch {
            return String(p || "");
          }
        })
        .filter((p) => p && !/\/$/.test(p))
    );
    // Include decoded variants
    for (const p of Array.from(normalizedRef)) {
      try {
        const dec = decodeURIComponent(p);
        if (dec && dec !== p) normalizedRef.add(dec);
      } catch {
        // ignore
      }
    }

    // 3) Compute storage orphans (files present in storage but not referenced by DB)
    const orphans = (allPaths || []).filter((name) => {
      const n = String(name).replace(/^\/+/, "").replace(/^public\//, "");
      return !normalizedRef.has(n);
    });

    // 4) Optionally compute DB dangling references (DB references -> missing files)
    const danglingRefs = Array.from(normalizedRef).filter((p) => !pathSet.has(p));

    // 5) If dryRun, only preview the actions (orphans deletion and DB cleanup)
    if (dryRun) {
      // Preview DB cleanup on properties.media
      const { data: propLean } = await supabase.from("properties").select("id, media");
      const dbPreview = [];
      if (cleanDb && Array.isArray(propLean)) {
        for (const row of propLean) {
          const { filtered, removedCount } = filterMediaAgainstBucket(row.media, pathSet, basePublic);
          if (removedCount > 0) {
            const beforeCount = parseMediaField(row.media).length;
            dbPreview.push({
              id: row.id,
              beforeCount,
              afterCount: filtered.length,
              removedCount,
            });
          }
        }
      }

      return res.status(200).json({
        dryRun: true,
        message: `Dry run: ${orphans.length} storage orphan(s), ${danglingRefs.length} dangling DB reference(s).`,
        totalFiles: allPaths.length,
        referencedCount: normalizedRef.size,
        orphanCount: orphans.length,
        danglingDbRefCount: danglingRefs.length,
        orphans,
        dbPreview,
      });
    }

    // 6) Delete storage orphans (if any)
    let removed = [];
    if (orphans.length > 0) {
      const { data: removedData, error: removeErr } = await supabase.storage
        .from(bucket)
        .remove(orphans);
      if (removeErr) {
        return res.status(400).json({ error: removeErr.message || "Failed to remove orphan files" });
      }
      removed = removedData || orphans;
    }

    // 7) Clean DB references (properties.media only, conservative)
    let fixedRows = 0;
    let removedRefsTotal = 0;
    if (cleanDb) {
      const { data: propLean, error: propLeanErr } = await supabase.from("properties").select("id, media");
      if (propLeanErr) {
        return res.status(400).json({ error: propLeanErr.message || "Failed to query properties for cleanup" });
      }

      for (const row of propLean || []) {
        const beforeArr = parseMediaField(row.media);
        const { filtered, removedCount } = filterMediaAgainstBucket(row.media, pathSet, basePublic);
        if (removedCount > 0) {
          // Persist filtered media back as array; DB should accept jsonb/text[]
          const { error: updErr } = await supabase
            .from("properties")
            .update({ media: filtered })
            .eq("id", String(row.id));
          if (!updErr) {
            fixedRows++;
            removedRefsTotal += removedCount;
          }
        }
      }
    }

    return res.status(200).json({
      message: `Deleted ${removed.length} storage orphan file(s). Cleaned ${fixedRows} DB row(s), removed ${removedRefsTotal} dangling reference(s).`,
      totalFiles: allPaths.length,
      referencedCount: normalizedRef.size,
      orphanCount: orphans.length,
      deleted: removed,
      dbCleanedRows: fixedRows,
      dbRemovedRefs: removedRefsTotal,
    });
  } catch (e) {
    return res.status(400).json({ error: "Bad Request" });
  }
}