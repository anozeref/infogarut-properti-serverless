// src/pages/user/components/NavbarUser.jsx
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaCog,
  FaGlobe,
  FaMoon,
  FaSun,
  FaCheckDouble, // Ikon untuk clear
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AuthContext } from "../../../context/AuthContext";
import styles from "./NavbarUser.module.css";
import logo from "../assets/logo.png";
import logodarkmode from "../assets/logodarkmode.png";
// HAPUS IMPORT 'io' KARENA SOCKET DIPINDAH

// ====================================================================
// Menerima 'handleClear' dari props
// ====================================================================
export default function NavbarUser({ darkMode, toggleTheme, notifications, handleClear }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  // === Toggle dropdown ===
  const toggleNotif = () => {
    setShowNotif(!showNotif);
    setShowProfile(false);
  };

  const toggleProfile = () => {
    setShowProfile((prev) => !prev);
    setShowNotif(false);
  };
  
  // ====================================================================
  // HAPUS 'handleClearNotifications' LOKAL DARI SINI
  // Tombol clear akan langsung memanggil 'handleClear' dari props
  // ====================================================================

  // === Logout ===
  const handleLogout = async () => {
    const confirm = await Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan keluar dari akun ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
    });

    if (confirm.isConfirmed) {
      logout();
      Swal.fire({
        title: "Berhasil Logout!",
        text: "Kamu telah keluar dari akun.",
        icon: "success",
        confirmButtonColor: "#4f46e5",
      }).then(() => navigate("/"));
    }
  };

  // === Tutup dropdown jika klik di luar ===
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideNotif = notifRef.current && notifRef.current.contains(event.target);
      const isInsideProfile = profileRef.current && profileRef.current.contains(event.target);
      
      if (!isInsideNotif && !isInsideProfile) {
        setShowNotif(false);
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); 

  // HAPUS SEMUA 'useEffect' SOCKET.IO DARI SINI
  // HAPUS FUNGSI 'addNotification' DAN TOAST DARI SINI

  // ====================================================================
  // Hitung notifikasi yang BELUM DIBACA
  // ====================================================================
  const unreadCount = notifications.filter(n => !n.isRead).length; 

  return (
    <nav className={`${styles.navbar} ${darkMode ? styles.dark : ""}`}>
      {/* 🔹 Logo berubah sesuai tema */}
      <div className={styles.logo}>
        <Link to="/">
          <img
            src={darkMode ? logodarkmode : logo}
            alt="Logo"
            className={styles.logoImg}
          />
        </Link>
      </div>

      {/* 🔗 Link ke landing page */}
      <div className={styles.landingLink}>
        <Link
          to="/"
          className={`${styles.landingBtn} ${darkMode ? styles.landingBtnDark : ""}`}
        >
          <FaGlobe className={styles.landingIcon} /> Beranda
        </Link>
      </div>

      {/* 🔧 Bagian kanan navbar */}
      <div className={styles.navbarRight}>
        {/* 🔔 Notifikasi */}
        <div className={styles.notif} ref={notifRef}>
          <button className={styles.notifBtn} onClick={toggleNotif}>
            <FaBell size={20} />
            {/* Badge sekarang menampilkan unreadCount */}
            {unreadCount > 0 && (
              <span className={styles.notifBadge}>{unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div className={`${styles.notifBox} ${darkMode ? styles.notifBoxDark : ""}`}>
              <div className={styles.notifHeader}>
                <strong>Notifikasi</strong>
                {/* Tombol clear sekarang memanggil 'handleClear' dari props */}
                {unreadCount > 0 && ( // Hanya tampilkan jika ada yg belum dibaca
                   <button 
                     onClick={handleClear} // PANGGIL FUNGSI DARI 'OTAK'
                     className={styles.clearNotifBtn}
                     title="Tandai semua sudah dibaca"
                   >
                     <FaCheckDouble />
                   </button>
                )}
              </div>
              
              {/* Render list notifikasi dari props */}
              {notifications.length === 0 ? (
                <p className={styles.emptyNotif}>Tidak ada notifikasi baru</p>
              ) : (
                notifications.map((notif) => (
                  <p 
                    key={notif.id} 
                    // Tambahkan style 'notifRead' jika 'isRead' true
                    className={`
                      ${styles.notifItem} 
                      ${notif.link ? styles.notifLink : ''} 
                      ${notif.isRead ? styles.notifRead : ''}
                    `}
                    onClick={() => {
                      if (notif.link) navigate(notif.link);
                      setShowNotif(false);
                      // (Opsional) Bisa tambahkan logic PATCH 'isRead' tunggal di sini
                    }}
                  >
                    {notif.message}
                    <br />
                    <small>{new Date(notif.time).toLocaleString("id-ID", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                  </p>
                ))
              )}
            </div>
          )}
        </div>

        {/* 🌙 Tema */}
        <button className={styles.themeBtn} onClick={toggleTheme}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* 👤 Profil */}
        <div className={styles.userLogo} ref={profileRef}>
          <FaUserCircle size={28} onClick={toggleProfile} />
          {showProfile && (
            <div className={`${styles.profileBox} ${darkMode ? styles.profileBoxDark : ""}`}>
              <Link
                to="/user/profileuser"
                className={`${styles.settingBtn} ${darkMode ? styles.settingBtnDark : ""}`}
                onClick={() => setShowProfile(false)} 
              >
                <FaCog className={styles.settingIcon} /> Pengaturan Akun
              </Link>

              <button
                className={`${styles.settingBtn} ${darkMode ? styles.settingBtnDark : ""}`}
                onClick={handleLogout}
              >
                <FaSignOutAlt className={styles.settingIcon} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}