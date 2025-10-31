import React from 'react';
import styles from './Pagination.module.css';

const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // Jangan tampilkan paginasi jika hanya ada 1 halaman
  }

  return (
    <div className={styles.pagination}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={styles.pageBtn}
      >
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i + 1}
          disabled={currentPage === i + 1}
          onClick={() => onPageChange(i + 1)}
          className={`${styles.pageBtn} ${
            currentPage === i + 1 ? styles.activePage : ''
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={styles.pageBtn}
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;