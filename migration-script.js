// Migration Script: Import local media files into Supabase Storage and update properties.media
// Usage:
//   node migration-script.js
//
// Env (required):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// Env (optional):
//   MEDIA_BUCKET_NAME (default: "media")
//   MEDIA_PATH_PREFIX (default: "import")
//   DRY_RUN ("true" | "false", default: "false")
// Notes:
// - Run from project root so local path backend/public/media resolves correctly.
// - The script will ensure the bucket exists and is public.
// - It uploads files with limited concurrency to avoid rate limits, and updates the "properties" table.
// - It prints a summary with counts and sample transformed rows.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || "media";
const MEDIA_PATH_PREFIX = (process.env.MEDIA_PATH_PREFIX || "import").replace(/^\/+|\/+$/g, "");
const DRY_RUN = String(process.env.DRY_RUN || "false").toLowerCase() === "true";

const LOCAL_MEDIA_DIR = path.resolve(__dirname, "backend", "public", "media");

// Concurrency limits
const UPLOAD_CONCURRENCY = 5;
const UPDATE_CONCURRENCY = 5;

// State for summary
const summary = {
  uploadedFiles: 0,
  skippedFiles: 0,
  updatedProperties: 0,
  warnings: [],
  samples: [], // up to 5 transformed rows
};

function logStep(message) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${message}`);
}

function warn(message) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] WARN: ${message}`;
  console.warn(msg);
  summary.warnings.push(message);
}

