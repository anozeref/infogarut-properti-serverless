// src/pages/PropertiDetail/PropertiDetail.jsx

// Mengimpor React dan hooks useState, useEffect
import React, { useState, useEffect } from 'react';
// Mengimpor CSS Modules untuk styling
import styles from './PropertiDetail.module.css';
// Mengimpor Link untuk navigasi internal dan useParams untuk mendapatkan ID dari URL
import { Link, useParams } from 'react-router-dom';
// Mengimpor ikon-ikon dari react-icons
import { IoLocationOutline, IoArrowBack } from "react-icons/io5";
import { LuBedDouble, LuBath } from "react-icons/lu";
import { RxRulerSquare } from "react-icons/rx";
import { FaInstagram } from "react-icons/fa"; // Pastikan ikon Instagram diimpor
import { API_URL } from "../../utils/constant";

/**
 * Komponen Halaman `PropertiDetail`:
 * Bertanggung jawab untuk menampilkan detail lengkap dari satu properti.
 * Mengambil ID properti dari parameter URL.
 * Mengambil data properti spesifik dari API (json-server) berdasarkan ID.
 * Menampilkan galeri gambar interaktif.
 * Menampilkan detail properti seperti harga, tipe, jenis, spesifikasi, dan deskripsi.
 * Menyediakan tombol kontak ke agen/pemasang iklan.
 * @returns {React.ReactNode} JSX untuk halaman detail properti.
 */
