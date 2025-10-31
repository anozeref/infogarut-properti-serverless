// src/pages/admin/content/tables/TabelUser.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../../KelolaUserContent.module.css";
import Pagination from "../Pagination";

const ITEMS_PER_PAGE = 5;

const TabelUser = ({
  icon,
  title,
  users,
  properties,
  renderActions,
  renderStatus,
  emptyMessage,
  dateColumnHeader,
  renderDateColumn,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  const paginate = (list) => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(start, start + ITEMS_PER_PAGE);
  };

  const paginatedUsers = paginate(users);

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.cardHeader}>
        {icon}
        <h3>{title}</h3>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Nama</th>
              <th className={styles.hideOnSmall}>Email</th>
              <th className={styles.hideOnSmall}>HP</th>
              <th>Properti</th>
              <th>Status</th>
              <th>{dateColumnHeader}</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user, idx) => {
                  const userPropsCount = properties.filter(
                    (p) => String(p.ownerId) === String(user.id)
                  ).length;
                  return (
                    <motion.tr
                      key={user.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td>{idx + 1 + (currentPage - 1) * ITEMS_PER_PAGE}</td>
                      <td><div className={styles.truncateText} title={user.username}>{user.username}</div></td>
                      <td><div className={styles.truncateText} title={user.nama}>{user.nama}</div></td>
                      <td className={styles.hideOnSmall}>{user.email}</td>
                      <td className={styles.hideOnSmall}>{user.no_hp}</td>
                      <td>{userPropsCount}</td>
                      <td className={styles.statusCell}>{renderStatus(user)}</td>
                      <td>{renderDateColumn(user)}</td>
                      <td className={styles.actions}>{renderActions(user)}</td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className={styles.emptyState}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination
          totalItems={users.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default TabelUser;