// Utility functions for date handling across admin components

// Parse tanggal dari berbagai format
export const smartParseDate = (dateString) => {
  if (!dateString) return new Date();

  // Handle format DD/MM/YYYY HH:mm:ss
  if (dateString.includes('/')) {
    const parts = dateString.split(/[\s/:]+/);
    return new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0, parts[5] || 0);
  }

  // Handle format ISO 8601
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

// Format tanggal untuk tampilan
export const formatDisplayDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime()) || dateObj.getFullYear() <= 1970) return "-";
  return dateObj.toLocaleString("id-ID", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Format tanggal ke DD/MM/YYYY HH:mm:ss
export const formatToCustomTimestamp = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Parse tanggal custom ke format Indonesia
export const parseAndFormatDate = (dateStr) => {
  if (!dateStr) return "-";
  const parts = dateStr.split(/[\s/:]+/);
  if (parts.length < 6) return "Format salah";
  const dateObj = new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0, parts[5] || 0);
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  return dateObj.toLocaleString("id-ID", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Parse tanggal untuk perbandingan
export const parseDateStringForComparison = (dateStr) => {
  if (!dateStr) return null;
  // Handle ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const isoDate = new Date(dateStr);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  }
  // Handle custom format DD/MM/YYYY
  const parts = dateStr.split(/[\s/:]+/);
  if (parts.length < 3) return null;
  const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
  dateObj.setHours(0, 0, 0, 0);
  return isNaN(dateObj.getTime()) ? null : dateObj;
};

// Parse tanggal ke format pendek Indonesia
export const parseAndFormatShortDate = (dateStr) => {
  const dateObj = parseDateStringForComparison(dateStr);
  if (!dateObj) return dateStr ? "Format salah" : "-";
  return dateObj.toLocaleDateString("id-ID", { year: 'numeric', month: 'short', day: 'numeric' });
};

// Format pemisah tanggal (Hari Ini, Kemarin, dll)
export const formatDateSeparator = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateObj = new Date(date);

  if (dateObj.toDateString() === today.toDateString()) return "Hari Ini";
  if (dateObj.toDateString() === yesterday.toDateString()) return "Kemarin";
  return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};