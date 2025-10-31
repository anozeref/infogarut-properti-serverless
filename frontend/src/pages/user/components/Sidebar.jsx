import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import styles from "./SidebarUser.module.css";

export default function SidebarUser({ darkMode }) {
  return (
    <div
      className={styles.sidebar}
      style={{
        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
        color: darkMode ? "#f1f1f1" : "#333",
        borderRight: darkMode ? "1px solid #333" : "1px solid #ddd",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <ul className={styles.menuList}>
        <li>
          <Link to="/user/">
            <FaHome className={styles.icon} /> Dashboard
          </Link>
        </li>
      </ul>

      <ul className={styles.menuList}>
        <li>
          <Link to="/user/propertisaya">
            <FaBoxOpen className={styles.icon} /> Properti Saya
          </Link>
        </li>
        <li>
          <Link to="/user/propertipending">
            <FaClock className={styles.icon} /> Properti Pending
          </Link>
        </li>
        <li>
          <Link to ="/user/propertiaktif">
            <FaCheckCircle className={styles.icon} /> Properti Aktif
          </Link>
        </li>
        <li>
          <Link to="/user/propertiditolak">
            <FaTimesCircle className={styles.icon} /> Properti Ditolak
          </Link>
        </li>
      </ul>
    </div>
  );
}
