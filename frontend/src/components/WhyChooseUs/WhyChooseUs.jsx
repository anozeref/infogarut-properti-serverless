// src/components/WhyChooseUs/WhyChooseUs.jsx

// Mengimpor React untuk membuat komponen
import React from 'react';
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './WhyChooseUs.module.css';
// Mengimpor ikon-ikon dari library react-icons
import { FaRegBuilding, FaUserTie, FaPenNib } from "react-icons/fa";
import { FiShield } from "react-icons/fi";

/**
 * @typedef {object} FeatureItem
 * @property {React.ReactNode} icon - Komponen ikon untuk fitur/keunggulan.
 * @property {string} title - Judul fitur/keunggulan.
 * @property {string} description - Deskripsi singkat fitur/keunggulan.
 */

/**
 * Array berisi data untuk setiap poin keunggulan ("Mengapa Memilih Kami").
 * Setiap objek dalam array ini akan ditampilkan sebagai satu item fitur.
 * @type {FeatureItem[]}
 */
const features = [
    {
        icon: <FaRegBuilding size={32} />, // Ikon untuk pilihan properti
        title: "Pilihan Properti Terbaik",
        description: "Kami menawarkan daftar properti terkurasi yang memenuhi standar kualitas dan kenyamanan tertinggi."
    },
    {
        icon: <FaUserTie size={32} />, // Ikon untuk agen
        title: "Agen Profesional",
        description: "Tim agen kami yang berpengalaman siap membantu Anda di setiap langkah, memastikan transaksi berjalan lancar."
    },
    {
        icon: <FaPenNib size={32} />, // Ikon untuk proses
        title: "Proses Mudah & Cepat",
        description: "Kami menyederhanakan proses pembelian, membuatnya transparan dan bebas stres dari awal hingga akhir."
    },
    {
        icon: <FiShield size={32} />, // Ikon untuk keamanan
        title: "Aman & Terpercaya",
        description: "Keamanan transaksi Anda adalah prioritas kami. Kami memastikan semua proses legal dan aman."
    }
];

/**
 * Komponen `WhyChooseUs`:
 * Menampilkan bagian "Mengapa Memilih InfoGarutProperti" di halaman utama.
 * Menjelaskan keunggulan platform dalam beberapa poin menggunakan ikon, judul, dan deskripsi.
 * Mengambil data dari array `features` dan menampilkannya dalam layout grid.
 * @returns {React.ReactNode} JSX untuk bagian "Why Choose Us".
 */
const WhyChooseUs = () => {
    // Render JSX komponen WhyChooseUs
    return (
        // Section pembungkus utama
        <section className={styles.section}>
            {/* Kontainer untuk membatasi lebar dan mengatur padding */}
            <div className={styles.container}>
                {/* Judul utama bagian */}
                <h2 className={styles.title}>Mengapa Memilih InfoGarutProperti?</h2>
                {/* Subjudul atau tagline */}
                <p className={styles.subtitle}>
                    Kami berdedikasi untuk memberikan pengalaman terbaik dalam menemukan rumah impian Anda.
                </p>
                {/* Grid untuk menampung item-item fitur/keunggulan */}
                <div className={styles.featuresGrid}>
                    {/* Logika Mapping:
                        Iterasi (looping) melalui setiap item (`feature`) dalam array `features`.
                        Untuk setiap item, render (tampilkan) sebuah div `featureItem`.
                    */}
                    {features.map((feature, index) => (
                        // Div pembungkus untuk satu item fitur
                        // `key` diperlukan oleh React saat mapping untuk identifikasi unik.
                        <div key={index} className={styles.featureItem}>
                            {/* Wrapper bulat untuk ikon */}
                            <div className={styles.iconWrapper}>
                                {feature.icon} {/* Menampilkan ikon */}
                            </div>
                            {/* Judul fitur */}
                            <h3 className={styles.featureTitle}>{feature.title}</h3>
                            {/* Deskripsi fitur */}
                            <p className={styles.featureDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Mengekspor komponen WhyChooseUs agar bisa digunakan di file lain (misal: HomePage.jsx)
export default WhyChooseUs;