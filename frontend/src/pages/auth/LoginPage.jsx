import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { loginUser } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import styles from "./LoginPage.module.css";
import { FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

// --- 🛠️ FUNGSI HELPER TAMBAHAN ---
/**
 * Mem-parsing string tanggal custom "DD/MM/YYYY HH:mm:ss" menjadi objek Date.
 * @param {string} dateString String tanggal.
 * @returns {Date|null} Objek Date atau null jika tidak valid.
 */
const smartParseDate = (dateString) => {
  if (!dateString) return null; // Return null jika string kosong

  // Handle custom "DD/MM/YYYY HH:mm:ss" format
  if (dateString.includes('/')) {
    const parts = dateString.split(/[\s/:]+/);
    // Cek jika parts tidak lengkap (minimal 6: D,M,Y,H,m,s)
    if (parts.length < 6) return null;
    
    // new Date(year, monthIndex, day, hours, minutes, seconds)
    const date = new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0, parts[5] || 0);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle other standard formats like ISO 8601
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date; // Return null jika invalid
};
// --- AKHIR FUNGSI HELPER ---


const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await loginUser(username, password);

      if (!user) {
        Swal.fire({
          icon: "error",
          title: "Gagal!",
          text: "Username atau password salah",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // 🔹 Cek apakah akun dibanned
      if (user.banned === true) {
        Swal.fire({
          icon: "error",
          title: "Akun Diblokir!",
          text: "Akun Anda telah dibanned oleh admin.",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // 🔹 Cek apakah akun masih dalam masa suspend
      if (user.suspendedUntil) {
        const today = new Date();

        // --- 🛠️ PERBAIKAN DI SINI ---
        // Gunakan helper untuk membaca format 'DD/MM/YYYY...'
        const suspendedUntil = smartParseDate(user.suspendedUntil); 
        // --- AKHIR PERBAIKAN ---

        // Tambahkan cek 'suspendedUntil' (jika tanggalnya valid)
        if (suspendedUntil && suspendedUntil >= today) { 
          Swal.fire({
            icon: "warning",
            title: "Akun Ditangguhkan!",
            text: "Akun Anda masih dalam masa suspend.",
            timer: 3000,
            showConfirmButton: false,
          });
          return;
        }
      }

      // ✅ Jika semua lolos, login berhasil
      login(user);
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `Selamat datang, ${user.nama.split(" ")[0]}!`,
        timer: 3000,
        showConfirmButton: false,
      });

      user.role === "admin" ? navigate("/admin") : navigate("/user");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: err.message,
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.circle} ${styles.circleOne}`}></div>
      <div className={`${styles.circle} ${styles.circleTwo}`}></div>
      <div className={`${styles.circle} ${styles.circleThree}`}></div>
      <div className={`${styles.circle} ${styles.circleFour}`}></div>

      <motion.div
        className={styles.loginBox}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className={styles.iconWrapper}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FaLock size={28} />
        </motion.div>

        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Masuk Akun
        </motion.h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.button}>
            Masuk
          </button>
        </form>

        <p className={styles.registerLink}>
          Belum punya akun? <Link to="/register">Daftar</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;