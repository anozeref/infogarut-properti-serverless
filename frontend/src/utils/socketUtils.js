// Socket utilities with graceful degradation when SOCKET_SERVER_URL is empty
import { io } from "socket.io-client";
import { SOCKET_SERVER_URL } from "./constant";

// Create and manage socket connections (returns a mock when disabled)
export const createSocketConnection = (url = SOCKET_SERVER_URL) => {
  const target = String(url || "").trim();
  if (!target) {
    return {
      on() {},
      off() {},
      emit() {},
      connect() {},
      disconnect() {},
      connected: false,
      id: null,
    };
  }
  return io(target);
};

// Socket event handlers for common admin operations
export const setupSocketListeners = (socket, handlers) => {
  if (!socket) return () => {};
  if (handlers.userUpdate) socket.on("userUpdate", handlers.userUpdate);
  if (handlers.propertyUpdate) socket.on("propertyUpdate", handlers.propertyUpdate);
  if (handlers.update_property) socket.on("update_property", handlers.update_property);

  return () => {
    if (handlers.userUpdate) socket.off("userUpdate", handlers.userUpdate);
    if (handlers.propertyUpdate) socket.off("propertyUpdate", handlers.propertyUpdate);
    if (handlers.update_property) socket.off("update_property", handlers.update_property);
  };
};

// Emit socket events for admin actions
export const emitAdminAction = (socket, action, data) => {
  if (!socket) return;
  switch (action) {
    case "userUpdate":
      socket.emit("userUpdate");
      break;
    case "propertyUpdate":
      socket.emit("propertyUpdate");
      break;
    case "adminPropertyUpdate":
      socket.emit("adminPropertyUpdate", data);
      break;
    default:
      console.warn(`Unknown socket action: ${action}`);
  }
};