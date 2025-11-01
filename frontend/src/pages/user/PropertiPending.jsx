// === PropertiPending.jsx ===
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import CardProperty from "./components/CardProperty";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import styles from "./components/CardProperty.module.css";

export default function PropertiPending() {
  const { darkMode } = useOutletContext();
  const { user } = useContext(AuthContext);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ======================= FETCH DATA =======================
  useEffect(() => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login terlebih dahulu untuk melihat properti pending Anda.",
      });
      setLoading(false);
      return;
    }

    const fetchPendingProperties = async () => {
      try {
        const res = await axios.get("http://localhost:3004/properties");

        // 🔍 Filter: hanya properti user ini yg masih pending
        const filtered = res.data
          .filter(
            (prop) =>
              (prop.userId === user.id || prop.ownerId === user.id) &&
              prop.statusPostingan === "pending"
          )
          // urutkan terbaru dulu
          .sort(
            (a, b) =>
              new Date(b.tanggal || b.postedAt) -
              new Date(a.tanggal || a.postedAt)
          );

        setProperties(filtered);
      } catch (err) {
        console.error("Gagal memuat properti pending:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Terjadi kesalahan saat memuat properti pending Anda.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProperties();
  }, [user]);

  // ======================= HANDLE DELETE =======================
  const handleDelete = async (id) => {
  Swal.fire({
    title: "Yakin ingin hapus?",
    text: "Properti akan dihapus dari daftar pending!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`http://localhost:3004/properties/${id}`);

        // json-server kadang return 200 atau 204 → dua-duanya dianggap sukses
        if (res.status === 200 || res.status === 204) {
          Swal.fire("Terhapus!", "Properti berhasil dihapus.", "success");
          // langsung refresh data tanpa reload halaman
          fetchProperties();
        } else {
          Swal.fire("Hmm?", "Respons tidak dikenali, tapi mungkin berhasil.", "info");
          fetchProperties();
        }
      } catch (error) {
        // cek apakah properti sudah tidak ada tapi axios error
        if (error.response && error.response.status === 404) {
          Swal.fire("Selesai!", "Properti sudah tidak ada, halaman akan diperbarui.", "success");
          fetchProperties();
        } else {
          console.error("Gagal menghapus properti:", error);
          Swal.fire("Gagal!", "Terjadi kesalahan saat menghapus properti.", "error");
        }
      }
    }
  });
};
  // ======================= RENDER =======================
  if (loading) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Memuat properti pending...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Silakan login untuk melihat daftar properti pending Anda.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
      <h2 className={styles.pageTitle}>Properti Pending</h2>

      {properties.length === 0 ? (
        <p>Tidak ada properti pending saat ini.</p>
      ) : (
        <div className={styles.gridContainer}>
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
              showActions={false} // ✅ bisa edit & hapus
              onDelete={() => handleDelete(item.id)} // handler hapus
            />
          ))}
        </div>
      )}
    </div>
  );
}
