export const API_URL = "/api/";
export const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "";
export const MEDIA_BASE_URL = import.meta.env.VITE_MEDIA_BASE_URL || "";

// Backward compatibility to avoid breaking existing imports
export const SOCKET_URL = SOCKET_SERVER_URL;
export const MEDIA_URL = MEDIA_BASE_URL;
