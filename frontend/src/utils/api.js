import { API_URL } from "./constant.js";

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
