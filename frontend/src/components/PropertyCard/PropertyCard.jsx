// src/components/PropertyCard/PropertyCard.jsx

// Mengimpor React untuk membuat komponen
import React from 'react';
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './PropertyCard.module.css';
// Mengimpor komponen Link dari react-router-dom untuk membuat kartu bisa diklik
import { Link } from 'react-router-dom';
// Mengimpor ikon-ikon dari react-icons
import { IoLocationOutline } from "react-icons/io5";
import { LuBedDouble, LuBath } from "react-icons/lu";
import { RxRulerSquare } from "react-icons/rx";
import { MEDIA_BASE_URL } from '../../utils/constant.js';

/**
 * Komponen `PropertyCard`:
 * Bertanggung jawab untuk menampilkan ringkasan informasi satu properti dalam bentuk kartu.
 * Kartu ini berfungsi sebagai tautan ke halaman detail properti yang bersangkutan.
 * Menerima data satu properti (`property`) sebagai prop.
 * @param {object} props - Props yang diterima.
 * @param {object} props.property - Objek data untuk satu properti.
 * @returns {React.ReactNode} JSX untuk satu kartu properti.
 */
const PropertyCard = ({ property }) => {

  /**
   * Fungsi `formatPrice`: Mengubah angka harga (atau string angka) menjadi format mata uang Rupiah.
   * @param {number | string} price - Harga properti.
   * @returns {string} Harga dalam format Rupiah (misal: "Rp 150.000.000").
   */
  const formatPrice = (price) => {
    // Mengonversi input harga ke tipe number jika berupa string
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Menggunakan Intl.NumberFormat untuk format mata uang IDR
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericPrice);
  };
  
  // Helper untuk meresolve URL media (mendukung URL absolut atau path relatif ke Supabase Storage)
  const resolveMediaUrl = (item) => {
    const url = String(item || "");
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = MEDIA_BASE_URL || "";
    return base ? `${base}${url}` : null;
  };
  
  // Logika menentukan URL gambar utama untuk kartu:
  // Cek apakah `property.media` (array nama file gambar) ada dan tidak kosong.
  // Jika ya, gunakan nama file pertama (`property.media[0]`) dan buat URL lengkap
  // ke server backend (port 3005) yang menyajikan gambar dari folder /media.
  // Jika tidak ada gambar, gunakan URL gambar placeholder.
  const mainImage = property.media && property.media.length > 0
    ? resolveMediaUrl(property.media[0]) || 'https://via.placeholder.com/400x300.png?text=No+Image'
    : 'https://via.placeholder.com/400x300.png?text=No+Image';

  // Render JSX untuk komponen PropertyCard
  return (
    // Menggunakan komponen `Link` agar seluruh area kartu bisa diklik
    // `to`: Menentukan URL tujuan (halaman detail properti) berdasarkan `property.id`.
    <Link to={`/properti/${property.id}`} className={styles.cardLink}>
      {/* Div utama pembungkus kartu */}
      <div className={styles.card}>
        {/* Gambar utama properti */}
        <img src={mainImage} alt={property.namaProperti} className={styles.image} />
        {/* Konten teks di bawah gambar */}
        <div className={styles.content}>
          {/* Lokasi properti */}
          <div className={styles.location}>
            <IoLocationOutline />
            <span>{property.lokasi}</span>
          </div>
          {/* Judul/Nama Properti */}
          <h3 className={styles.title}>{property.namaProperti}</h3>

          {/* Tag untuk tipe dan jenis properti */}
          <div className={styles.tags}>
            <span className={styles.tag}>{property.tipeProperti}</span>
            <span className={styles.tagJenis}>{property.jenisProperti}</span>
          </div>
          
          {/* Detail ringkas properti (kamar tidur, kamar mandi, luas) */}
          <div className={styles.details}>
            <div className={styles.detailItem}><LuBedDouble /> {property.kamarTidur}</div>
            <div className={styles.detailItem}><LuBath /> {property.kamarMandi}</div>
            <div className={styles.detailItem}><RxRulerSquare /> {property.luasBangunan} m²</div>
          </div>
          {/* Harga properti */}
          <div className={styles.price}>
            {formatPrice(property.harga)}
            {/* Tampilkan periode sewa jika ada (untuk properti sewa) */}
            {property.periodeSewa && <span className={styles.periodeSewa}>{property.periodeSewa}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Mengekspor komponen PropertyCard agar bisa digunakan di file lain (misal: Properti.jsx)
export default PropertyCard;