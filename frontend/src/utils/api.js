import { API_URL } from "./constant.js";
import axios from "axios";

export function buildRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export const loginUser = async (username, password) => {
  try {
    const res = await fetch(`${API_URL}users?username=${username}&password=${password}`);
    if (!res.ok) throw new Error("Gagal menghubungi server");

    const data = await res.json();
    return data.length ? data[0] : null;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/* ===========================================================
   🔹 REGISTER USER BARU
   Cek username & email unik sebelum disimpan
   =========================================================== */
export const registerUser = async (userData) => {
  try {
    // Cek username sudah ada atau belum
    const usernameRes = await fetch(`${API_URL}users?username=${userData.username}`);
    const usernameExist = await usernameRes.json();
    if (usernameExist.length) throw new Error("Username sudah digunakan");

    // Cek email sudah ada atau belum
    const emailRes = await fetch(`${API_URL}users?email=${userData.email}`);
    const emailExist = await emailRes.json();
    if (emailExist.length) throw new Error("Email sudah digunakan");

    // Simpan user baru ke db.json
    const res = await fetch(`${API_URL}users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!res.ok) throw new Error("Gagal menyimpan data pengguna");

    return await res.json();
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
};

/* ===========================================================
   🔹 Standardized JSON helpers with x-request-id propagation
   =========================================================== */

// POST JSON with x-request-id
export async function postJsonWithReqId(url, data, config = {}) {
  const reqId = buildRequestId();
  const headers = {
    ...(config && config.headers ? config.headers : {}),
    "x-request-id": reqId,
    "Content-Type": "application/json",
  };

  try {
    // Minimal request start logging (no raw body)
    console.info("[api][request]", {
      method: "POST",
      url,
      correlationId: reqId,
      keys: Object.keys(data || {}),
      mediaCount: Array.isArray(data?.media) ? data.media.length : 0,
    });
  } catch (_) {}

  try {
    const response = await axios.post(url, data, { ...config, headers });
    return response.data;
  } catch (err) {
    const payload = err?.response?.data;
    try {
      console.error("[api][error]", {
        method: "POST",
        url,
        status: err?.response?.status,
        correlationId: payload?.correlationId,
        code: payload?.code,
        hint: payload?.db?.hint,
      });
    } catch (_) {}
    throw payload || { error: err.message, code: "network_error" };
  }
}

// GET JSON with x-request-id
export async function getJsonWithReqId(url, config = {}) {
  const reqId = buildRequestId();
  const headers = {
    ...(config && config.headers ? config.headers : {}),
    "x-request-id": reqId,
  };

  try {
    const response = await axios.get(url, { ...config, headers });
    return response.data;
  } catch (err) {
    const payload = err?.response?.data;
    try {
      console.error("[api][error]", {
        method: "GET",
        url,
        status: err?.response?.status,
        correlationId: payload?.correlationId,
        code: payload?.code,
        hint: payload?.db?.hint,
      });
    } catch (_) {}
    throw payload || { error: err.message, code: "network_error" };
  }
}

// PATCH JSON with x-request-id
export async function patchJsonWithReqId(url, data, config = {}) {
  const reqId = buildRequestId();
  const headers = {
    ...(config && config.headers ? config.headers : {}),
    "x-request-id": reqId,
    "Content-Type": "application/json",
  };

  try {
    // Minimal request start logging (no raw body)
    console.info("[api][request]", {
      method: "PATCH",
      url,
      correlationId: reqId,
      keys: Object.keys(data || {}),
      mediaCount: Array.isArray(data?.media) ? data.media.length : 0,
    });
  } catch (_) {}

  try {
    const response = await axios.patch(url, data, { ...config, headers });
    return response.data;
  } catch (err) {
    const payload = err?.response?.data;
    try {
      console.error("[api][error]", {
        method: "PATCH",
        url,
        status: err?.response?.status,
        correlationId: payload?.correlationId,
        code: payload?.code,
        hint: payload?.db?.hint,
      });
    } catch (_) {}
    throw payload || { error: err.message, code: "network_error" };
  }
}

// DELETE JSON with x-request-id
export async function deleteJsonWithReqId(url, config = {}) {
  const reqId = buildRequestId();
  const headers = {
    ...(config && config.headers ? config.headers : {}),
    "x-request-id": reqId,
  };

  try {
    const response = await axios.delete(url, { ...config, headers });
    return response.data;
  } catch (err) {
    const payload = err?.response?.data;
    try {
      console.error("[api][error]", {
        method: "DELETE",
        url,
        status: err?.response?.status,
        correlationId: payload?.correlationId,
        code: payload?.code,
        hint: payload?.db?.hint,
      });
    } catch (_) {}
    throw payload || { error: err.message, code: "network_error" };
  }
}
