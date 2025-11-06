/**
 * Proxy /api/upload to the real handler at /api/media/upload
 * This keeps backward compatibility for clients calling /api/upload.
 */
import uploadHandler from "./media/upload.js";

export default async function handler(req, res) {
  return uploadHandler(req, res);
}