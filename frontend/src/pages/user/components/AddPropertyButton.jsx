import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AddPropertyButton.module.css";

export default function AddPropertyButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    // arahkan ke halaman Tambah Property di dalam dashboard
    navigate("/user/tambahproperty/");
  };

  return (
    <button className={styles.addBtn} onClick={handleClick}>
      + Tambah Properti
    </button>
  );
}
