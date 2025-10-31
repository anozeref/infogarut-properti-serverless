// src/components/Footer/Footer.jsx

// Mengimpor React dan hook useLocation dari react-router-dom
import React from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation untuk mendapatkan info rute saat ini
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './Footer.module.css';

/**
 * Komponen `Footer`:
 * Menampilkan bagian footer di bagian bawah halaman.
 * Footer ini akan disembunyikan secara otomatis pada rute tertentu (misal: halaman login/register).
 * @returns {React.ReactNode | null} JSX untuk footer atau null jika disembunyikan.
 */
const Footer = () => {
  // Mendapatkan objek lokasi saat ini dari React Router
  const location = useLocation();

  // Daftar rute (URL path) di mana footer TIDAK akan ditampilkan
  const hideFooterRoutes = ["/login", "/register"];

  // Logika Penyembunyian Footer:
  // Cek apakah path URL saat ini (location.pathname) ada di dalam array hideFooterRoutes.
  if (hideFooterRoutes.includes(location.pathname)) {
    // Jika ada, jangan render (tampilkan) apa-apa (kembalikan null).
    return null;
  }

  // Jika rute saat ini BUKAN salah satu dari hideFooterRoutes,
  // maka tampilkan elemen footer.
  return (
    <footer className={styles.footer}>
      {/* Teks copyright */}
      <p>© 2025 Infogarut Properti. All Rights Reserved.</p>
      {/* Teks subjudul/tagline */}
      <p className={styles.subtext}>Temukan Hunian dan Investasi Terbaik di Garut</p>
    </footer>
  );
};

// Mengekspor komponen Footer agar bisa digunakan di file lain (misal: App.jsx)
export default Footer;