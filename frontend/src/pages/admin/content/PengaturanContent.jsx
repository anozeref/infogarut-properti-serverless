import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { FiKey, FiTrash2, FiUsers } from 'react-icons/fi';
import styles from './PengaturanContent.module.css';
import axios from 'axios';
import { createSocketConnection, emitAdminAction } from '../../../utils/socketUtils';

// Axios instance ke backend
const api = axios.create({
  baseURL: 'http://localhost:3005',
  headers: { 'X-Admin-Request': 'true' }
});

// Socket instance untuk real-time updates
const socket = createSocketConnection("http://localhost:3005");

// Animasi card variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Halaman Pengaturan Admin
export default function PengaturanContent() {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [isLoadingBanned, setIsLoadingBanned] = useState(true);

  // Ambil data banned users
  useEffect(() => {
    const fetchBannedUsers = async () => {
      console.log("PengaturanContent: Fetching banned users from localhost:3005/api/banned-users");
      setIsLoadingBanned(true);
      try {
        const res = await api.get('/api/banned-users');
        console.log("PengaturanContent: Fetched banned users count:", res.data.length);
        setBannedUsers(res.data);
      } catch (err) {
        console.error(err);
        Swal.fire('Gagal Mengambil Data!', 'Terjadi kesalahan saat mengambil data user yang diblokir. Silakan coba lagi.', 'error');
      } finally {
        setIsLoadingBanned(false);
      }
    };
    fetchBannedUsers();
  }, []);

  // Handler cleanup media
  const handleMediaCleanup = () => {
    Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Aksi ini akan memindai dan menghapus file media yang tidak terpakai secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, jalankan pembersihan!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Memproses...',
          html: 'Sedang memindai dan membersihkan media. Mohon tunggu...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
        try {
          const res = await api.post('/api/media/cleanup');
          Swal.fire('Pembersihan Selesai!', `Media yang tidak terpakai telah berhasil dihapus. ${res.data.message}`, 'success');
        } catch (err) {
          const message = err.response?.data?.error || 'Terjadi kesalahan saat pembersihan media.';
          Swal.fire('Gagal Membersihkan!', message, 'error');
        }
      }
    });
  };

  // Handler unban user
  const handleUnbanUser = (userId, username) => {
    Swal.fire({
      title: `Buka blokir "${username}"?`,
      text: "Pengguna ini akan dapat mengakses sistem kembali.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, buka blokir!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Panggil endpoint unban
          await api.patch(`/api/users/${userId}/unban`);
          
          // Update state lokal
          setBannedUsers(current => current.filter(u => u.id !== userId));
          
          // Kirim sinyal socket update
          emitAdminAction(socket, 'userUpdate');
          
          Swal.fire('User Berhasil Di-Unban!', `Pengguna ${username} telah berhasil di-unban dan dapat mengakses sistem kembali.`, 'success');
        } catch (err) {
          const message = err.response?.data?.error || 'Gagal membuka blokir user.';
          Swal.fire('Gagal Unban User!', message, 'error');
        }
      }
    });
  };
  return (
    <div className={styles.container}>
      <motion.h1
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Pengaturan
      </motion.h1>

      {/* Card Pemeliharaan Sistem */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
        <h2 className={styles.cardHeader}>
          <FiTrash2 className="text-red-500" /> Pemeliharaan Sistem
        </h2>
        <p className={styles.cardDescription}>
          Hapus file media yang tidak memiliki relasi di database untuk menghemat ruang penyimpanan server.
        </p>
        <button onClick={handleMediaCleanup} className={`${styles.button} ${styles.buttonRed}`}>
          <FiTrash2 /> Jalankan Pembersihan
        </button>
      </motion.div>

      {/* Card Manajemen Pengguna */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
        <h2 className={styles.cardHeader}>
          <FiUsers className="text-green-500" /> Akun Pengguna Diblokir
        </h2>
        <div className={styles.userList}>
          {isLoadingBanned ? (
            <p className={styles.loadingText}>Memuat data pengguna yang diblokir...</p>
          ) : bannedUsers.length > 0 ? (
            bannedUsers.map(user => (
              <div key={user.id} className={styles.userItem}>
                <div className={styles.userItemInfo}>
                  <p>{user.username}</p>
                  {/* Tampilkan email jika ada */}
                  {user.email && <p className={styles.userEmail}>{user.email}</p>} 
                </div>
                <button
                  onClick={() => handleUnbanUser(user.id, user.username)}
                  className={styles.unbanButton}
                >
                  Buka Blokir
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">Tidak ada pengguna yang sedang diblokir.</p>
          )}
        </div>
      </motion.div>

      {/* Card Keamanan Akun */}
      <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
        <h2 className={styles.cardHeader}>
          <FiKey className="text-blue-500" /> Keamanan Akun
        </h2>
        <p className={styles.cardDescription}>
          Ubah kata sandi admin untuk menjaga keamanan akun Anda. (ID Admin: 5)
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const passwordLama = e.target.passwordLama.value.trim();
            const passwordBaru = e.target.passwordBaru.value.trim();
            const konfirmasiPassword = e.target.konfirmasiPassword.value.trim();

            if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
              return Swal.fire("Field Kosong!", "Semua field password harus diisi.", "warning");
            }
            if (passwordBaru.length < 6) {
              return Swal.fire("Password Terlalu Pendek!", "Password baru minimal 6 karakter.", "warning");
            }
            if (passwordBaru !== konfirmasiPassword) {
              return Swal.fire("Konfirmasi Tidak Cocok!", "Konfirmasi password tidak cocok dengan password baru.", "error");
            }

            try {
              // ID admin selalu 5
              const res = await axios.get("http://localhost:3004/users/5"); 
              const adminData = res.data;

              if (adminData.password !== passwordLama) {
                return Swal.fire("Password Lama Salah!", "Password lama yang Anda masukkan tidak cocok.", "error");
              }

              // Update password
              await axios.patch("http://localhost:3004/users/5", { password: passwordBaru });
              Swal.fire("Password Berhasil Diubah!", "Password admin telah berhasil diperbarui. Silakan login ulang untuk mengonfirmasi.", "success");
              e.target.reset();
            } catch (err) {
              console.error(err);
              Swal.fire("Error", "Terjadi kesalahan saat mengubah password.", "error");
            }
          }}
          className={styles.formContainer}
        >
          <div className={styles.formGroup}>
            <label htmlFor="passwordLama" className={styles.label}>Password Lama</label>
            <input type="password" id="passwordLama" name="passwordLama" className={styles.input} placeholder="Masukkan password lama" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordBaru" className={styles.label}>Password Baru</label>
            <input type="password" id="passwordBaru" name="passwordBaru" className={styles.input} placeholder="Masukkan password baru" />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="konfirmasiPassword" className={styles.label}>Konfirmasi Password Baru</label>
            <input type="password" id="konfirmasiPassword" name="konfirmasiPassword" className={styles.input} placeholder="Ulangi password baru" />
          </div>

          <button type="submit" className={`${styles.button} ${styles.buttonBlue}`}>Ubah Password</button>
        </form>
      </motion.div>
    </div>
  );
}