import Swal from "sweetalert2";
import axios from "axios";
import { API_URL } from "./constant";
import { handleApiError, showErrorAlert, showSuccessAlert } from "./errorUtils";

// Get admin ID with fallback
export const getAdminId = () => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return user?.role === 'admin' ? user.id : "5";
  }
  return "5";
};

// Generic handler for admin actions with confirmation
export const handleAdminAction = async (config) => {
  try {
    const result = await Swal.fire(config.swal);
    if (result.isConfirmed) {
      await config.action();

      // Emit socket event if provided
      if (config.emitSocket && config.socket) {
        config.emitSocket(config.socket, config.socketAction, config.socketData);
      }

      // Refresh data if callback provided
      if (config.onSuccess) config.onSuccess();

      if (config.successMsg) {
        showSuccessAlert(config.successMsg.title, config.successMsg.text);
      }
    }
  } catch (error) {
    const errorMsg = handleApiError(error, config.errorMsg?.text || "Terjadi kesalahan.");
    showErrorAlert(config.errorMsg?.title || "Gagal!", errorMsg);
  }
};

// Fetch data with error handling
export const fetchAdminData = async (endpoint, errorMessage = "Gagal mengambil data") => {
  try {
    const response = await axios.get(`${API_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    const message = handleApiError(error, errorMessage);
    showErrorAlert("Error!", message);
    throw error;
  }
};

// Update user data with socket emission
export const updateUserData = async (id, updatedFields, successMsg, emitSocket, socket) => {
  try {
    const response = await axios.put(`${API_URL}users/${id}`, updatedFields);
    if (emitSocket && socket) {
      emitSocket(socket, "userUpdate");
    }
    showSuccessAlert("Berhasil!", successMsg);
    return response.data;
  } catch (error) {
    const message = handleApiError(error, "Gagal memperbarui data user.");
    showErrorAlert("Error!", message);
    throw error;
  }
};

// Common loading spinner component
export const LoadingSpinner = ({ className = "spinnerContainer" }) => (
  <div className={className}>
    <div className="spinner"></div>
  </div>
);

// Common empty state message
export const EmptyState = ({ message, className = "emptyState" }) => (
  <div className={className}>{message}</div>
);