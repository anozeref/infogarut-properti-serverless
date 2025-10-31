import React from "react";
import styles from "./FooterUser.module.css";

export default function FooterUser({ darkMode }) {
  return (
    <footer className={`${styles.footer} ${darkMode ? styles.dark : ""}`}>
      <p>© 2025 infogarut Properti. All Rights Reserved.</p>
    </footer>
  );
}
