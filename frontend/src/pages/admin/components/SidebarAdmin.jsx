import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaBuilding, FaUsers, FaPlus, FaCog, FaArrowLeft, FaSun, FaMoon } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./SidebarAdmin.module.css";
import { ThemeContext } from "../DashboardAdmin";

// Komponen Sidebar Admin
const SidebarAdmin = ({ isHovered, setIsHovered }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Menu navigasi utama
  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: <FaHome /> },
    { path: "/admin/properti", label: "Kelola Properti", icon: <FaBuilding /> },
    { path: "/admin/user", label: "Kelola User", icon: <FaUsers /> },
    { path: "/admin/tambah", label: "Tambah Properti", icon: <FaPlus /> },
  ];

  // Cek apakah halaman pengaturan aktif
  const isPengaturanActive = location.pathname.startsWith("/admin/pengaturan");

  // Kembali ke halaman landing
  const handleBackToLanding = () => (window.location.href = "/");

  return (
    <motion.aside
      className={styles.sidebar}
      initial={{ width: 72 }}
      animate={{ width: isHovered ? 220 : 72 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="navigation"
      aria-label="Navigasi sidebar admin"
    >
      {/* Menu utama */}
      <div className={styles.menuSection}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.menuItem} ${
              location.pathname === item.path ? styles.active : ""
            }`}
            title={item.label}
            aria-current={location.pathname === item.path ? "page" : undefined}
          >
            <span className={styles.icon}>{item.icon}</span>
            <motion.span
              className={styles.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {item.label}
            </motion.span>
          </Link>
        ))}
      </div>

      {/* Menu bawah */}
      <div className={styles.bottomSection}>
        {/* Menu pengaturan */}
        <Link
          to="/admin/pengaturan"
          className={`${styles.menuItem} ${isPengaturanActive ? styles.active : ""}`}
          title="Pengaturan"
        >
          <span className={styles.icon}><FaCog /></span>
          <motion.span
            className={styles.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            Pengaturan
          </motion.span>
        </Link>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className={styles.menuItem}
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
          aria-label={`Beralih ke mode ${theme === "light" ? "gelap" : "terang"}`}
        >
          <span className={styles.icon} aria-hidden="true">{theme === "light" ? <FaMoon /> : <FaSun />}</span>
          <motion.span
            className={styles.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </motion.span>
        </button>

        {/* Kembali ke landing */}
        <button onClick={handleBackToLanding} className={styles.menuItem} title="Kembali ke Landing">
          <span className={styles.icon}><FaArrowLeft /></span>
          <motion.span
            className={styles.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            Kembali
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
};

export default SidebarAdmin;