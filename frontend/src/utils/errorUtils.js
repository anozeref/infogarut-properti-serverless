import Swal from "sweetalert2";

// Centralized error handling utilities
export const handleApiError = (error, defaultMessage = "Terjadi kesalahan pada server") => {
  console.error("API Error:", error);

  let message = defaultMessage;

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        message = data?.error || "Permintaan tidak valid";
        break;
      case 401:
        message = "Sesi telah berakhir. Silakan login kembali.";
        // Could trigger logout here
        break;
      case 403:
        message = "Anda tidak memiliki akses untuk tindakan ini";
        break;
      case 404:
        message = "Data tidak ditemukan";
        break;
      case 409:
        message = data?.error || "Konflik data";
        break;
      case 422:
        message = "Data yang dikirim tidak valid";
        break;
      case 500:
        message = "Terjadi kesalahan internal server";
        break;
      default:
        message = data?.error || `Error ${status}`;
    }
  } else if (error.request) {
    // Network error
    message = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  }

  return message;
};

export const showErrorAlert = (title, message) => {
  return Swal.fire({
    title: title || "Error!",
    text: message,
    icon: "error",
    confirmButtonText: "OK",
    confirmButtonColor: "#d33"
  });
};

export const showSuccessAlert = (title, message) => {
  return Swal.fire({
    title: title || "Berhasil!",
    text: message,
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#28a745",
    timer: 3000,
    timerProgressBar: true
  });
};

export const showWarningAlert = (title, message) => {
  return Swal.fire({
    title: title || "Peringatan!",
    text: message,
    icon: "warning",
    confirmButtonText: "OK",
    confirmButtonColor: "#f39c12"
  });
};

export const showConfirmAlert = (config) => {
  return Swal.fire({
    title: config.title || "Konfirmasi",
    text: config.text || "Apakah Anda yakin?",
    icon: config.icon || "question",
    showCancelButton: true,
    confirmButtonText: config.confirmText || "Ya",
    cancelButtonText: config.cancelText || "Batal",
    confirmButtonColor: config.confirmColor || "#3085d6",
    cancelButtonColor: config.cancelColor || "#d33",
    ...config.additionalOptions
  });
};