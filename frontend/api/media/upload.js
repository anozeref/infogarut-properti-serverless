import supabase from "../_lib/supabase.js";
import { Buffer } from "node:buffer";

/**
 * Upload media to Supabase Storage (bucket: "media").
 * Request body (JSON):
 * - fileBase64: base64 string of the file content (no data URI header, pure base64)
 * - fileName: original filename (used to infer content type)
 * - pathPrefix: optional folder prefix (e.g., "properties/123"), will be prepended to object path
 *
 * Response (JSON, 201):
 * - { url, path } where `url` is public URL and `path` is the object path in the bucket
 *
 * Notes:
 * - Bucket "media" should have public read enabled (RLS policy in Supabase Storage).
 * - On error, returns 400/405 with { error }.
 */

function inferContentType(fileName) {
  const ext = String(fileName || "")
    .toLowerCase()
    .split(".")
    .pop();

  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Early guard: require service-role for bucket management/uploads
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(500).json({ error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing", code: "config_missing" });
    }
    
    const { fileBase64, fileName, pathPrefix } = req.body || {};
    if (!fileBase64 || !fileName) {
      return res
        .status(400)
        .json({ error: "Missing required fields: fileBase64, fileName", code: "validation_error" });
    }

    const bucket = "media";

    // Ensure bucket exists and is public; create if missing
    try {
      const { data: bucketsList } = await supabase.storage.listBuckets();
      const exists = Array.isArray(bucketsList) && bucketsList.some((b) => b.name === bucket);
      if (!exists) {
        const { error: bucketErr } = await supabase.storage.createBucket(bucket, {
          public: true,
        });
        if (bucketErr) {
          const code = bucketErr?.code || bucketErr?.error;
          try { console.error("media.bucket.create error", { path: "/api/media/upload:POST", code, message: bucketErr?.message }); } catch (_) {}
          return res.status(400).json({ error: bucketErr?.message || "Upload failed", code });
        }
      }
    } catch (e) {
      console.error("Bucket verify/create error", e);
      // proceed; upload will fail later if bucket truly unavailable
    }

    const safePrefix = pathPrefix
      ? String(pathPrefix).replace(/^\/*|\/*$/g, "")
      : "";
    const timestamp = Date.now();
    const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${safePrefix ? safePrefix + "/" : ""}${timestamp}-${safeName}`;

    // Decode base64 into a Buffer
    let buffer;
    try {
      buffer = Buffer.from(String(fileBase64), "base64");
    } catch (e) {
      console.error("Invalid base64 input");
      return res.status(400).json({ error: "Invalid base64 input" });
    }

    const contentType = inferContentType(safeName);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      const code = error?.code || error?.error;
      try { console.error("media.upload error", { path: "/api/media/upload:POST", code, message: error?.message }); } catch (_) {}
      return res.status(400).json({ error: error?.message || "Upload failed", code });
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    const publicUrl = publicData?.publicUrl || null;

    return res.status(201).json({
      url: publicUrl,
      path: objectPath,
    });
  } catch (e) {
    const code = e?.code || e?.error;
    try { console.error("media.route exception", { path: "/api/media/upload:POST", code, message: e?.message }); } catch (_) {}
    return res.status(400).json({ error: e?.message || "Upload failed", code });
  }
}