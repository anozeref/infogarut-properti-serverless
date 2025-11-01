import React, { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaTimes } from "react-icons/fa"; // Pastikan FaTimes diimpor
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./EditProperty.module.css";

export default function EditProperty({ darkMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    namaProperti: "",
    tipeProperti: "Rumah",
    jenisProperti: "jual",
    periodeSewa: "",
    harga: "",
    luasTanah: "",
    luasBangunan: "",
    kamarTidur: "",
    kamarMandi: "",
    lokasi: "",
    kecamatan: "",
    desa: "",
    deskripsi: "",
    media: [],
  });

  const [previewModal, setPreviewModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil data properti dari backend
  useEffect(() => {
    axios
      .get(`http://localhost:3004/properties/${id}`)
      .then((res) => {
        setFormData({
          ...res.data,
          media: res.data.media || [],
        });
      })
      .catch(() => {
        Swal.fire("Error", "Data properti tidak ditemukan.", "error");
        navigate("/user/propertisaya");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // 🔹 Handle input teks
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Handle upload media baru
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const filePreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      type: file.type.startsWith("image") ? "image" : "video",
    }));

    setFormData((prev) => ({
      ...prev,
      media: [...prev.media, ...filePreviews],
    }));
  };

  // 1. 🔹 Tambahkan fungsi Ganti media (replaceFile)
  const replaceFile = (index) => {
    // Definisikan handler temporer
    const tempInputHandler = (e) => {
      const file = e.target.files[0];

      if (file) {
        const newMedia = {
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type.startsWith("image") ? "image" : "video",
        };

        setFormData((prev) => {
          const updated = [...prev.media];
          updated[index] = newMedia; // Ganti item di indeks spesifik
          return { ...prev, media: updated };
        });
      }

      // Reset input (value dan mode multiple)
      // Event listener sudah otomatis terhapus karena { once: true }
      fileInputRef.current.value = "";
      fileInputRef.current.multiple = true;
    };

    // Set input ke mode single file (untuk mengganti 1 saja)
    fileInputRef.current.multiple = false;

    // Tambahkan listener 'change' yang hanya berjalan sekali
    fileInputRef.current.addEventListener("change", tempInputHandler, {
      once: true,
    });

    // Trigger klik
    fileInputRef.current.click();
  };

  // 🔹 Submit (PUT ke db.json)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.namaProperti || !formData.harga || !formData.lokasi) {
      Swal.fire("Gagal", "Harap isi Nama Properti, Harga, dan Lokasi.", "warning");
      return;
    }

    try {
      await axios.put(`http://localhost:3004/properties/${id}`, formData);
      Swal.fire({
        title: "Berhasil!",
        text: "Properti berhasil diperbarui.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/user/propertisaya");
    } catch (err) {
      Swal.fire("Error", "Gagal memperbarui data.", "error");
      console.error(err);
    }
  };

  // 🔹 Preview media modal
  const openPreview = (file) => setPreviewModal(file);
  const closePreview = () => setPreviewModal(null);

  if (loading)
    return <div className={styles.loading}>Memuat data properti...</div>;

  // 🌙 Dark Mode Class
  const containerClass = `${styles.container} ${darkMode ? styles.dark : ""}`;
  const cardClass = `${styles.card} ${darkMode ? styles.darkCard : ""}`;
  const inputClass = `${styles.input} ${darkMode ? styles.darkInput : ""}`;
  const textareaClass = `${styles.textarea} ${darkMode ? styles.darkInput : ""}`;
  const selectClass = `${styles.select} ${darkMode ? styles.darkInput : ""}`;

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <h2 className={styles.title}>Edit Properti</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            {/* ... (Semua input form Anda) ... */}
            
            <div className={styles.colFull}>
              <label>Nama Properti</label>
              <input
                name="namaProperti"
                value={formData.namaProperti}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div className={styles.colFull}>
              <label>Deskripsi</label>
              <textarea
                name="deskripsi"
                rows={3}
                value={formData.deskripsi}
                onChange={handleChange}
                className={textareaClass}
              />
            </div>

            <div>
              <label>Harga (IDR)</label>
              <input
                type="number"
                name="harga"
                value={formData.harga}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Lokasi</label>
              <input
                name="lokasi"
                value={formData.lokasi}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Kecamatan</label>
              <input
                name="kecamatan"
                value={formData.kecamatan}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Desa</label>
              <input
                name="desa"
                value={formData.desa}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Tipe Properti</label>
              <select
                name="tipeProperti"
                value={formData.tipeProperti}
                onChange={handleChange}
                className={selectClass}
              >
                <option>Rumah</option>
                <option>Apartemen</option>
                <option>Tanah</option>
                <option>Ruko</option>
              </select>
            </div>

            <div>
              <label>Jenis Properti</label>
              <select
                name="jenisProperti"
                value={formData.jenisProperti}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="jual">Dijual</option>
                <option value="sewa">Disewa</option>
              </select>
            </div>

            {formData.jenisProperti === "sewa" && (
              <div>
                <label>Periode Sewa</label>
                <input
                  name="periodeSewa"
                  value={formData.periodeSewa}
                  onChange={handleChange}
                  placeholder="/1 tahun"
                  className={inputClass}
                />
              </div>
            )}

            <div>
              <label>Luas Tanah (m²)</label>
              <input
                type="number"
                name="luasTanah"
                value={formData.luasTanah}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Luas Bangunan (m²)</label>
              <input
                type="number"
                name="luasBangunan"
                value={formData.luasBangunan}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Kamar Tidur</label>
              <input
                type="number"
                name="kamarTidur"
                value={formData.kamarTidur}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label>Kamar Mandi</label>
              <input
                type="number"
                name="kamarMandi"
                value={formData.kamarMandi}
                onChange={handleChange}
                className={inputClass}
              />
            </div>


            {/* ... (Akhir dari input form Anda) ... */}

            <div className={styles.colFull}>
              <label>Upload Media (Gambar/Video)</label>
              <input
                ref={fileInputRef} // 2. Hubungkan ref ke input file
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </div>
          </div>

          {/* 📸 Preview Media */}
          {formData.media && formData.media.length > 0 && (
            <div className={styles.previewSection}>
              <h3 className={styles.previewTitle}>Preview Media</h3>
              <div className={styles.previewGrid}>
                {formData.media.map((file, i) => {
                  const isObject = typeof file === "object";
                  let fileUrl = isObject ? file.url : file;

                  // 3. 💡 Logika URL diperbaiki (jangan prepend 'blob:' url)
                  if (
                    fileUrl &&
                    !fileUrl.startsWith("http") &&
                    !fileUrl.startsWith("blob")
                  ) {
                    fileUrl = `http://localhost:3005/media/${fileUrl}`;
                  }

                  const fileType =
                    isObject && file.type
                      ? file.type
                      : fileUrl.match(/\.(mp4|mov|avi|mkv)$/)
                      ? "video"
                      : "image";

                  // 🗑️ Fungsi hapus file dari array
                  const handleDeleteMedia = () => {
                    setFormData((prev) => ({
                      ...prev,
                      media: prev.media.filter((_, index) => index !== i),
                    }));
                  };

                  return (
                    <div key={i} className={styles.previewItem}>
                      {/* Tombol hapus kecil (menggunakan Ikon) */}
                      <button
                        type="button"
                        onClick={handleDeleteMedia}
                        className={styles.deleteBtn}
                        title="Hapus media ini"
                      >
                        <FaTimes />
                      </button>

                      {/* Gambar atau Video */}
                      {fileType === "video" ? (
                        <video
                          src={fileUrl}
                          className={styles.previewVideo}
                          controls
                          onClick={() =>
                            openPreview({ url: fileUrl, type: "video" })
                          }
                        />
                      ) : (
                        <img
                          src={fileUrl}
                          alt={`media-${i}`}
                          className={styles.previewImage}
                          onClick={() =>
                            openPreview({ url: fileUrl, type: "image" })
                          }
                        />
                      )}

                      {/* 4. 🔹 Tambahkan Tombol Ganti */}
                      <button
                        type="button"
                        onClick={() => replaceFile(i)}
                        className={styles.replaceBtn} // Pastikan class ini ada di CSS
                        title="Ganti media ini"
                      >
                        Ganti
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button type="submit" className={styles.submitBtn}>
            Simpan Properti
          </button>
        </form>
      </div>

      {/* 🔹 Modal Preview */}
      {previewModal && (
        <div className={styles.modalOverlay} onClick={closePreview}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {previewModal.type === "video" ? (
              <video
                src={previewModal.url}
                controls
                autoPlay
                className={styles.modalVideo}
              />
            ) : (
              <img
                src={previewModal.url}
                alt="Preview"
                className={styles.modalImage}
              />
            )}
            <button className={styles.closeModal} onClick={closePreview}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}