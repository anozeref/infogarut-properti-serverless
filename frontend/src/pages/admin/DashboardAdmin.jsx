  import React, { useState, createContext, useContext, lazy, Suspense } from "react";
  import { Routes, Route, Navigate } from "react-router-dom";
  import SidebarAdmin from "./components/SidebarAdmin";
  import FooterAdmin from "./components/FooterAdmin";
  import { motion } from "framer-motion";
  import styles from "./DashboardAdmin.module.css";
  import { AuthContext } from "../../context/AuthContext";
  
  // Lazy load content components for better performance
  const HomeContent = lazy(() => import("./content/HomeContent.jsx"));
  const KelolaPropertiContent = lazy(() => import("./content/KelolaPropertiContent.jsx"));
  const KelolaUserContent = lazy(() => import("./content/KelolaUserContent.jsx"));
  const TambahPropertiContent = lazy(() => import("./content/TambahPropertiContent.jsx"));
  const PengaturanContent = lazy(() => import("./content/PengaturanContent.jsx"));
  
  // Error boundary component for lazy loading
  const LazyErrorBoundary = ({ children }) => (
    <Suspense fallback={<div className={styles.loadingSpinner} aria-live="polite">Memuat konten...</div>}>
      {children}
    </Suspense>
  );

  // Context untuk tema dashboard admin
  export const ThemeContext = createContext();

  // Komponen utama Dashboard Admin
  const DashboardAdmin = () => {
    const { user } = useContext(AuthContext);
    const [isHovered, setIsHovered] = useState(false);
    const [theme, setTheme] = useState("light");

    // Cek autentikasi admin
    if (!user || user.role !== "admin") {
      return <Navigate to="/login" replace />;
    }

    // Toggle tema light/dark
    const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

    return (
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className={`${styles.dashboardContainer}`} data-theme={theme}>
          <a href="#main-content" className={styles.skipLink}>Loncat ke konten utama</a>
          <motion.div
            className={styles.dashboardWrapper}
            animate={{ "--sidebar-width": isHovered ? "220px" : "72px" }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <SidebarAdmin isHovered={isHovered} setIsHovered={setIsHovered} />
  
            <main id="main-content" className={styles.mainContent} role="main" aria-label="Konten utama dashboard admin">
              <LazyErrorBoundary>
                <Routes>
                  <Route index element={<HomeContent />} />
                  <Route path="properti" element={<KelolaPropertiContent />} />
                  <Route path="user" element={<KelolaUserContent />} />
                  <Route path="tambah" element={<TambahPropertiContent />} />
                  <Route path="pengaturan" element={<PengaturanContent />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </LazyErrorBoundary>
              <FooterAdmin />
            </main>
          </motion.div>
        </div>
      </ThemeContext.Provider>
    );
  };

  export default DashboardAdmin;