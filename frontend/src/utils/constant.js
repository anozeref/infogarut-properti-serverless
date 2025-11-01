// src/constant.js
// Prefer same-origin API to avoid CORS. If VITE_API_URL points to a different origin, fall back to relative "/api/".
const resolveApiBase = () => {
  const configured = import.meta.env?.VITE_API_URL;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  try {
    if (configured) {
      // Normalize configured URL relative to current origin (handles absolute and relative)
      const configuredUrl = new URL(configured, origin);
      const configuredOrigin = configuredUrl.origin;
      // If configured origin differs from current app origin, use same-origin relative to avoid CORS
      if (configuredOrigin !== origin) {
        return "/api/";
      }
      // Ensure trailing slash for consistent concatenation
      const path = configuredUrl.pathname;
      return path.endsWith("/") ? path : `${path}/`;
    }
  } catch {
    // If URL parsing fails, use safe default
  }
  return "/api/";
};

export const API_URL = resolveApiBase();
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || "";
