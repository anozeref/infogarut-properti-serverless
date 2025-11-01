// src/pages/HomePage.jsx

// Mengimpor React dan hooks useState, useEffect
import React, { useState, useEffect } from 'react';
// Mengimpor komponen-komponen lain yang akan ditampilkan di halaman ini
import Hero from '../components/Hero/Hero';
import HighlightProperti from '../components/HighlightProperti/HighlightProperti';
import Categories from '../components/Categories/Categories';
import WhyChooseUs from '../components/WhyChooseUs/WhyChooseUs';
import Faq from '../components/Faq/Faq';

/**
 * Fungsi Bantuan (`Helper Function`): `parseCustomDate`
 * Mengonversi string tanggal dari berbagai format yang mungkin ada di db.json
 * (ISO 8601 atau DD/MM/YYYY HH:mm:ss) menjadi objek `Date` JavaScript
 * yang dapat dibandingkan secara numerik untuk pengurutan.
 * @param {string | null | undefined} dateString - String tanggal dari data.
 * @returns {Date | null} Objek Date jika berhasil, atau null jika format tidak valid/input kosong.
 */
const parseCustomDate = (dateString) => {
    // Kembalikan null jika input kosong atau bukan string
    if (!dateString || typeof dateString !== 'string') return null;

    // Coba parsing format ISO 8601 (misal: "2025-10-24T10:00:00Z")
    if (dateString.includes('T') && dateString.includes('Z')) {
        const date = new Date(dateString);
        // Kembalikan null jika parsing ISO gagal (menghasilkan NaN)
        return isNaN(date.getTime()) ? null : date;
    }

    // Coba parsing format "DD/MM/YYYY HH:mm:ss"
    const [datePart, timePart] = dateString.split(' ');
    // Jika tidak ada dua bagian (tanggal dan waktu), kembalikan null
    if (!datePart || !timePart) return null;

    // Pecah bagian tanggal dan waktu, konversi ke angka (Number)
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Validasi: Cek apakah semua bagian adalah angka, dan cek rentang nilai dasar
    if (
        [day, month, year, hours, minutes, seconds].some(isNaN) || // Cek jika ada yg NaN
        month < 1 || month > 12 || // Bulan valid?
        day < 1 || day > 31 ||   // Tanggal valid? (simplifikasi, tidak cek per bulan)
        hours < 0 || hours > 23 || // Jam valid?
        minutes < 0 || minutes > 59 || // Menit valid?
        seconds < 0 || seconds > 59    // Detik valid?
    ) {
        return null; // Kembalikan null jika ada yang tidak valid
    }

    // Buat objek Date (bulan dikurangi 1 karena indeks bulan JS 0-11)
    // Urutan: Tahun, Bulan-1, Tanggal, Jam, Menit, Detik
    try {
     return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch (e) {
     console.error("Gagal membuat Date dari DD/MM/YYYY:", e, "dari string:", dateString);
     return null; // Kembalikan null jika gagal membuat objek Date
    }
};

/**
 * Komponen Halaman `HomePage`:
 * Merupakan halaman utama (beranda) dari aplikasi.
 * Menampilkan berbagai section seperti Hero, Properti Terbaru (Highlight), Kategori, dll.
 * Mengambil data properti terbaru dari API untuk ditampilkan di section HighlightProperti.
 * @returns {React.ReactNode} JSX untuk halaman utama.
 */
const HomePage = () => {
    // State `latestProperties`: Menyimpan array (maksimal 6) objek properti terbaru.
    const [latestProperties, setLatestProperties] = useState([]);
    // State `loading`: Menandakan apakah data properti terbaru sedang diambil.
    const [loading, setLoading] = useState(true);

    // useEffect Hook untuk mengambil dan memproses data properti terbaru.
    // Berjalan hanya *satu kali* setelah komponen pertama kali di-render (`[]`).
    useEffect(() => {
        setLoading(true); // Set status loading menjadi true
        // Mengambil semua data properti dari API serverless
        fetch('/api/properties')
            .then((res) => res.json()) // Mengubah response menjadi JSON
            .then((data) => {
                // 1. Filter: Ambil hanya properti yang statusPostingannya 'approved' (case-insensitive)
                const approvedData = data.filter(
                    (item) => item.statusPostingan?.toLowerCase() === 'approved'
                );

                // 2. Sortir: Urutkan properti yang sudah diapprove berdasarkan tanggal posting
                const sortedData = approvedData.sort((a, b) => {
                    const dateA = parseCustomDate(a.postedAt); // Konversi tanggal A
                    const dateB = parseCustomDate(b.postedAt); // Konversi tanggal B

                    // Penanganan jika tanggal tidak valid saat sorting
                    if (!dateA && !dateB) return 0; // Anggap sama jika keduanya invalid
                    if (!dateA) return 1;           // Taruh A (invalid) di belakang
                    if (!dateB) return -1;          // Taruh B (invalid) di belakang

                    // Urutkan descending (menurun): Terbaru (nilai getTime() lebih besar) di awal.
                    return dateB.getTime() - dateA.getTime();
                });

                // 3. Slice: Ambil maksimal 6 properti teratas dari hasil sortiran
                const topSix = sortedData.slice(0, 6);

                // (Debugging) Tampilkan 6 properti teratas di console browser
                // console.log("Top 6 Properti Approved:", topSix);
                // Simpan 6 properti teratas ke dalam state `latestProperties`
                setLatestProperties(topSix);
            })
            .catch((error) => console.error("Gagal mengambil properti:", error)) // Tangani error fetch
            .finally(() => setLoading(false)); // Set status loading menjadi false setelah selesai
    }, []); // Array dependensi kosong, memastikan fetch hanya berjalan sekali

    // Render JSX komponen HomePage
    return (
        // Menggunakan Fragment (<>) untuk mengelompokkan elemen tanpa menambah div ekstra
        <>
            {/* Menampilkan komponen Hero */}
            <Hero />
            {/* Logika Conditional Rendering:
                Tampilkan komponen HighlightProperti hanya jika loading sudah selesai (`!loading`).
                Mengirimkan data `latestProperties` sebagai prop ke HighlightProperti.
            */}
            {!loading && <HighlightProperti properties={latestProperties} />}
            {/* Menampilkan komponen Categories */}
            <Categories />
            {/* Menampilkan komponen WhyChooseUs */}
            <WhyChooseUs />
            {/* Menampilkan komponen Faq */}
            <Faq />
        </>
    );
};

// Ekspor komponen HomePage
export default HomePage;