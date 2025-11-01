export const API_URL = "/api/";
export const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "";

// Compute MEDIA_BASE_URL with fallback to VITE_SUPABASE_URL if VITE_MEDIA_BASE_URL is not provided
export const MEDIA_BASE_URL = (() => {
  const raw = (() => {
    const explicit = import.meta.env.VITE_MEDIA_BASE_URL;
    if (explicit && String(explicit).trim()) return String(explicit);
    const supa = import.meta.env.VITE_SUPABASE_URL;
    if (supa && String(supa).trim()) {
      return String(supa).replace(/\/+$/, "") + "/storage/v1/object/public/media/";
    }
    return "";
  })();
  return raw ? raw.replace(/\/+$/, "") + "/" : "";
})();

// Backward compatibility to avoid breaking existing imports
export const SOCKET_URL = SOCKET_SERVER_URL;
export const MEDIA_URL = MEDIA_BASE_URL;
