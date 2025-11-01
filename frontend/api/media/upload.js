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

    const { fileBase64, fileName, pathPrefix } = req.body || {};
    if (!fileBase64 || !fileName) {
      return res
        .status(400)
        .json({ error: "Missing required fields: fileBase64, fileName" });
    }

    const bucket = "media";
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
      console.error("Supabase storage upload error");
      return res
        .status(400)
        .json({ error: error.message || "Upload failed" });
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
    console.error("Media upload route exception");
    return res.status(400).json({ error: "Bad Request" });
  }
}