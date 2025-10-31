import React, { useState } from "react";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaEdit,
  FaTrash,
  FaRulerCombined,
  FaBath,
  FaBed,
} from "react-icons/fa";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./CardProperty.module.css";

export default function CardProperty({
  id,
  namaProperti,
  tipeProperti,
  jenisProperti,
  periodeSewa,
  harga,
  luasTanah,
  luasBangunan,
  kamarTidur,
  kamarMandi,
  lokasi,
  deskripsi,
  media,
  status,
  darkMode,
  onDelete, // ✅ callback dari PropertiPending.jsx
}) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const fallbackImage =
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=60";

  // ✅ Pastikan media jadi array gambar URL yang valid
  const imageList = Array.isArray(media)
    ? media.map((m) => {
        if (typeof m === "object" && m.url) {
          return m.url.startsWith("http")
            ? m.url
            : `http://localhost:3005/media/${m.url}`;
        }
        if (typeof m === "string") {
          return m.startsWith("http")
            ? m
            : `http://localhost:3005/media/${m}`;
        }
        return fallbackImage;
      })
    : [fallbackImage];

  const image = imageList[0] || fallbackImage;

  const getStatusBadgeStyle = () => {
    if (status === "pending")
      return { backgroundColor: isHovered ? "#facc15" : "#fbbf24", text: "⏳ Menunggu Persetujuan" };
    if (status === "aktif")
      return { backgroundColor: isHovered ? "#16a34a" : "#22c55e", text: "✅ Aktif" };
    if (status === "ditolak" || status === "rejected")
      return { backgroundColor: isHovered ? "#dc2626" : "#ef4444", text: "❌ Ditolak" };
    return null;
  };

  const badgeStyle = getStatusBadgeStyle();

  // 🗑️ Hapus Properti
  const handleDelete = async (e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Yakin hapus properti ini?",
      text: `Properti "${namaProperti}" akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e02424",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      background: darkMode ? "#1f2937" : "#fff",
      color: darkMode ? "#fff" : "#000",
    });

    if (result.isConfirmed) {
      try {
        // 🔥 gunakan server.js port 3005 agar hapus + media bisa jalan
        await axios.delete(`http://localhost:3005/properties/${id}`);

        Swal.fire({
          title: "Terhapus!",
          text: "Properti berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          background: darkMode ? "#1f2937" : "#fff",
          color: darkMode ? "#fff" : "#000",
        });

        // Panggil callback agar UI langsung update tanpa reload
        if (onDelete) onDelete(id);
      } catch (error) {
        console.error("Gagal menghapus properti:", error);
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan saat menghapus properti.",
          icon: "error",
          background: darkMode ? "#1f2937" : "#fff",
          color: darkMode ? "#fff" : "#000",
        });
      }
    }
  };

  // ✏️ Edit Properti
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/user/edit-property/${id}`);
  };

  // 👁️ Preview dengan slideshow
  const handlePreview = () => {
    const galleryHtml = `
      <div id="gallery-container" style="position: relative; text-align:center;">
        <img id="gallery-img" src="${imageList[0]}" 
          style="width:100%; border-radius:10px; max-height:400px; object-fit:cover; transition:opacity 0.3s ease;">
        ${
          imageList.length > 1
            ? `
            <button id="prev-btn" style="
              position:absolute; top:50%; left:10px; transform:translateY(-50%);
              background:rgba(0,0,0,0.6); color:white; border:none; padding:8px 12px;
              border-radius:50%; cursor:pointer; font-size:18px;">❮</button>
            <button id="next-btn" style="
              position:absolute; top:50%; right:10px; transform:translateY(-50%);
              background:rgba(0,0,0,0.6); color:white; border:none; padding:8px 12px;
              border-radius:50%; cursor:pointer; font-size:18px;">❯</button>
            <div id="indicator" style="
              position:absolute; bottom:8px; right:10px; background:rgba(0,0,0,0.5);
              color:white; font-size:12px; padding:3px 8px; border-radius:8px;">
              1 / ${imageList.length}
            </div>
            `
            : ""
        }
      </div>
    `;

    Swal.fire({
      title: namaProperti,
      html: `
        <div style="text-align:left">
          <p><b>Jenis:</b> ${jenisProperti}</p>
          <p><b>Tipe:</b> ${tipeProperti}</p>
          <p><b>Harga:</b> Rp${Number(harga).toLocaleString("id-ID")}</p>
          <p><b>Lokasi:</b> ${lokasi}</p>
          <p><b>Deskripsi:</b> ${deskripsi}</p>
          <hr style="margin:10px 0;">
          ${galleryHtml}
        </div>
      `,
      width: "650px",
      confirmButtonText: "Tutup",
      showCloseButton: true,
      background: darkMode ? "#1f2937" : "#fff",
      color: darkMode ? "#fff" : "#000",
      didOpen: () => {
        if (imageList.length > 1) {
          let currentIndex = 0;
          const imgEl = document.getElementById("gallery-img");
          const prevBtn = document.getElementById("prev-btn");
          const nextBtn = document.getElementById("next-btn");
          const indicator = document.getElementById("indicator");

          const updateImage = (newIndex) => {
            imgEl.style.opacity = 0;
            setTimeout(() => {
              imgEl.src = imageList[newIndex];
              indicator.textContent = `${newIndex + 1} / ${imageList.length}`;
              imgEl.style.opacity = 1;
            }, 200);
          };

          prevBtn.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + imageList.length) % imageList.length;
            updateImage(currentIndex);
          });

          nextBtn.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % imageList.length;
            updateImage(currentIndex);
          });
        }
      },
    });
  };

  return (
    <div
      className={`${styles.card} ${darkMode ? styles.dark : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handlePreview}
      style={{
        position: "relative",
        cursor: "pointer",
        transform: isHovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.3s ease",
        boxShadow: isHovered
          ? "0 8px 20px rgba(0,0,0,0.25)"
          : "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* 🖼️ Gambar utama */}
      <div className={styles.imageWrapper}>
        <img
          src={image}
          alt={namaProperti || "Gambar Properti"}
          loading="lazy"
          onError={(e) => (e.target.src = fallbackImage)}
          className={styles.image}
        />
      </div>

      {badgeStyle && (
  <div
    style={{
      position: "absolute",
      top: "10px",
      left: "10px",
      backgroundColor: badgeStyle.backgroundColor,
      color: "#fff",
      padding: "6px 10px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "bold",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    }}
  >
    {badgeStyle.text}
  </div>
)}


      {/* 🧱 Body */}
      <div className={styles.cardBody}>
        <div className={styles.badgeGroup}>
          {tipeProperti && (
            <span className={`${styles.badge} ${darkMode ? styles.badgeDark : ""}`}>
              {tipeProperti}
            </span>
          )}
          {jenisProperti && (
            <span
              className={`${styles.badgeSecondary} ${darkMode ? styles.badgeDark : ""}`}
            >
              {jenisProperti === "sewa" ? "Untuk Disewa" : "Dijual"}
            </span>
          )}
        </div>

        <h3 className={styles.cardTitle}>{namaProperti}</h3>

        {lokasi && (
          <p className={styles.cardLocation}>
            <FaMapMarkerAlt className={styles.icon} /> {lokasi}
          </p>
        )}

        {harga && (
          <p className={styles.cardPrice}>
            <FaMoneyBillWave className={styles.icon} /> Rp
            {harga.toLocaleString("id-ID")}{" "}
            {jenisProperti === "sewa" && periodeSewa && (
              <span className={styles.periode}>{periodeSewa}</span>
            )}
          </p>
        )}

        <div className={styles.propertyDetails}>
          {luasTanah && (
            <span>
              <FaRulerCombined className={styles.iconSmall} /> {luasTanah} m²
            </span>
          )}
          {kamarTidur && (
            <span>
              <FaBed className={styles.iconSmall} /> {kamarTidur}
            </span>
          )}
          {kamarMandi && (
            <span>
              <FaBath className={styles.iconSmall} /> {kamarMandi}
            </span>
          )}
        </div>

        {deskripsi && (
          <p className={styles.cardDesc}>
            {deskripsi.length > 100 ? deskripsi.slice(0, 100) + "..." : deskripsi}
          </p>
        )}

        {/* Tombol Edit & Hapus hanya muncul saat pending/rejected */}
        {(status?.toLowerCase() === "pending" ||
          ["ditolak", "rejected", "not-approved", "declined", "failed"].includes(
            status?.toLowerCase()
          )) && (
          <div className={styles.actionButtons}>
            <button
              className={`${styles.editBtn} ${darkMode ? styles.editBtnDark : ""}`}
              onClick={handleEdit}
            >
              <FaEdit />
            </button>
            <button
              className={`${styles.deleteBtn} ${darkMode ? styles.deleteBtnDark : ""}`}
              onClick={handleDelete}
            >
              <FaTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
