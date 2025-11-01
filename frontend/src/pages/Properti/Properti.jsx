// src/pages/Properti/Properti.jsx

// Mengimpor React dan hooks useState, useEffect
import React, { useState, useEffect } from 'react';
// Mengimpor CSS Modules untuk styling
import styles from './Properti.module.css';
// Mengimpor komponen PropertyCard untuk menampilkan setiap properti
import PropertyCard from '../../components/PropertyCard/PropertyCard.jsx';
// Mengimpor hook useSearchParams dari react-router-dom untuk membaca parameter URL
import { useSearchParams } from 'react-router-dom';

/**
 * Fungsi Bantuan (`Helper Function`): `parsePostedAt`
 * Mengubah string tanggal (dari format DD/MM/YYYY HH:mm:ss atau ISO 8601)
 * menjadi objek `Date` JavaScript yang bisa dibandingkan secara numerik.
 * Ini penting untuk memastikan pengurutan tanggal berfungsi benar meskipun format di db.json tidak konsisten.
 * @param {string | null | undefined} dateString - String tanggal dari db.json.
 * @returns {Date | null} Objek Date jika parsing berhasil, atau null jika gagal/input tidak valid.
 */
const parsePostedAt = (dateString) => {
    // Kembalikan null jika input tidak valid (null, undefined, bukan string)
    if (!dateString || typeof dateString !== 'string') return null;

    // Prioritas 1: Coba parsing format ISO 8601 (lebih standar dan mudah)
    // Format ISO biasanya mengandung 'T' dan 'Z'.
    if (dateString.includes('T') && dateString.includes('Z')) {
        const date = new Date(dateString);
        // Cek apakah hasil parsing valid (bukan NaN)
        return isNaN(date.getTime()) ? null : date;
    }

    // Prioritas 2: Coba parsing format "DD/MM/YYYY HH:mm:ss"
    if (dateString.includes('/')) {
        // Pisahkan bagian tanggal dan waktu berdasarkan spasi
        const dateTimeParts = dateString.split(' ');
        // Pastikan ada tepat dua bagian (tanggal dan waktu)
        if (dateTimeParts.length !== 2) return null;

        const datePart = dateTimeParts[0];
        const timePart = dateTimeParts[1];

        // Pisahkan bagian tanggal (DD, MM, YYYY) berdasarkan '/'
        const dateParts = datePart.split('/');
        if (dateParts.length !== 3) return null; // Harus ada 3 bagian
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10); // Bulan (1-12)
        const year = parseInt(dateParts[2], 10);

        // Pisahkan bagian waktu (HH, mm, ss) berdasarkan ':'
        const timeParts = timePart.split(':');
        if (timeParts.length !== 3) return null; // Harus ada 3 bagian
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        const seconds = parseInt(timeParts[2], 10);

        // Validasi dasar: Pastikan semua hasil parse adalah angka
        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }
        // Validasi rentang nilai (opsional tapi bagus)
        if (month < 1 || month > 12 || day < 1 || day > 31 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            return null;
        }

        // Buat objek Date. Ingat: Bulan di JavaScript dimulai dari 0 (Januari = 0).
        try {
            return new Date(year, month - 1, day, hours, minutes, seconds);
        } catch (e) {
            console.error("Gagal membuat Date dari DD/MM/YYYY:", e, "dari string:", dateString);
            return null; // Gagal membuat Date object
        }
    }

    // Jika format tidak dikenali, kembalikan null
    return null;
};


/**
 * Komponen Halaman `Properti`:
 * Bertanggung jawab untuk menampilkan daftar semua properti yang tersedia.
 * Mengambil data properti dari API (json-server).
 * Menyediakan fitur filter berdasarkan lokasi (pencarian teks), tipe properti, dan jenis properti.
 * Mengurutkan properti berdasarkan tanggal posting terbaru.
 * @returns {React.ReactNode} JSX untuk halaman daftar properti.
 */