const PropertiDetail = () => {
    // Hook `useParams`: Mengambil parameter dinamis dari URL.
    // Dalam kasus ini, mengambil `id` dari rute `/properti/:id`.
    const { id } = useParams();
    // State `property`: Menyimpan objek data properti yang diambil dari API. Awalnya null.
    const [property, setProperty] = useState(null);
    // State `loading`: Menandakan apakah data sedang dalam proses pengambilan. Awalnya true.
    const [loading, setLoading] = useState(true);
    // State `activeImage`: Menyimpan URL gambar yang sedang ditampilkan sebagai gambar utama di galeri.
    const [activeImage, setActiveImage] = useState('');

    // useEffect Hook untuk mengambil data detail properti saat komponen dimuat atau saat `id` berubah.
    useEffect(() => {
        setLoading(true); // Mulai status loading
        // Mengambil data dari serverless API untuk properti dengan ID spesifik
        fetch(`${API_URL}properties?id=${id}`)
            .then(res => {
                // Jika response tidak OK (misal: 404 Not Found), lempar error
                if (!res.ok) {
                    throw new Error('Properti tidak ditemukan');
                }
                return res.json(); // Ubah response menjadi JSON
            })
            .then(data => {
                setProperty(data); // Simpan data properti ke state
                // Set gambar aktif awal: cek jika data ada, punya media, dan media tidak kosong
                if (data && data.media && data.media.length > 0) {
                    // Media sudah berupa full URL dari Vercel Blob
                    setActiveImage(data.media[0]);
                } else {
                    // Jika tidak ada gambar, set ke string kosong atau URL placeholder
                    setActiveImage(''); // Atau gambar placeholder: 'https://via.placeholder.com/800x600.png?text=No+Image'
                }
            })
            .catch(error => {
                console.error("Gagal mengambil detail properti:", error);
                setProperty(null); // Set properti ke null jika terjadi error
            })
            .finally(() => setLoading(false)); // Selesaikan status loading
    }, [id]); // Array dependensi: Efek ini akan berjalan lagi jika nilai `id` berubah

    /**
     * Fungsi `handleThumbnailClick`: Mengubah gambar utama (`activeImage`) saat thumbnail diklik.
     * @param {string} imageName - Nama file gambar yang diklik.
     */
    const handleThumbnailClick = (imageName) => {
        // Media sudah berupa full URL dari Vercel Blob
        setActiveImage(imageName);
    };

    /**
     * Fungsi `formatPrice`: Mengubah angka harga menjadi format mata uang Rupiah.
     * @param {number | string} price - Harga properti.
     * @returns {string} Harga dalam format Rupiah.
     */
    const formatPrice = (price) => {
        const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
        // Handle jika harga tidak valid setelah konversi
        if (isNaN(numericPrice)) return "Harga tidak valid";
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(numericPrice);
    };

    // URL Instagram untuk tombol Hubungi Agen
    const instagramUrl = "https://www.instagram.com/infogarut?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

    // Tampilan Loading: Tampilkan pesan saat data sedang diambil
    if (loading) {
        return <div className={styles.pageContainer}>Memuat detail properti...</div>;
    }

    // Tampilan Jika Properti Tidak Ditemukan: Tampilkan pesan jika fetch gagal atau data tidak ada
    if (!property) {
        return <div className={styles.pageContainer}>Properti tidak ditemukan atau gagal dimuat.</div>;
    }

    // Render JSX utama halaman Properti Detail (jika loading selesai dan properti ditemukan)
    return (
        <div className={styles.pageContainer}>
            {/* --- Bagian Header Halaman --- */}
            <div className={styles.headerSection}>
                {/* Tautan kembali ke halaman daftar properti */}
                <Link to="/properti" className={styles.backLink}>
                    <IoArrowBack /> Kembali ke Properti
                </Link>
                {/* Judul dan Lokasi Properti */}
                <div className={styles.titleLocation}>
                    <h1>{property.namaProperti}</h1>
                    <p><IoLocationOutline /> {property.lokasi}</p>
                </div>
            </div>

            {/* --- Bagian Galeri Gambar --- */}
            <div className={styles.gallerySection}>
                {/* Gambar Utama */}
                <div className={styles.mainImage}>
                    {/* Tampilkan gambar utama jika URL-nya ada, jika tidak tampilkan placeholder */}
                    {activeImage ? (
                         <img src={activeImage} alt="Tampilan utama" />
                    ) : (
                         <div className={styles.noImagePlaceholder}>Tidak Ada Gambar</div>
                    )}
                </div>
                {/* Daftar Gambar Kecil (Thumbnail) */}
                <div className={styles.thumbnailImages}>
                    {/* Pastikan `property.media` ada dan merupakan array sebelum mapping */}
                    {property.media && Array.isArray(property.media) && property.media.map((imgName, index) => (
                        <img
                            key={index} // Key unik untuk setiap elemen map
                            src={imgName} // Media sudah berupa full URL dari Vercel Blob
                            alt={`Thumbnail ${index + 1}`} // Teks alternatif
                            onClick={() => handleThumbnailClick(imgName)} // Panggil fungsi saat diklik
                            // Tambahkan class 'activeThumbnail' jika URL thumbnail = URL gambar aktif
                            className={activeImage === imgName ? styles.activeThumbnail : ''}
                        />
                    ))}
                </div>
            </div>

            {/* --- Bagian Grid Detail Properti dan Kartu Agen --- */}
            <div className={styles.detailsGrid}>
                {/* Kolom Kiri: Info Properti */}
                <div className={styles.propertyInfo}>
                    {/* Baris Harga dan Tag */}
                    <div className={styles.priceType}>
                        {/* Kontainer untuk Tag Tipe dan Jenis */}
                        <div className={styles.tagsContainer}>
                           <span className={styles.typeTag}>{property.tipeProperti}</span>
                           <span className={styles.jenisTag}>{property.jenisProperti}</span>
                        </div>
                        {/* Harga dan Periode Sewa (jika ada) */}
                        <span className={styles.price}>
                            {formatPrice(property.harga)}
                            {property.periodeSewa && <span className={styles.periodeSewa}>{property.periodeSewa}</span>}
                        </span>
                    </div>
                    {/* Judul "Detail Properti" */}
                    <h2>Detail Properti</h2>
                    {/* Garis pemisah */}
                    <hr className={styles.divider} />
                    {/* Spesifikasi (Kamar Tidur, Kamar Mandi, Luas) */}
                    <div className={styles.specs}>
                        <div><LuBedDouble size={24}/> {property.kamarTidur} Kamar Tidur</div>
                        <div><LuBath size={24}/> {property.kamarMandi} Kamar Mandi</div>
                        <div><RxRulerSquare size={24}/> {property.luasBangunan} m² Luas Bangunan</div>
                    </div>
                    {/* Judul "Deskripsi" */}
                    <h2>Deskripsi</h2>
                    {/* Teks Deskripsi Properti */}
                    <p className={styles.description}>{property.deskripsi || "Deskripsi tidak tersedia."}</p>
                </div>
                {/* Kolom Kanan: Kartu Agen */}
                <div className={styles.agentCard}>
                    {/* Info Kontak */}
                    <div className={styles.agentContact}>
                        <p>Kontak Pemasang Iklan:</p>
                        {/* Menampilkan email dan telepon jika ada di data `property.agent` */}
                        {property.agent ? (
                            <>
                                {property.agent.email && <p><strong>Email:</strong> {property.agent.email}</p>}
                                {property.agent.phone && <p><strong>Telepon:</strong> {property.agent.phone}</p>}
                                {!property.agent.email && !property.agent.phone && <p><strong>Kontak tidak tersedia</strong></p>}
                            </>
                        ) : (
                             <p><strong>Kontak tidak tersedia</strong></p>
                        )}

                    </div>
                    {/* Tombol Hubungi Agen (Link ke Instagram) */}
                    <a
                      href={instagramUrl}
                      target="_blank"        // Buka link di tab baru
                      rel="noopener noreferrer" // Praktik keamanan untuk target="_blank"
                      className={styles.contactButtonLink} // Class untuk styling link (opsional)
                    >
                      <button className={styles.contactButton}>
                         <FaInstagram /> Hubungi via Instagram
                      </button>
                    </a>
                </div>
            </div>
        </div>
    );
};

// Ekspor komponen PropertiDetail
export default PropertiDetail;