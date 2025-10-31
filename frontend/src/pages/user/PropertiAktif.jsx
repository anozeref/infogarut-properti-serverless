// frontend/src/pages/user/PropertiAktif.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import CardProperty from "./components/CardProperty";
import styles from "./components/CardProperty.module.css";
import Swal from "sweetalert2";
import { AuthContext } from "../../context/AuthContext";
import { useOutletContext } from "react-router-dom";

export default function PropertiAktif() {
  const { darkMode } = useOutletContext();
  const { user } = useContext(AuthContext);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 Ambil data properti aktif user
  useEffect(() => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login terlebih dahulu untuk melihat properti aktif Anda.",
      });
      setLoading(false);
      return;
    }

    const fetchActiveProperties = async () => {
      try {
        const res = await axios.get("http://localhost:3004/properties");

        // 🔍 Filter: hanya milik user yg login & status approved
        const filtered = res.data
          .filter(
    (prop) =>
      (prop.userId === user.id || prop.ownerId === user.id) &&
      prop.statusPostingan === "approved"
  )
          // 🔽 Urutkan dari terbaru (jika ada field tanggal/postedAt)
          .sort(
            (a, b) =>
              new Date(b.tanggal || b.postedAt) -
              new Date(a.tanggal || a.postedAt)
          );

        setProperties(filtered);
      } catch (err) {
        console.error("Gagal memuat properti aktif:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Terjadi kesalahan saat memuat properti aktif Anda.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProperties();
  }, [user]);

  // 🕒 Loading state
  if (loading) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Sedang memuat data properti aktif...</p>
      </div>
    );
  }

  // 🚫 Jika user belum login
  if (!user) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Silakan login untuk melihat daftar properti aktif Anda.</p>
      </div>
    );
  }

  // 💡 Render hasil
  return (
    <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
      <h2 className={styles.pageTitle}>Properti Aktif</h2>

      {properties.length === 0 ? (
        <p>Tidak ada properti aktif saat ini.</p>
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
              showActions={false} // ❌ properti aktif: tidak bisa edit/hapus
            />
          ))}
        </div>
      )}
    </div>
  );
}