const Properti = () => {
    // State untuk menyimpan daftar properti yang diambil dari API
    const [properties, setProperties] = useState([]);
    // State untuk menandakan apakah data sedang dimuat
    const [loading, setLoading] = useState(true);
    // Hook dari react-router-dom untuk membaca dan mengatur parameter query di URL (misal: ?tipe=Rumah)
    const [searchParams, setSearchParams] = useSearchParams();

    // State untuk nilai filter saat ini
    const [locationSearch, setLocationSearch] = useState(''); // Teks pencarian lokasi
    const [tipeFilter, setTipeFilter] = useState('Semua Tipe'); // Filter dropdown tipe
    const [jenisFilter, setJenisFilter] = useState('Semua Jenis'); // Filter dropdown jenis

    // useEffect Hook untuk mengambil data properti dari API
    // Berjalan hanya *satu kali* setelah komponen pertama kali di-render,
    // karena dependency array-nya kosong (`[]`).
    useEffect(() => {
        setLoading(true); // Mulai status loading
        // Mengambil data dari endpoint `/properties` di json-server
        fetch('/api/properties')
            .then(res => res.json()) // Mengubah response menjadi format JSON
            .then(data => {
                // Setelah data diterima, urutkan berdasarkan tanggal posting
                const sortedData = [...data].sort((a, b) => {
                    const dateA = parsePostedAt(a.postedAt); // Konversi tanggal A
                    const dateB = parsePostedAt(b.postedAt); // Konversi tanggal B

                    // Penanganan jika salah satu atau kedua tanggal tidak valid
                    if (!dateA && !dateB) return 0; // Anggap sama jika keduanya tidak valid
                    if (!dateA) return 1;           // Taruh A (tidak valid) di belakang B
                    if (!dateB) return -1;          // Taruh B (tidak valid) di belakang A

                    // Urutkan secara descending (menurun): tanggal B - tanggal A
                    // getTime() mengembalikan nilai milidetik, cocok untuk perbandingan
                    return dateB.getTime() - dateA.getTime();
                });
                // Simpan data yang *sudah diurutkan* ke dalam state `properties`
                setProperties(sortedData);
            })
            .catch(error => console.error("Gagal mengambil data properti:", error)) // Tangani error fetch
            .finally(() => {
                setLoading(false); // Selesaikan status loading (baik sukses maupun gagal)
            });
    }, []); // Array dependensi kosong, fetch hanya sekali

    // useEffect Hook untuk menyinkronkan filter tipe dari URL
    // Berjalan setiap kali `searchParams` (parameter URL) berubah.
    useEffect(() => {
        // Baca nilai parameter 'tipe' dari URL (misal: /properti?tipe=Rumah)
        const tipeDariUrl = searchParams.get('tipe');
        // Jika parameter 'tipe' ada di URL, set state tipeFilter sesuai nilainya
        if (tipeDariUrl) {
            setTipeFilter(tipeDariUrl);
        } else {
            // Jika tidak ada parameter 'tipe', set ke default 'Semua Tipe'
            setTipeFilter('Semua Tipe');
        }
    }, [searchParams]); // Jalankan ulang efek ini jika searchParams berubah

    // Logika Filter:
    // Membuat array baru (`filteredProperties`) yang berisi properti
    // yang lolos semua kriteria filter dari state `properties` (yang sudah terurut).
    const filteredProperties = properties.filter(property => {
        // 1. Filter Status: Hanya tampilkan yang 'approved'
        const statusMatch = property.statusPostingan === 'approved';

        // 2. Filter Tipe: Cocok jika 'Semua Tipe' atau tipe properti sesuai
        const tipeMatch = tipeFilter === 'Semua Tipe' || (property.tipeProperti && property.tipeProperti.toLowerCase() === tipeFilter.toLowerCase());

        // 3. Filter Jenis: Cocok jika 'Semua Jenis' atau jenis properti sesuai
        const jenisMatch = jenisFilter === 'Semua Jenis' || (property.jenisProperti && property.jenisProperti.toLowerCase() === jenisFilter.toLowerCase());

        // 4. Filter Lokasi: Cocok jika lokasi properti mengandung teks pencarian (case-insensitive)
        const locationMatch = property.lokasi && property.lokasi.toLowerCase().includes(locationSearch.toLowerCase());

        // Kembalikan true hanya jika SEMUA kriteria filter terpenuhi
        return statusMatch && tipeMatch && jenisMatch && locationMatch;
    });

    /**
     * Fungsi `handleResetFilters`:
     * Mengembalikan semua state filter ke nilai defaultnya dan menghapus parameter query dari URL.
     * Dipanggil saat tombol "Atur Ulang Filter" diklik.
     */
    const handleResetFilters = () => {
        setLocationSearch('');         // Kosongkan input lokasi
        setTipeFilter('Semua Tipe');   // Set dropdown tipe ke default
        setJenisFilter('Semua Jenis'); // Set dropdown jenis ke default
        setSearchParams({});           // Hapus semua parameter query dari URL
    };

    // Tampilan Loading: Jika `loading` bernilai true, tampilkan pesan ini saja.
    if (loading) {
        return <div className={styles.loading}>Memuat properti...</div>;
    }

    // Render JSX utama halaman Properti
    return (
        // Kontainer utama halaman
        <div className={styles.pageContainer}>
            {/* Bagian Filter */}
            <div className={styles.filterSection}>
                <h2 className={styles.title}>Temukan Properti Sempurna Anda</h2>
                {/* Kontainer untuk elemen-elemen filter */}
                <div className={styles.filters}>
                    {/* Grup Filter Lokasi */}
                    <div className={styles.filterGroup}>
                        <label>Cari Lokasi</label>
                        <input
                            type="text"
                            placeholder="Cari kota, daerah, atau alamat..."
                            value={locationSearch} // Nilai input dikontrol oleh state locationSearch
                            onChange={(e) => setLocationSearch(e.target.value)} // Update state saat user mengetik
                        />
                    </div>
                    {/* Grup Filter Tipe Properti */}
                    <div className={styles.filterGroup}>
                        <label>Tipe Properti</label>
                        <select value={tipeFilter} onChange={(e) => setTipeFilter(e.target.value)}>
                            {/* Opsi-opsi dropdown tipe */}
                            <option value="Semua Tipe">Semua Tipe</option>
                            <option value="Rumah">Rumah</option>
                            <option value="Kos">Kos</option> {/* Pastikan value ini ada di data Anda */}
                            <option value="Villa">Villa</option>
                            <option value="Ruko">Ruko</option>
                            <option value="Tanah">Tanah</option>
                            <option value="Perumahan">Perumahan</option>
                        </select>
                    </div>
                    {/* Grup Filter Jenis Properti */}
                    <div className={styles.filterGroup}>
                        <label>Jenis Properti</label>
                        <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)}>
                            {/* Opsi-opsi dropdown jenis */}
                            <option value="Semua Jenis">Semua Jenis</option>
                            <option value="Jual">Jual</option>
                            <option value="Sewa">Sewa</option>
                            <option value="Cicilan">Cicilan</option>
                        </select>
                    </div>
                    {/* Tombol Reset Filter */}
                    <button className={styles.filterButton} onClick={handleResetFilters}>
                        Atur Ulang Filter
                    </button>
                </div>
            </div>

            {/* Bagian Hasil Pencarian */}
            <div className={styles.resultsSection}>
                {/* Menampilkan jumlah properti yang ditemukan setelah difilter */}
                <p className={styles.resultsCount}>{filteredProperties.length} properti ditemukan</p>
                {/* Grid untuk menampilkan kartu-kartu properti */}
                <div className={styles.propertyGrid}>
                    {/* Mapping array `filteredProperties`:
                        Untuk setiap objek `property` dalam array hasil filter (yang sudah terurut),
                        render komponen `PropertyCard`.
                        Mengirimkan data `property` sebagai prop.
                        `key` wajib ada untuk identifikasi unik.
                    */}
                    {filteredProperties.map(property => (
                        <PropertyCard key={property.id} property={property} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Ekspor komponen Properti
export default Properti;