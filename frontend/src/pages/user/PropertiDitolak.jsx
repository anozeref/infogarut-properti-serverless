// frontend/src/pages/user/PropertiDitolak.jsx
import React, { useEffect, useState, useContext, useCallback } from "react"; // 1. Tambahkan useCallback
import axios from "axios";
import CardProperty from "./components/CardProperty";
import styles from "./components/CardProperty.module.css";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { useOutletContext } from "react-router-dom";

// 💡 TIPS: Pindahkan URL ke satu tempat (misal .env) agar mudah diubah
const API_BASE_URL = "http://localhost:3004";

export default function PropertiDitolak() {
  const { darkMode } = useOutletContext();
  const { user } = useContext(AuthContext);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Ambil data properti ditolak user
  // Gunakan useCallback agar fungsi tidak dibuat ulang jika tidak perlu
  const fetchRejectedProperties = useCallback(async () => {
    if (!user) return; // Guard clause

    // 🐛 PERBAIKAN 1: Set loading jadi true setiap kali fungsi ini dipanggil
    setLoading(true);

    try {
      // 🚀 PERBAIKAN 2 (SANGAT PENTING):
      // Idealnya, filter dilakukan di backend seperti ini:
      // const res = await axios.get(`${API_BASE_URL}/properties?ownerId=${user.id}&statusPostingan=rejected`);
      // Ini jauh lebih cepat dan hemat data.

      // Untuk saat ini, kita tetap pakai filter di frontend:
      const res = await axios.get(`${API_BASE_URL}/properties`);

      // 🔍 Filter: hanya milik user & status rejected
      const filtered = res.data
        .filter((prop) => {
          const status = prop.statusPostingan?.toLowerCase();
          return (
            (prop.userId === user.id || prop.ownerId === user.id) &&
            status === "rejected"
          );
        })
        // 🔽 Urutkan dari terbaru
        .sort(
          (a, b) =>
            new Date(b.tanggal || b.postedAt) -
            new Date(a.tanggal || a.postedAt)
        );

      setProperties(filtered);
    } catch (err) {
      console.error("Gagal memuat properti ditolak:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Data",
        text: "Terjadi kesalahan saat memuat properti ditolak Anda.",
        background: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
    } finally {
      setLoading(false);
    }
  }, [user, darkMode]); // 'user' untuk filter, 'darkMode' untuk Swal

  // 🚀 PERBAIKAN 3:
  // Pisahkan logic 'fetch' (yang bergantung pada 'user')
  // dari logic 'alert' (yang bergantung pada 'darkMode')
  useEffect(() => {
    if (user) {
      fetchRejectedProperties();
    } else {
      // Jika user tidak ada (logout), bersihkan data
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login terlebih dahulu untuk melihat properti yang ditolak.",
        background: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
      setLoading(false);
      // 🐛 PERBAIKAN 4: Bersihkan properti lama jika user logout
      setProperties([]);
    }
    // 'fetchRejectedProperties' adalah dependensi, tapi karena dibungkus useCallback,
    // ia hanya akan berubah jika 'user' atau 'darkMode' berubah.
    // Tapi logic fetch UTAMA (if(user)) hanya bergantung pada 'user'.
  }, [user, fetchRejectedProperties, darkMode]);
  // Kita tetap perlu 'darkMode' di sini HANYA untuk alert 'Belum Login'.
  // Jika 'fetchRejectedProperties' tidak bergantung pada 'darkMode' (misal theme Swal diatur global),
  // kita bisa optimasi lebih lanjut. Tapi ini sudah cukup baik.

  // 🗑️ Hapus properti
  // ✨ PERBAIKAN 5 (Penyempurnaan): Terima 'namaProperti' untuk pesan konfirmasi
  const handleDelete = async (id, namaProperti) => {
    const confirm = await Swal.fire({
      title: "Hapus Properti?",
      // Pesan jadi lebih spesifik
      text: `Yakin ingin menghapus "${namaProperti}"? Aksi ini permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      background: darkMode ? "#1f2937" : "#fff",
      color: darkMode ? "#fff" : "#000",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/properties/${id}`);
      // Logic ini sudah SANGAT BAGUS. UI update tanpa refresh.
      setProperties((prev) => prev.filter((p) => p.id !== id));

      Swal.fire({
        icon: "success",
        title: "Dihapus!",
        text: `Properti "${namaProperti}" telah berhasil dihapus.`,
        background: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#fff" : "#000",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Gagal menghapus properti:", err);
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: "Terjadi kesalahan saat menghapus properti.",
        background: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
    }
  };

  // 🕒 Loading state
  if (loading) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Sedang memuat data properti ditolak...</p>
      </div>
    );
  }

  // 🚫 Jika user belum login (double check, ini bagus)
  if (!user) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Silakan login untuk melihat daftar properti yang ditolak.</p>
      </div>
    );
  }

  // 💡 Render hasil
  return (
    <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
      <h2 className={styles.pageTitle}>Properti Ditolak</h2>

      {properties.length === 0 ? (
        <p>Tidak ada properti yang ditolak saat ini.</p>
      ) : (
        <div className={styles.gridContainerDitolak}>
          {properties.map((item) => (
            <CardProperty
              key={item.id}
              id={item.id}
              namaProperti={item.namaProperti}
              tipeProperti={item.tipeProperti}
              jenisProperti={item.jenisProperti}
              periodeSewa={item.periodeSewa}
              harga={item.harga}
              luasTanah={item.luasTanah}
              luasBangunan={item.luasBangunan}
              kamarTidur={item.kamarTidur}
              kamarMandi={item.kamarMandi}
              lokasi={item.lokasi}
              deskripsi={item.deskripsi}
              media={item.media}
              status={item.statusPostingan}
              darkMode={darkMode}
              // ✨ PERBAIKAN 5 (Penyempurnaan): Kirim nama properti ke fungsi delete
              onDelete={() => handleDelete(item.id, item.namaProperti)}
              showActions={true} // ✅ Tampilkan tombol hapus/edit
            />
          ))}
        </div>
      )}
    </div>
  );
}