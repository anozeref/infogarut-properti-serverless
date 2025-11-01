import supabase from "../_lib/supabase.js";

/**
 * Cleanup orphaned files in Supabase Storage bucket "media".
 * Heuristic:
 * - List all files at the bucket root (project uploads are stored at root).
 * - Scan DB rows (properties, users) and collect any string that references:
 *   - Full public URLs: ${SUPABASE_URL}/storage/v1/object/public/media/<path>
 *   - Relative bucket paths prefixed with "media/<path>"
 * - Any storage file not referenced by DB is considered an orphan and will be removed.
 *
 * Supports dry-run mode:
 * - Send POST with ?dryRun=1 or body { dryRun: true } to preview orphans without deletion.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const bucket = "media";
    const supabaseUrl = process.env.SUPABASE_URL;
    const basePublic = `${supabaseUrl?.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/`;

    const dryRun =
      String(req.query?.dryRun || "").trim() === "1" ||
      Boolean(req.body?.dryRun);

    // 1) List storage files at bucket root (project keeps uploads in root)
    const { data: rootList, error: listErr } = await supabase.storage
      .from(bucket)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (listErr) {
      return res.status(400).json({ error: listErr.message || "Storage list error" });
    }

    // Filter to file objects only (folders have empty/null metadata)
    const fileEntries = (rootList || []).filter((e) => e?.metadata && typeof e.metadata.size === "number");
    const allPaths = fileEntries.map((f) => f.name); // paths relative to bucket root

    // 2) Fetch DB rows that might contain references
    const [{ data: props, error: propErr }, { data: users, error: userErr }] =
      await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("users").select("*"),
      ]);

    if (propErr) {
      return res.status(400).json({ error: propErr.message || "Failed to query properties" });
    }
    if (userErr) {
      return res.status(400).json({ error: userErr.message || "Failed to query users" });
    }

    // 3) Collect referenced paths from any string fields in rows
    const referenced = new Set();

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const collectFromString = (s) => {
      if (!s || typeof s !== "string") return;
      // Full public URL references
      if (basePublic) {
        const reFull = new RegExp(`${escapeRegExp(basePublic)}([^"\\s)]+)`, "g");
        let m;
        while ((m = reFull.exec(s)) !== null) {
          const p = m[1];
          if (p) referenced.add(p);
        }
      }
      // Generic "media/<path>" references
      // - capture group after 'media/' until a space, quote, or closing paren
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

    // 4) Normalize and compare
    const normalize = (p) => {
      try {
        // remove accidental leading slashes
        const cleaned = String(p).replace(/^\/+/, "");
        // If someone stored "public/media/<...>", drop leading 'public/'
        return cleaned.startsWith("public/") ? cleaned.slice("public/".length) : cleaned;
      } catch {
        return String(p || "");
      }
    };

    const refSet = new Set(
      Array.from(referenced)
        .map((p) => normalize(p))
        .filter((p) => p && !/\/$/.test(p))
    );

    // Sometimes DB stores encoded URLs; include decoded variants
    for (const p of Array.from(refSet)) {
      try {
        const dec = decodeURIComponent(p);
        if (dec && dec !== p) refSet.add(dec);
      } catch {
        // ignore decode errors
      }
    }

    // Storage returns base names (root paths). Orphans = files not present in refSet
    const orphans = allPaths.filter((name) => {
      // compared paths should be without any "media/" prefix
      const n1 = normalize(name);
      return !refSet.has(n1);
    });

    if (dryRun) {
      return res.status(200).json({
        dryRun: true,
        message: `Dry run: ${orphans.length} orphan(s) detected.`,
        totalFiles: allPaths.length,
        referencedCount: refSet.size,
        orphanCount: orphans.length,
        orphans,
      });
    }

    if (orphans.length === 0) {
      return res.status(200).json({
        message: "No orphan media found. Nothing to delete.",
        totalFiles: allPaths.length,
        referencedCount: refSet.size,
        orphanCount: 0,
        deleted: [],
      });
    }

    // 5) Remove orphans
    const { data: removed, error: removeErr } = await supabase.storage
      .from(bucket)
      .remove(orphans);

    if (removeErr) {
      return res.status(400).json({ error: removeErr.message || "Failed to remove orphan files" });
    }

    return res.status(200).json({
      message: `Deleted ${orphans.length} orphan file(s).`,
      totalFiles: allPaths.length,
      referencedCount: refSet.size,
      orphanCount: orphans.length,
      deleted: removed || orphans,
    });
  } catch (e) {
    return res.status(400).json({ error: "Bad Request" });
  }
}