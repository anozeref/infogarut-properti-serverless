// src/pages/admin/content/components/StatCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../../HomeContent.module.css';

const StatCard = ({ icon, title, value, colorClass }) => {
  return (
    <motion.div 
      className={styles.statCard}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className={`${styles.iconWrapper} ${styles[colorClass]}`}>
        {icon}
      </div>
      <div className={styles.textWrapper}>
        <h6>{title}</h6>
        <p>{value}</p>
      </div>
    </motion.div>
  );
};

export default StatCard;