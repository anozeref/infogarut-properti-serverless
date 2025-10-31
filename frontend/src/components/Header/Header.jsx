// src/components/Header/Header.jsx

// Mengimpor React dan hook useContext untuk mengakses context
import React, { useContext } from "react";
// Mengimpor CSS Modules untuk styling
import styles from "./Header.module.css";
// Mengimpor ikon dari react-icons
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
// Mengimpor komponen navigasi (NavLink) dan hooks (useNavigate, useLocation) dari react-router-dom
import { NavLink, useNavigate, useLocation } from "react-router-dom";
// Mengimpor library SweetAlert2 untuk menampilkan popup konfirmasi
import Swal from "sweetalert2";
// Mengimpor AuthContext untuk mendapatkan data user dan fungsi logout
import { AuthContext } from "../../context/AuthContext";
// Mengimpor gambar logo
import logoImage from "../../assets/logo.png";

/**
 * Komponen `Header`:
 * Menampilkan bagian header website, termasuk logo, navigasi utama,
 * dan tombol interaksi pengguna (login/profil/logout).
 * Header ini akan disembunyikan pada rute login dan register.
 * @returns {React.ReactNode | null} JSX untuk header atau null jika disembunyikan.
 */
const Header = () => {
  // Mengambil state 'user' dan fungsi 'logout' dari AuthContext
  const { user, logout } = useContext(AuthContext);
  // Hook untuk navigasi programmatic (pindah halaman dari fungsi)
  const navigate = useNavigate();
  // Hook untuk mendapatkan informasi tentang rute (URL) saat ini
  const location = useLocation();

  // Daftar rute di mana header TIDAK akan ditampilkan
  const hideHeaderRoutes = ["/login", "/register"];
  // Logika: Cek jika path URL saat ini ada dalam daftar hideHeaderRoutes
  if (hideHeaderRoutes.includes(location.pathname)) {
    // Jika ya, jangan render header (kembalikan null)
    return null;
  }

  /**
   * Fungsi `handleUserClick`:
   * Menentukan tujuan navigasi saat ikon user diklik.
   * - Jika tidak ada user (belum login), arahkan ke halaman login.
   * - Jika user adalah admin, arahkan ke dashboard admin.
   * - Jika user biasa, arahkan ke dashboard user.
   */
  const handleUserClick = () => {
    if (!user) navigate("/login");
    else if (user.role === "admin") navigate("/admin");
    else if (user.role === "user") navigate("/user");
    // Anda bisa menambahkan role lain jika perlu
  };

  /**
   * Fungsi `handleLogout`:
   * Menampilkan popup konfirmasi sebelum melakukan logout.
   * Jika dikonfirmasi, panggil fungsi `logout` dari context, arahkan ke homepage,
   * dan tampilkan notifikasi sukses.
   */
  const handleLogout = () => {
    // Menampilkan popup konfirmasi menggunakan SweetAlert2
    Swal.fire({
      title: "Yakin ingin keluar?", // Judul popup
      icon: "question",             // Ikon pertanyaan
      showCancelButton: true,       // Tampilkan tombol batal
      confirmButtonText: "Keluar",  // Teks tombol konfirmasi
      cancelButtonText: "Batal",    // Teks tombol batal
    }).then((res) => {
      // Callback setelah user memilih (res.isConfirmed akan true jika tombol 'Keluar' diklik)
      if (res.isConfirmed) {
        logout();        // Panggil fungsi logout dari AuthContext
        navigate("/");   // Arahkan pengguna kembali ke halaman utama
        // Tampilkan notifikasi sukses logout
        Swal.fire("Keluar!", "Anda berhasil keluar.", "success");
      }
    });
  };

  // Render JSX komponen Header
  return (
    // Elemen header utama
    <header className={styles.header}>
      {/* Kontainer untuk membatasi lebar dan mengatur layout flex */}
      <div className={styles.container}>
        {/* Logo sebagai NavLink ke halaman utama */}
        <NavLink to="/" className={styles.logo}>
          <img src={logoImage} alt="Logo Propertease Infogarut.id" />
        </NavLink>

        {/* Bagian kanan header, berisi navigasi dan tombol user */}
        <div className={styles.rightSection}>
          {/* Navigasi utama */}
          <nav className={styles.nav}>
            {/* NavLink ke Beranda */}
            <NavLink
              to="/"
              // Fungsi untuk menentukan class: tambahkan 'active' jika link ini aktif
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Beranda
            </NavLink>
            {/* NavLink ke Properti */}
            <NavLink
              to="/properti"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
              }
            >
              Properti
            </NavLink>
            {/* Tautan eksternal ke Blog (menggunakan tag <a> biasa) */}
            <a
              href="https://infogarut.id" // URL tujuan eksternal
              target="_blank"             // Buka di tab baru
              rel="noopener noreferrer"   // Keamanan untuk target="_blank"
              className={styles.navLink}  // Gunakan style yang sama dengan NavLink
            >
              Blog
            </a>
          </nav>

          {/* Tombol ikon User (untuk login atau navigasi ke profil) */}
          <button
            onClick={handleUserClick} // Panggil fungsi handleUserClick saat diklik
            className={styles.userIcon} // Style untuk tombol
            // Tooltip: Tampilkan nama depan user jika login, atau "Masuk" jika belum
            title={user ? user.nama.split(" ")[0] : "Masuk"}
          >
            <FaUserCircle size={28} /> {/* Ikon user */}
          </button>

          {/* Tombol Logout: Hanya tampil jika 'user' ada (user sudah login) */}
          {user && (
            <button
              onClick={handleLogout} // Panggil fungsi handleLogout saat diklik
              className={styles.logoutBtn} // Style untuk tombol logout
              title="Keluar" // Tooltip
            >
              <FaSignOutAlt size={24} /> {/* Ikon logout */}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

// Ekspor komponen Header agar bisa digunakan di file lain (misal: App.jsx)
export default Header;