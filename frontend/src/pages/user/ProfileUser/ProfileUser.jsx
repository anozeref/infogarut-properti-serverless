import React, { useState, useEffect, useContext } from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "./ProfileUser.module.css";
import Swal from "sweetalert2";
import { AuthContext } from "../../../context/AuthContext"; // pastikan path-nya sesuai
import { API_URL } from "../../../utils/constant";

export default function ProfileUser({ darkMode }) {
  const { user } = useContext(AuthContext); // ambil user dari context

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");

  const [formData, setFormData] = useState({
    nama: "",
    username: "",
    email: "",
    noHp: "",
    alamat: "",
    kecamatan: "",
    desa: "",
  });

  // ===================== CEK USER LOGIN =====================
  useEffect(() => {
    if (!user || !user.id) {
      Swal.fire({
        icon: "warning",
        title: "Belum Login",
        text: "Silakan login terlebih dahulu untuk mengakses profil.",
      });
    } else {
      // isi otomatis dengan data user context
      setFormData({
        nama: user.nama || "",
        username: user.username || "",
        email: user.email || "",
        noHp: user.no_hp || user.noHp || "",
        alamat: user.alamat || "",
        kecamatan: user.kecamatan || "",
        desa: user.desa || "",
      });
    }
  }, [user]);

  // ===================== FETCH DATA KECAMATAN =====================
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/districts/3205.json")
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) =>
          a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase())
        );
        setKecamatanList(sorted);
      })
      .catch((err) => console.error("Gagal mengambil data kecamatan:", err));
  }, []);

  // ===================== AUTO SET KECAMATAN =====================
  useEffect(() => {
    if (kecamatanList.length > 0 && formData.kecamatan) {
      const matchKec = kecamatanList.find(
        (k) => k.name.toLowerCase() === formData.kecamatan.toLowerCase()
      );
      if (matchKec) setSelectedKecamatan(matchKec.id);
    }
  }, [kecamatanList, formData.kecamatan]);

  // ===================== FETCH DESA =====================
  useEffect(() => {
    if (selectedKecamatan) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecamatan}.json`)
        .then((res) => res.json())
        .then((data) => {
          const sorted = data.sort((a, b) =>
            a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase())
          );
          setDesaList(sorted);
        })
        .catch((err) => console.error("Gagal mengambil data desa:", err));
    } else {
      setDesaList([]);
    }
  }, [selectedKecamatan]);

  // ===================== AUTO SELECT DESA =====================
  useEffect(() => {
    if (desaList.length > 0 && formData.desa) {
      const matchDesa = desaList.find(
        (d) => d.name.toLowerCase() === formData.desa.toLowerCase()
      );
      if (matchDesa) setSelectedDesa(matchDesa.id);
    }
  }, [desaList, formData.desa]);

  // ===================== HANDLE FOTO PROFIL =====================
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ===================== HANDLE INPUT =====================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ===================== HANDLE SUBMIT PROFIL =====================
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user || !user.id) {
    Swal.fire("Oops!", "User belum login.", "warning");
    return;
  }

  const updatedProfile = {
    ...formData,
    kecamatan: kecamatanList.find((k) => k.id === selectedKecamatan)?.name || "",
    desa: desaList.find((d) => d.id === selectedDesa)?.name || "",
    no_hp: formData.noHp,
  };

  const confirmResult = await Swal.fire({
    title: "Simpan perubahan?",
    text: "Data profil kamu akan diperbarui.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya, simpan!",
    cancelButtonText: "Batal",
  });

  if (!confirmResult.isConfirmed) return;

  try {
    Swal.fire({
      title: "Menyimpan data...",
      text: "Mohon tunggu sebentar.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    // Ambil dulu data lama user (supaya password-nya tetap sama)
    const resGet = await fetch(`${API_URL}users/${user.id}`);
    const oldData = await resGet.json();

    // Gabungkan data lama + update baru (password TIDAK diubah)
    const finalData = { ...oldData, ...updatedProfile, password: oldData.password };

    // Simpan hasil akhir
    const res = await fetch(`${API_URL}users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalData),
    });

    if (!res.ok) throw new Error("Gagal menyimpan data user");

    Swal.fire("Berhasil!", "Data profil kamu sudah diperbarui.", "success");
  } catch (err) {
    console.error("Error saat update data:", err);
    Swal.fire("Gagal!", "Terjadi kesalahan saat menyimpan data.", "error");
  }
};


  // ===================== HANDLE UBAH PASSWORD =====================
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      Swal.fire("Oops!", "User belum login.", "warning");
      return;
    }

    const newPass = e.target.password.value.trim();
    const confirmPass = e.target.confirmPassword.value.trim();

    if (!newPass || !confirmPass) {
      Swal.fire("Oops!", "Semua kolom wajib diisi!", "warning");
      return;
    }
    if (newPass !== confirmPass) {
      Swal.fire("Gagal!", "Password konfirmasi tidak cocok!", "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Ubah password?",
      text: "Password baru akan disimpan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, ubah!",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: "Menyimpan...",
        text: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const resGet = await fetch(`${API_URL}users/${user.id}`);
      const userData = await resGet.json();

      const updatedUser = { ...userData, password: newPass };

      const res = await fetch(`${API_URL}users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) throw new Error("Gagal update password");

      Swal.fire("Berhasil!", "Password kamu sudah diperbarui.", "success");
      e.target.reset();
    } catch (err) {
      console.error("Error saat ubah password:", err);
      Swal.fire("Error!", "Terjadi kesalahan saat mengubah password.", "error");
    }
  };

  // ===================== RENDER =====================
  return (
    <div className={`${styles.profilePage} ${darkMode ? styles.dark : ""}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <FaUserCircle className={styles.iconUser} />
          <h2>Profil Saya</h2>
        </div>
      </div>

      <div className={styles.content}>
        {/* ===== FORM PROFIL ===== */}
        <div className={styles.formSection}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <form className={styles.form} onSubmit={handleSubmit}>
                {/* Nama & Username */}
                <div className={styles.row}>
                  <div className={styles.col6}>
                    <label>Nama</label>
                    <input
                      type="text"
                      name="nama"
                      placeholder="Nama"
                      value={formData.nama}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.col6}>
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email & No HP */}
                <div className={styles.row}>
                  <div className={styles.col6}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.col6}>
                    <label>No HP</label>
                    <input
                      type="text"
                      name="noHp"
                      placeholder="No HP"
                      value={formData.noHp}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Kecamatan & Desa */}
                <div className={styles.addressRow}>
                  <div className={styles.col4}>
                    <label>Kecamatan</label>
                    <select
                      value={selectedKecamatan}
                      onChange={(e) => setSelectedKecamatan(e.target.value)}
                    >
                      <option value="">Pilih Kecamatan</option>
                      {kecamatanList.map((kec) => (
                        <option key={kec.id} value={kec.id}>
                          {kec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.col4}>
                    <label>Kelurahan/Desa</label>
                    <select
                      value={selectedDesa}
                      onChange={(e) => setSelectedDesa(e.target.value)}
                      disabled={!selectedKecamatan}
                    >
                      <option value="">
                        {selectedKecamatan ? "Pilih Desa" : "Pilih Kecamatan dulu"}
                      </option>
                      {desaList.map((desa) => (
                        <option key={desa.id} value={desa.id}>
                          {desa.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Alamat & Biodata */}
                <div className={styles.row}>
                  <div className={styles.col6}>
                    <label>Alamat</label>
                    <textarea
                      name="alamat"
                      rows="3"
                      placeholder="Alamat lengkap"
                      value={formData.alamat}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>

                <div className={styles.col12} style={{ textAlign: "right" }}>
                  <button type="submit" className={styles.saveBtn}>
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ===== UBAH PASSWORD ===== */}
        <div className={styles.passwordSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h5>Ubah Password</h5>
            </div>
            <div className={styles.cardBody}>
              <form onSubmit={handlePasswordChange}>
                <label>Password Baru</label>
                <input type="password" name="password" placeholder="Password Baru" />
                <label>Konfirmasi Password</label>
                <input type="password" name="confirmPassword" placeholder="Konfirmasi Password Baru" />
                <button type="submit" className={styles.saveBtn}>
                  Ubah Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}