// src/pages/admin/content/ModalUser.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./ModalUser.module.css";

const ModalUser = ({ open, onClose, user, properties, theme, joinedDate }) => {
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.backdrop} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={styles.modal} data-theme={theme} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className={styles.left}>
              <h3>Profil User</h3>
              <p><b>Username:</b> {user.username}</p>
              <p><b>Nama:</b> {user.nama}</p>
              <p><b>Email:</b> {user.email}</p>
              <p><b>HP:</b> {user.no_hp}</p>
              <p><b>Status:</b> {user.verified ? "Terverifikasi" : "Belum Diverifikasi"}</p>
              <p><b>Tanggal Bergabung:</b><br />{joinedDate}</p>
              <p><b>Desa:</b> {user.desa || "-"}</p>
              <p><b>Kecamatan:</b> {user.kecamatan || "-"}</p>
              <p><b>Alamat:</b> {user.alamat || "-"}</p>
            </div>
            <div className={styles.right}>
              <h3>Properti Dimiliki ({properties.length})</h3>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>No</th><th>Nama Properti</th><th>Tipe</th><th>Status</th><th>Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.length > 0 ? (
                      properties.map((p, i) => (
                        <tr key={p.id} onClick={() => navigate("/admin/properti")} style={{ cursor: "pointer" }}>
                          <td>{i + 1}</td>
                          <td><div className={styles.truncateText} title={p.namaProperti}>{p.namaProperti}</div></td>
                          <td>{p.tipeProperti}</td>
                          <td><span className={`${styles.badge} ${styles[p.statusPostingan]}`}>{p.statusPostingan}</span></td>
                          <td>{p.harga?.toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className={styles.emptyState}>User ini belum memiliki properti.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}><FaTimes /></button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalUser;