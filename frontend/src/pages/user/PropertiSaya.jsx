import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import CardProperty from "./components/CardProperty";
import styles from "./components/CardProperty.module.css";
import { AuthContext } from "../../context/AuthContext";
import Swal from "sweetalert2";
import { useOutletContext } from "react-router-dom";
import { API_URL } from "../../utils/constant";

export default function PropertiSaya() {
  const [properties, setProperties] = useState([]);
  const { user } = useContext(AuthContext);
  const { darkMode } = useOutletContext();

  // 🧠 Simpan status lama properti buat deteksi perubahan
  const prevStatuses = useRef({});

  useEffect(() => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login terlebih dahulu untuk melihat properti Anda.",
        background: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#fff" : "#000",
      });
      return;
    }

    const fetchMyProperties = async () => {
      try {
        const res = await axios.get(`${API_URL}properties`);

        // 🔍 Filter hanya properti milik user login
        const userProperties = res.data
          .filter((prop) => String(prop.ownerId) === String(user.id))
          .sort((a, b) => {
            // Urutkan berdasarkan tanggal terbaru (postedAt)
            const parseDate = (postedAt) => {
              if (!postedAt) return new Date(0);
              const [datePart, timePart] = postedAt.split(" ");
              const [day, month, year] = datePart.split("/");
              return new Date(`${year}-${month}-${day}T${timePart}`);
            };
            return parseDate(b.postedAt) - parseDate(a.postedAt);
          });

        // 🔔 Deteksi perubahan status (disetujui / ditolak)
        userProperties.forEach((prop) => {
          const prevStatus = prevStatuses.current[prop.id];
          if (prevStatus && prevStatus !== prop.statusPostingan) {
            if (prop.statusPostingan === "approved" || prop.statusPostingan === "disetujui") {
              Swal.fire({
                icon: "success",
                title: "Properti Disetujui!",
                text: `${prop.namaProperti} telah disetujui oleh admin.`,
                timer: 4000,
                showConfirmButton: false,
                background: darkMode ? "#1f2937" : "#fff",
                color: darkMode ? "#fff" : "#000",
              });
            }

            if (prop.statusPostingan === "rejected" || prop.statusPostingan === "ditolak") {
              Swal.fire({
                icon: "error",
                title: "Properti Ditolak",
                text: `${prop.namaProperti} ditolak oleh admin.`,
                timer: 4000,
                showConfirmButton: false,
                background: darkMode ? "#1f2937" : "#fff",
                color: darkMode ? "#fff" : "#000",
              });
            }
          }

          // Simpan status terbaru
          prevStatuses.current[prop.id] = prop.statusPostingan;
        });

        setProperties(userProperties);
      } catch (err) {
        console.error("❌ Gagal memuat properti:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Data",
          text: "Terjadi kesalahan saat memuat data properti Anda.",
          background: darkMode ? "#1f2937" : "#fff",
          color: darkMode ? "#fff" : "#000",
        });
      }
    };

    // 🔁 Jalankan pertama kali & update setiap 10 detik
    fetchMyProperties();
    const interval = setInterval(fetchMyProperties, 10000);
    return () => clearInterval(interval);
  }, [user, darkMode]);

  const handleDelete = (id) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  if (!user) {
    return (
      <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
        <p>Silakan login untuk melihat daftar properti Anda.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.cardContainer} ${darkMode ? styles.dark : ""}`}>
      <h2 className={styles.pageTitle}>Properti Saya</h2>

      {properties.length === 0 ? (
        <p>Belum ada properti yang kamu tambahkan.</p>
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
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
