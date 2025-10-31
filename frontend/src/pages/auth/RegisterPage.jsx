import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import { registerUser } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import styles from "./LoginPage.module.css";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

const socket = io("http://localhost:3005");

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
    no_hp: "",
    kecamatan: "",
    desa: "",
    alamat: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getTimestamp = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${
      String(now.getMonth() + 1).padStart(2, "0")
    }/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${
      String(now.getMinutes()).padStart(2, "0")
    }:${String(now.getSeconds()).padStart(2, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        ...formData,
        role: "user",
        joinedAt: getTimestamp(),
      };

      const savedUser = await registerUser(newUser);

      login(savedUser);

      // Emit event ke server supaya HomeContent bisa update realtime
      socket.emit("new_user", {
        id: savedUser.id,
        username: savedUser.username,
        joinedAt: savedUser.joinedAt,
      });

      Swal.fire(
        "Berhasil!",
        `Akun ${savedUser.nama.split(" ")[0]} berhasil dibuat!`,
        "success"
      );

      navigate("/user");
    } catch (err) {
      Swal.fire("Gagal!", err.message, "error");
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.circle} ${styles.circleOne}`}></div>
      <div className={`${styles.circle} ${styles.circleTwo}`}></div>
      <div className={`${styles.circle} ${styles.circleThree}`}></div>
      <div className={`${styles.circle} ${styles.circleFour}`}></div>

      <motion.div
        className={styles.loginBox}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Daftar Akun Baru
        </motion.h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="nama"
            className={styles.input}
            placeholder="Nama Lengkap"
            value={formData.nama}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            className={styles.input}
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            className={styles.input}
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            className={styles.input}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="no_hp"
            className={styles.input}
            placeholder="No HP"
            value={formData.no_hp}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="kecamatan"
            className={styles.input}
            placeholder="Kecamatan"
            value={formData.kecamatan}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="desa"
            className={styles.input}
            placeholder="Desa"
            value={formData.desa}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="alamat"
            className={styles.input}
            placeholder="Alamat Lengkap"
            value={formData.alamat}
            onChange={handleChange}
            required
          />

          <button type="submit" className={styles.button}>
            Daftar
          </button>
        </form>

        <p className={styles.registerLink}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
