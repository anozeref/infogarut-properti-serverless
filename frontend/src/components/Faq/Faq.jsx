// src/components/Faq/Faq.jsx

// Mengimpor React dan hook useState untuk mengelola state lokal
import React, { useState } from 'react';
// Mengimpor CSS Modules untuk styling komponen ini
import styles from './Faq.module.css';
// Mengimpor ikon panah ke bawah dari react-icons
import { IoChevronDown } from "react-icons/io5";

/**
 * @typedef {object} FaqItemData
 * @property {string} question - Teks pertanyaan.
 * @property {string} answer - Teks jawaban.
 */

/**
 * Array berisi data untuk setiap item FAQ (pertanyaan dan jawaban).
 * @type {FaqItemData[]}
 */
const faqData = [
  {
    question: "Apa itu Infogarut Property?",
    answer: "Infogarut Property adalah platform informasi dan layanan properti di Garut yang membantu masyarakat menemukan hunian, tanah, maupun investasi terbaik. Kami menyediakan data terbaru, panduan lokasi, serta koneksi langsung dengan agen dan pemilik terpercaya di wilayah Garut."
  },
  {
    question: "Apakah semua properti yang ditampilkan di Infogarut Property sudah diverifikasi?",
    answer: "Ya. Setiap listing yang tampil di Infogarut Property melalui proses verifikasi untuk memastikan keaslian data dan kejelasan kepemilikan, agar calon pembeli merasa aman dan nyaman dalam bertransaksi."
  },
  {
    question: "Jenis properti apa saja yang bisa ditemukan di Infogarut Property?",
    answer: "Anda dapat menemukan berbagai jenis properti seperti rumah tinggal, tanah kavling, ruko, kos, hingga lahan investasi strategis di seluruh wilayah Garut, mulai dari kawasan perkotaan hingga daerah wisata."
  },
  {
    question: "Apakah Infogarut Property menyediakan layanan konsultasi atau bantuan investasi?",
    answer: "Tentu. Tim Infogarut Property siap memberikan panduan investasi lokal, termasuk analisis nilai properti, potensi pengembangan wilayah, serta tips membeli atau menjual properti dengan aman dan menguntungkan."
  },
  {
    question: "Bagaimana cara menghubungi tim Infogarut Property jika saya tertarik dengan salah satu listing?",
    answer: "Anda dapat langsung menghubungi kami melalui form kontak di website Infogarut Property, atau melalui WhatsApp dan email resmi yang tertera di setiap halaman listing. Tim kami akan merespons dengan cepat dan membantu proses transaksi Anda hingga tuntas."
  }
];

/**
 * Komponen `FaqItem` (Sub-komponen):
 * Menampilkan satu item pertanyaan dan jawaban.
 * Mengelola tampilan terbuka/tertutup berdasarkan prop `faq.open`.
 * Memanggil fungsi `toggleFAQ` saat diklik.
 * @param {object} props - Props yang diterima.
 * @param {FaqItemData & {open: boolean}} props.faq - Data FAQ plus status terbuka/tertutup.
 * @param {number} props.index - Index item FAQ dalam array.
 * @param {Function} props.toggleFAQ - Fungsi untuk mengubah status terbuka/tertutup.
 * @returns {React.ReactNode} JSX untuk satu item FAQ.
 */
const FaqItem = ({ faq, index, toggleFAQ }) => {
  return (
    // Div pembungkus utama untuk satu item FAQ.
    // Menambahkan class 'open' jika faq.open bernilai true untuk styling.
    // onClick memanggil fungsi toggleFAQ dengan index item ini.
    <div
      className={`${styles.faqItem} ${faq.open ? styles.open : ''}`}
      onClick={() => toggleFAQ(index)}
    >
      {/* Bagian pertanyaan, berisi teks pertanyaan dan ikon panah */}
      <div className={styles.faqQuestion}>
        {faq.question}
        {/* Ikon panah, class akan berubah jika item terbuka (via CSS) */}
        <IoChevronDown className={styles.icon} />
      </div>
      {/* Bagian jawaban, ditampilkan/disembunyikan oleh CSS berdasarkan class 'open' */}
      <div className={styles.faqAnswer}>
        {faq.answer}
      </div>
    </div>
  );
};

/**
 * Komponen `Faq` (Komponen Utama):
 * Menampilkan seluruh bagian FAQ (Frequently Asked Questions).
 * Mengelola state untuk semua item FAQ (mana yang terbuka/tertutup).
 * Menerapkan logika accordion (hanya satu item bisa terbuka dalam satu waktu).
 * @returns {React.ReactNode} JSX untuk seluruh bagian FAQ.
 */
const Faq = () => {
  // State `faqs`: Menyimpan array objek FAQ.
  // Inisialisasi state: Mengambil data dari `faqData`, lalu menambahkan properti `open: false`
  // ke setiap objek untuk menandakan semua item tertutup pada awalnya.
  const [faqs, setFaqs] = useState(
    faqData.map(item => ({...item, open: false}))
  );

  /**
   * Fungsi `toggleFAQ`: Mengubah status terbuka/tertutup item FAQ.
   * Dipanggil saat `FaqItem` diklik.
   * @param {number} index - Index dari item FAQ yang diklik.
   */
  const toggleFAQ = index => {
    // Memperbarui state `faqs`
    setFaqs(
      // Looping melalui array `faqs` yang ada saat ini
      faqs.map((faq, i) => {
        // Jika index item saat ini (i) sama dengan index yang diklik (index)
        if (i === index) {
          // Balikkan status `open`-nya (jika true jadi false, jika false jadi true)
          faq.open = !faq.open;
        } else {
          // Jika index berbeda, paksa status `open` menjadi false
          // Ini memastikan hanya satu item yang bisa terbuka dalam satu waktu (logika accordion).
          faq.open = false;
        }
        // Kembalikan objek faq yang sudah diperbarui
        return faq;
      })
    );
  };

  // Render JSX komponen Faq
  return (
    // Section pembungkus utama
    <section className={styles.faqSection}>
      {/* Kontainer untuk membatasi lebar */}
      <div className={styles.container}>
        {/* Judul bagian */}
        <h2 className={styles.title}>Pertanyaan yang Sering Diajukan</h2>
        {/* Daftar item FAQ */}
        <div className={styles.faqList}>
          {/* Mapping state `faqs`:
            Untuk setiap objek `faq` dalam state, render komponen `FaqItem`.
            Mengirimkan data `faq`, `index`, dan fungsi `toggleFAQ` sebagai props ke `FaqItem`.
          */}
          {faqs.map((faq, index) => (
            <FaqItem key={index} faq={faq} index={index} toggleFAQ={toggleFAQ} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Mengekspor komponen Faq agar bisa digunakan di file lain
export default Faq;