function errorLog(message, err) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] ERROR: ${message}`, err?.message || err);
}

// Infer content type similar to frontend/api/media/upload.js
function inferContentType(fileName) {
  const ext = String(fileName || "").toLowerCase().split(".").pop();
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

function isAbsoluteUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u);
}

function normalizeMediaEntry(entry) {
  if (entry == null) return "";
  if (typeof entry === "string") return entry.trim();
  if (typeof entry === "object") {
    // Support legacy shapes: {url}, {path}, {src}, or arbitrary stringifiable fields
    if (typeof entry.url === "string") return entry.url;
    if (typeof entry.path === "string") return entry.path;
    if (typeof entry.src === "string") return entry.src;
    try {
      // Fallback: stringify
      return String(entry);
    } catch {
      return "";
    }
  }
  return String(entry || "");
}

function parseMediaToArray(media) {
  // Supports:
  // - Array of strings/objects
  // - Stringified JSON
  // - Comma-separated string
  // - Single string/object
  if (media == null) return [];
  if (Array.isArray(media)) return media;

  if (typeof media === "string") {
    const trimmed = media.trim();
    if (!trimmed) return [];
    // Try JSON first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
      if (typeof parsed === "string") return [parsed];
    } catch {
      // not JSON
    }
    // Comma-separated
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof media === "object") return [media];
  return [String(media)];
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function ensureBucketPublic(supabase, bucketName) {
  logStep(`Checking storage bucket "${bucketName}"...`);
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) {
      warn(`Failed to list buckets: ${listErr.message || String(listErr)}`);
    }
    const exists = Array.isArray(buckets) && buckets.some((b) => b.name === bucketName);
    if (!exists) {
      if (DRY_RUN) {
        logStep(`[DRY_RUN] Would create bucket "${bucketName}" (public: true)`);
      } else {
        const { error: createErr } = await supabase.storage.createBucket(bucketName, { public: true });
        if (createErr) throw createErr;
        logStep(`Created bucket "${bucketName}" with public read`);
      }
      return;
    }
    // Try to ensure public
    if (!DRY_RUN) {
      try {
        const { error: updateErr } = await supabase.storage.updateBucket(bucketName, { public: true });
        if (updateErr) {
          warn(`Bucket exists but could not confirm/update public setting: ${updateErr.message || String(updateErr)}`);
        } else {
          logStep(`Bucket "${bucketName}" public setting ensured`);
        }
      } catch (e) {
        warn(`Bucket exists but update failed: ${e.message || String(e)}`);
      }
    } else {
      logStep(`[DRY_RUN] Would ensure bucket "${bucketName}" is public`);
    }
  } catch (e) {
    throw new Error(`Bucket verification failed: ${e.message || String(e)}`);
  }
}

async function readLocalMediaFiles(dir) {
  logStep(`Scanning local media directory: ${dir}`);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    logStep(`Found ${files.length} files locally`);
    return files;
  } catch (e) {
    throw new Error(`Failed to read media directory: ${e.message || String(e)}`);
  }
}

async function uploadOneFile(supabase, bucket, prefix, localDir, fileName) {
  const objectPathBase = prefix ? `${prefix}/${fileName}` : `${fileName}`;
  const filePath = path.join(localDir, fileName);
  const contentType = inferContentType(fileName);

  const fileBuffer = await fs.readFile(filePath);

  // Try initial upload (no upsert). If conflict, prefix timestamp and retry once.
  const attemptUpload = async (objectPath) => {
    if (DRY_RUN) {
      logStep(`[DRY_RUN] Would upload: ${fileName} -> ${objectPath}`);
      return { objectPath, publicUrl: `DRY_RUN_PUBLIC_URL/${objectPath}` };
    }
    const { data, error } = await supabase.storage.from(bucket).upload(objectPath, fileBuffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw Object.assign(new Error(error.message || "Upload failed"), { statusCode: error.statusCode, __raw: error });
    }
    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    const publicUrl = publicData?.publicUrl || null;
    return { objectPath, publicUrl };
  };

  try {
    const res = await attemptUpload(objectPathBase);
    return res;
  } catch (e) {
    // If conflict, retry with timestamp prefix
    const isConflict =
      e?.statusCode === "409" ||
      e?.statusCode === 409 ||
      (typeof e?.message === "string" && /already exists|duplicate/i.test(e.message));
    if (isConflict) {
      const ts = Date.now();
      const objectPath = prefix ? `${prefix}/${ts}-${fileName}` : `${ts}-${fileName}`;
      warn(`Name collision for "${objectPathBase}". Retrying with "${objectPath}"`);
      const res = await attemptUpload(objectPath);
      return res;
    }
    throw e;
  }
}

async function processInBatches(items, limit, worker) {
  const results = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const settled = await Promise.allSettled(batch.map((item) => worker(item)));
    for (const s of settled) {
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        results.push({ __error: s.reason });
      }
    }
  }
  return results;
}

async function run() {
  logStep("Starting migration: import local media to Supabase Storage and update properties.media");
  logStep(`Config: bucket="${MEDIA_BUCKET_NAME}", prefix="${MEDIA_PATH_PREFIX}", DRY_RUN=${DRY_RUN}`);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required env: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1) Ensure bucket exists and is public
  await ensureBucketPublic(supabase, MEDIA_BUCKET_NAME);

  // 2) Upload all local files
  const localFiles = await readLocalMediaFiles(LOCAL_MEDIA_DIR);

  const mapping = new Map(); // original filename -> public URL
  if (localFiles.length > 0) {
    logStep(`Uploading ${localFiles.length} files with concurrency=${UPLOAD_CONCURRENCY}`);
    const uploadResults = await processInBatches(localFiles, UPLOAD_CONCURRENCY, async (name) => {
      try {
        const { objectPath, publicUrl } = await uploadOneFile(
          supabase,
          MEDIA_BUCKET_NAME,
          MEDIA_PATH_PREFIX,
          LOCAL_MEDIA_DIR,
          name
        );
        summary.uploadedFiles += DRY_RUN ? 0 : 1;
        return { fileName: name, objectPath, publicUrl };
      } catch (e) {
        summary.skippedFiles += 1;
        warn(`Upload failed for "${name}": ${e?.message || String(e)}`);
        return { fileName: name, __error: e };
      }
    });

    for (const r of uploadResults) {
      if (!r || r.__error) continue;
      if (r.publicUrl) {
        mapping.set(r.fileName, r.publicUrl);
      } else {
        warn(`No public URL returned for "${r.fileName}" at "${r.objectPath}"`);
      }
    }
  } else {
    logStep("No local files found to upload");
  }

  // 3) Fetch all properties
  logStep("Fetching rows from table \"properties\"...");
  const { data: properties, error: fetchErr } = await supabase.from("properties").select("*");
  if (fetchErr) {
    throw new Error(`Failed to fetch properties: ${fetchErr.message || String(fetchErr)}`);
  }
  logStep(`Fetched ${properties?.length || 0} rows`);

  // 4) Transform media per row and update
  const rows = Array.isArray(properties) ? properties : [];

  let sampleAdded = 0;
  const rowIndices = rows.map((_, i) => i);

  await processInBatches(rowIndices, UPDATE_CONCURRENCY, async (idx) => {
    const row = rows[idx];
    const id = row?.id;

    const originalArr = parseMediaToArray(row?.media);
    const originalNormalized = originalArr.map(normalizeMediaEntry).filter(Boolean);

    const transformed = originalNormalized.map((entry) => {
      if (isAbsoluteUrl(entry)) return entry;
      // Treat as relative filename
      if (mapping.has(entry)) {
        return mapping.get(entry);
      } else {
        // Might be unknown legacy path; leave unchanged and warn
        warn(`No mapping found for media "${entry}" in row id=${id}`);
        return entry;
      }
    });

    const changed = !arraysEqual(originalNormalized, transformed);

    // Prepare samples
    if (changed && sampleAdded < 5) {
      summary.samples.push({
        id,
        before: originalNormalized,
        after: transformed,
      });
      sampleAdded += 1;
    }

    if (!changed) return { id, changed: false };

    if (DRY_RUN) {
      logStep(`[DRY_RUN] Would update row id=${id}`);
      return { id, changed: true };
    }

    const { error: updateErr } = await supabase
      .from("properties")
      .update({ media: transformed })
      .eq("id", id);

    if (updateErr) {
      warn(`Failed to update row id=${id}: ${updateErr.message || String(updateErr)}`);
      return { id, changed: false, __error: updateErr };
    }

    summary.updatedProperties += 1;
    return { id, changed: true };
  });

  // 5) Summary
  logStep("Migration completed. Summary:");
  console.log(JSON.stringify({
    uploadedFiles: summary.uploadedFiles,
    skippedFiles: summary.skippedFiles,
    updatedProperties: summary.updatedProperties,
    warningsCount: summary.warnings.length,
    samples: summary.samples,
  }, null, 2));
}

run().catch((e) => {
  errorLog("Migration failed", e);
  process.exitCode = 1;
});