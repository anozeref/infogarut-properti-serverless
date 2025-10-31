import React from 'react';
import styles from './FooterAdmin.module.css';

// Footer copyright dashboard admin
const CopyrightNotice = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.copyrightContainer}>
      <p>© {currentYear} infogarut Properti - Dashboard Admin</p>
    </div>
  );
};

export default CopyrightNotice;