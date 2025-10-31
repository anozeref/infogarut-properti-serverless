// src/components/Categories/Categories.jsx

// Mengimpor React dan hook yang diperlukan
import React from 'react';
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './Categories.module.css';
// Mengimpor komponen Link dari react-router-dom untuk navigasi internal
import { Link } from 'react-router-dom';
// Mengimpor ikon-ikon dari library react-icons
import { IoHomeOutline } from "react-icons/io5";
import { LuCastle } from "react-icons/lu"; // Hapus LuBuilding jika tidak dipakai lagi
import { TbDimensions } from "react-icons/tb";
import { BsBuildings } from "react-icons/bs"; // Hapus BsShop jika tidak dipakai lagi

/**
 * @typedef {object} CategoryItem
 * @property {React.ReactNode} icon - Komponen ikon untuk kategori.
 * @property {string} title - Nama kategori (misal: "Rumah", "Villa").
 * @property {string} description - Deskripsi singkat tentang kategori.
 */

/**
 * Array berisi data untuk setiap kartu kategori yang akan ditampilkan.
 * Setiap objek dalam array ini mewakili satu kategori.
 * @type {CategoryItem[]}
 */
const categoriesData = [
  {
    icon: <IoHomeOutline size={40} />,
    title: "Rumah",
    description: "Temukan rumah keluarga yang nyaman dan modern."
  },
  {
    icon: <LuCastle size={40} />,
    title: "Villa",
    description: "Nikmati kemewahan dan privasi di villa eksklusif."
  },
  {
    icon: <TbDimensions size={40} />,
    title: "Tanah",
    description: "Investasi di lokasi strategis untuk masa depan."
  },
  {
    icon: <BsBuildings size={40} />,
    title: "Perumahan",
    description: "Pilih hunian di lingkungan yang terencana dan aman."
  }
  // Kategori "Kos" dan "Ruko" dihapus dari sini
];

/**
 * Komponen `CategoryCard` (Sub-komponen):
 * Bertanggung jawab untuk menampilkan tampilan visual satu kartu kategori.
 * Menerima data (icon, title, description) sebagai props.
 * @param {CategoryItem} props - Data untuk satu kartu kategori.
 * @returns {React.ReactNode} JSX untuk satu kartu kategori.
 */
const CategoryCard = ({ icon, title, description }) => (
  <div className={styles.card}>
    <div className={styles.icon}>{icon}</div>
    <h3 className={styles.cardTitle}>{title}</h3>
    <p className={styles.cardDescription}>{description}</p>
  </div>
);

/**
 * Komponen `Categories` (Komponen Utama):
 * Bertanggung jawab untuk menampilkan seluruh bagian "Jelajahi Berdasarkan Kategori".
 * Mengambil data dari `categoriesData` dan menampilkannya dalam bentuk grid kartu.
 * Setiap kartu adalah tautan (`Link`) yang mengarahkan ke halaman properti dengan filter tipe yang sesuai.
 * @returns {React.ReactNode} JSX untuk seluruh bagian kategori.
 */
const Categories = () => {
  return (
    // Section utama pembungkus
    <section className={styles.categoriesSection}>
      {/* Kontainer untuk membatasi lebar dan mengatur padding */}
      <div className={styles.container}>
        {/* Judul bagian */}
        <h2 className={styles.title}>Jelajahi Berdasarkan Kategori</h2>
        {/* Subjudul bagian */}
        <p className={styles.subtitle}>Temukan properti yang sesuai dengan kebutuhan Anda.</p>
        {/* Grid untuk menampung kartu-kartu kategori */}
        <div className={styles.grid}>
          {/* Logika Mapping */}
          {categoriesData.map((cat, index) => (
            /* Komponen `Link` */
            <Link key={index} to={`/properti?tipe=${cat.title}`} className={styles.cardLink}>
              {/* Menampilkan komponen CategoryCard */}
              <CategoryCard {...cat} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Mengekspor komponen Categories
export default Categories;