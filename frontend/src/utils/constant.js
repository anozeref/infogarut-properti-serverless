// src/constant.js
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';
export const UPLOAD_ENDPOINT = `${API_BASE}/upload`;
export const USERS_ENDPOINT = `${API_BASE}/users`;
export const PROPERTIES_ENDPOINT = `${API_BASE}/properties`;
export const NOTIFICATIONS_ENDPOINT = `${API_BASE}/notifications`;
export const BANNED_USERS_ENDPOINT = `${API_BASE}/banned-users`;
export const MEDIA_CLEANUP_ENDPOINT = `${API_BASE}/media/cleanup`;
export const ADMIN_PROPERTY_STATUS_ENDPOINT = `${API_BASE}/admin/property-status`;

// Updated to use API_BASE instead of localhost
export const SOCKET_URL = `${API_BASE}`;
export const MEDIA_URL = `${API_BASE}/media/`;
