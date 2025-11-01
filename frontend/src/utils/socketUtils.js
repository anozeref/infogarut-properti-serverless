// Utility functions for socket management across admin components

import { io } from "socket.io-client";

// Create and manage socket connections
export const createSocketConnection = (url = "http://localhost:3005") => {
  return io(url);
};

// Socket event handlers for common admin operations
export const setupSocketListeners = (socket, handlers) => {
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