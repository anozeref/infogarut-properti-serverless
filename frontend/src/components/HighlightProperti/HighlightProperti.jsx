// src/components/HighlightProperti/HighlightProperti.jsx

// Mengimpor React untuk membuat komponen
import React from 'react';
// Mengimpor komponen Slider dari library react-slick
import Slider from "react-slick";
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './HighlightProperti.module.css';
// Mengimpor komponen Link dari react-router-dom untuk navigasi
import { Link } from 'react-router-dom';
// Mengimpor ikon lokasi dari react-icons
import { IoLocationOutline } from "react-icons/io5";
import { MEDIA_BASE_URL } from '../../utils/constant.js';

// Mengimpor file CSS bawaan dari react-slick (wajib untuk styling dasar slider)
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * Komponen `HighlightCard` (Sub-komponen):
 * Bertanggung jawab untuk menampilkan tampilan visual satu kartu properti di dalam slider.
 * Menerima data satu properti (`property`) sebagai prop.
 * @param {object} props - Props yang diterima.
 * @param {object} props.property - Objek data untuk satu properti.
 * @returns {React.ReactNode} JSX untuk satu kartu highlight.
 */
const HighlightCard = ({ property }) => {
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

    // Logika menentukan URL gambar:
    // Cek apakah `property.media` ada dan berisi setidaknya satu gambar.
    // Resolusi URL:
    // - Jika nilai media sudah berupa URL absolut (http/https), gunakan langsung.
    // - Jika berupa path relatif di storage Supabase, gabungkan dengan MEDIA_BASE_URL.
    // - Jika tidak ada, gunakan URL gambar placeholder.
    const resolveMediaUrl = (val) => {
        if (!val) return null;
        if (typeof val === 'string' && /^https?:\/\//.test(val)) return val;
        if (typeof val === 'string' && MEDIA_BASE_URL) return `${MEDIA_BASE_URL}${val}`;
        return null;
    };
    const firstMedia = property.media && property.media.length > 0 ? property.media[0] : null;
    const resolvedImage = resolveMediaUrl(firstMedia);
    const image = resolvedImage || 'https://via.placeholder.com/300x200.png?text=No+Image'; // Gambar placeholder

    // Render JSX untuk satu kartu
    return (
        // Div pembungkus luar diperlukan oleh react-slick untuk styling padding antar slide
        <div className={styles.slideItem}>
            {/* Menggunakan Link agar seluruh kartu bisa diklik menuju halaman detail properti */}
            <Link to={`/properti/${property.id}`} className={styles.cardLink}>
                {/* Div utama kartu */}
                <div className={styles.card}>
                    {/* Gambar properti */}
                    <img src={image} alt={property.namaProperti} className={styles.cardImage} />
                    {/* Konten teks di bawah gambar */}
                    <div className={styles.cardContent}>
                        {/* Judul/Nama Properti */}
                        <h4 className={styles.cardTitle}>{property.namaProperti}</h4>
                        {/* Lokasi (Kecamatan) */}
                        <p className={styles.cardLocation}><IoLocationOutline size={14}/> {property.kecamatan}, Garut</p>
                        {/* Harga Properti */}
                        <p className={styles.cardPrice}>{formatPrice(property.harga)}</p>
                    </div>
                </div>
            </Link>
        </div>
    );
};

/**
 * Komponen `HighlightProperti` (Komponen Utama):
 * Menampilkan bagian "Properti Terbaru" di halaman utama dalam bentuk slider.
 * Menerima array data properti (`properties`) sebagai prop dari komponen induk (HomePage).
 * Menggunakan library `react-slick` untuk fungsionalitas slider.
 * Menampilkan pesan jika tidak ada properti yang diterima.
 * @param {object} props - Props yang diterima.
 * @param {object[]} props.properties - Array berisi objek data properti terbaru.
 * @returns {React.ReactNode} JSX untuk bagian highlight properti.
 */
const HighlightProperti = ({ properties }) => {

    // Konfigurasi untuk komponen Slider react-slick
    const settings = {
        dots: true, // Menampilkan titik navigasi di bawah slider
        infinite: properties && properties.length > 3, // Slider akan loop jika jumlah properti > 3
        speed: 500, // Kecepatan animasi transisi slide (ms)
        slidesToShow: 3, // Jumlah slide yang terlihat dalam satu waktu di layar besar
        slidesToScroll: 1, // Jumlah slide yang bergeser saat navigasi
        autoplay: true, // Slider akan bergeser otomatis
        autoplaySpeed: 3000, // Waktu (ms) sebelum slide bergeser otomatis
        pauseOnHover: true, // Autoplay akan berhenti jika mouse diarahkan ke slider
        responsive: [ // Pengaturan responsif untuk ukuran layar berbeda
            {
              breakpoint: 1024, // Untuk layar <= 1024px (Tablet)
              settings: { slidesToShow: 2 } // Tampilkan 2 slide
            },
            {
              breakpoint: 600,  // Untuk layar <= 600px (Mobile)
              settings: { slidesToShow: 1, dots: false } // Tampilkan 1 slide, sembunyikan dots
            }
        ]
    };

    // Render JSX komponen HighlightProperti
    return (
        // Section pembungkus utama
        <section className={styles.highlightSection}>
            {/* Kontainer untuk membatasi lebar */}
            <div className={styles.container}>
                {/* Judul bagian */}
                <h2 className={styles.title}>Properti Terbaru</h2>
                {/* Subjudul bagian */}
                <p className={styles.subtitle}>Temukan properti yang sesuai dengan kebutuhan Anda.</p>

                {/* Logika Kondisional Rendering:
                    Cek apakah array `properties` ada dan tidak kosong.
                */}
                {properties && properties.length > 0 ? (
                    // Jika ADA properti: Tampilkan komponen Slider
                    <Slider {...settings}>
                        {/* Mapping data properti:
                            Looping melalui setiap objek `property` dalam array `properties`.
                            Untuk setiap `property`, render komponen `HighlightCard`.
                            Mengirimkan data `property` sebagai prop ke `HighlightCard`.
                            `key` diperlukan oleh React untuk identifikasi unik saat mapping.
                        */}
                        {properties.map(property => (
                            <HighlightCard key={property.id} property={property} />
                        ))}
                    </Slider>
                ) : (
                    // Jika TIDAK ADA properti: Tampilkan pesan pengganti
                    <div className={styles.noPropertiesMessage}>
                        Belum ada properti terbaru saat ini.
                    </div>
                )}
            </div>
        </section>
    );
};

// Mengekspor komponen HighlightProperti agar bisa digunakan di file lain
export default HighlightProperti;