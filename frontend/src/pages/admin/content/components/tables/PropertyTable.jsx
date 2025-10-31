import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../../KelolaPropertiContent.module.css";
import Pagination from "../../components/Pagination";

const ITEMS_PER_PAGE = 5;

// Tabel Properti Admin
const PropertyTable = ({
  icon, title, properties, users, renderActions, renderStatus, emptyMessage, approvedViewConfig
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [properties]);

  // Paginasi data
  const paginate = (list) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  // Get nama owner dari ID
  const getOwnerName = (ownerId) => {
    const user = users.find(u => String(u.id) === String(ownerId));
    return user ? user.username : `User ID: ${ownerId || "?"}`;
  };

  const paginatedProperties = paginate(properties);

  return (
    <div className={styles.cardWrapper}>
      {/* Header tabel */}
      <div className={styles.cardHeader}>
        {icon}
        <h3>{title}</h3>
        {approvedViewConfig && (
          <div className={styles.toggleContainer}>
            <span>User</span>
            <label>
              <input type="checkbox" checked={approvedViewConfig.view === "admin"} onChange={() => approvedViewConfig.onViewChange(approvedViewConfig.view === "admin" ? "user" : "admin")} />
              <div className={styles.slider}><div className={styles.sliderBall}></div></div>
            </label>
            <span>Admin</span>
          </div>
        )}
      </div>
      {/* Tabel properti */}
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No</th>
              <th>Judul</th>
              <th>Jenis/Tipe</th>
              <th>Lokasi</th>
              <th>Harga</th>
              <th className={styles.hideOnSmall}>Owner</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedProperties.length > 0 ? (
                paginatedProperties.map((prop, idx) => (
                  <motion.tr key={prop.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td><div title={prop.namaProperti} className={styles.truncateText}>{prop.namaProperti}</div></td>
                    <td><div>{prop.jenisProperti}</div><div className={styles.subText}>{prop.tipeProperti}</div></td>
                    <td><div title={prop.lokasi} className={styles.truncateText}>{prop.lokasi}</div></td>
                    <td>
                      <div>{prop.harga ? Number(prop.harga).toLocaleString('id-ID') : "-"}</div>
                      <div className={styles.subText}>{prop.periodeSewa?.substring(1).trim() || ""}</div>
                    </td>
                    <td className={styles.hideOnSmall}>{getOwnerName(prop.ownerId)}</td>
                    <td className={styles.statusCell}>{renderStatus(prop)}</td>
                    <td className={styles.actions}>{renderActions(prop)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan="8" className={styles.emptyState}>{emptyMessage}</td></tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {/* Paginasi */}
      {totalPages > 1 && (
        <Pagination
          totalItems={properties.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default PropertyTable;