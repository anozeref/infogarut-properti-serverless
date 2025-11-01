import React, { useState, useContext, useRef } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import { FaPlus, FaTimes, FaImage } from "react-icons/fa";
import { ThemeContext } from "../DashboardAdmin";
import styles from "./TambahPropertiContent.module.css";
import axios from "axios";
import { createSocketConnection, emitAdminAction } from "../../../utils/socketUtils";

// Socket untuk real-time updates
const socket = createSocketConnection("http://localhost:3005");

// Halaman Tambah Properti Admin
const TambahPropertiContent = () => {
  const { theme } = useContext(ThemeContext);
  const fileInputRef = useRef(null);

  // State form awal
  const initialFormState = {
    namaProperti: "", jenisProperti: "Jual", tipeProperti: "Rumah",
    lokasi: "", kecamatan: "", desa: "", harga: "", luasTanah: "",
    luasBangunan: "", kamarTidur: "", kamarMandi: "", periodeAngka: "",
    periodeSatuan: "bulan", deskripsi: "", media: [], ownerId: "5",
    statusPostingan: "approved", postedAt: "", koordinat: { lat: 0, lng: 0 },
  };

  const [form, setForm] = useState(initialFormState);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle perubahan form
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Get timestamp saat ini
  const getTimestamp = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  };

  // Handle perubahan file
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 4) {
      Swal.fire("Error", "Total file maksimal 4 untuk properti ini!", "error");
      return;
    }
    const invalidPhotos = files.filter(f => f.type.startsWith("image/") && f.size > 2 * 1024 * 1024);
    if (invalidPhotos.length > 0) {
      Swal.fire("Error", `Foto "${invalidPhotos[0].name}" terlalu besar! Maksimal 2MB per file.`, "error");
      return;
    }

    const newPreview = files.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreview(prev => [...prev, ...newPreview]);
  };

  // Hapus preview media
  const removePreview = (index) => {
    URL.revokeObjectURL(mediaPreview[index].url);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drag and drop
  const handleDragStart = (index, e) => e.dataTransfer.setData("text/plain", index);
  const allowDrop = (e) => e.preventDefault();
  const handleDrop = (index, e) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("text/plain"));
    const newMediaFiles = [...mediaFiles];
    const newMediaPreview = [...mediaPreview];
    [newMediaFiles[dragIndex], newMediaFiles[index]] = [newMediaFiles[index], newMediaFiles[dragIndex]];
    [newMediaPreview[dragIndex], newMediaPreview[index]] = [newMediaPreview[index], newMediaPreview[dragIndex]];
    setMediaFiles(newMediaFiles);
    setMediaPreview(newMediaPreview);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("TambahPropertiContent: Submitting form");
    if (mediaFiles.length < 1) {
      Swal.fire("Error", "Minimal unggah 1 media (foto/video) untuk properti baru!", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataUpload = new FormData();
      mediaFiles.forEach(f => formDataUpload.append("media", f));
      console.log("TambahPropertiContent: Uploading media to localhost:3005/upload");
      // Upload ke server 3005
      const uploadRes = await axios.post("http://localhost:3005/upload", formDataUpload);
      console.log("TambahPropertiContent: Upload response:", uploadRes.data);

      const propertiData = {
        ...form,
        harga: Number(form.harga),
        luasTanah: Number(form.luasTanah),
        luasBangunan: Number(form.luasBangunan),
        kamarTidur: Number(form.kamarTidur),
        kamarMandi: Number(form.kamarMandi),
        postedAt: getTimestamp(),
        media: uploadRes.data.files,
        periodeSewa: form.jenisProperti === "Sewa" ? `/${form.periodeAngka} ${form.periodeSatuan}` : ""
      };
      console.log("TambahPropertiContent: Posting property data to localhost:3004/properties");
      await axios.post("http://localhost:3004/properties", propertiData);
      emitAdminAction(socket, "propertyUpdate");
      Swal.fire("Properti Berhasil Ditambahkan!", `Properti "${form.namaProperti}" telah berhasil ditambahkan ke sistem dan akan muncul di halaman publik setelah disetujui.`, "success");

      setForm(initialFormState);
      mediaPreview.forEach(p => URL.revokeObjectURL(p.url));
      setMediaFiles([]);
      setMediaPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      Swal.fire("Gagal Menambahkan Properti!", "Terjadi kesalahan saat menambahkan properti. Periksa kembali data Anda dan coba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div className={styles.container} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
      <div className={styles.header}>
        <h2>Tambah Properti Baru</h2>
        <p>Isi semua detail yang diperlukan untuk properti baru.</p>
      </div>

      <div className={styles.formCard}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Informasi Utama */}
          <div className={styles.formSection}>
            <h4>1. Informasi Utama</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>Nama Properti</label><input type="text" name="namaProperti" value={form.namaProperti} onChange={handleChange} required/></div>
              <div className={styles.formGroup}><label>Jenis Properti</label><select name="jenisProperti" value={form.jenisProperti} onChange={handleChange}><option>Jual</option><option>Sewa</option><option>Cicilan</option></select></div>
              <div className={styles.formGroup}><label>Tipe Properti</label><select name="tipeProperti" value={form.tipeProperti} onChange={handleChange}><option>Rumah</option><option>Kost</option><option>Ruko</option><option>Villa</option><option>Perumahan</option><option>Apartemen</option><option>Tanah</option></select></div>
              <div className={styles.formGroup}><label>Harga</label><input type="number" name="harga" value={form.harga} onChange={handleChange} required/></div>
              {form.jenisProperti === "Sewa" && (
                <div className={styles.periodeSewa}>
                  <div className={styles.formGroup}><label>Periode Sewa</label><input type="number" name="periodeAngka" value={form.periodeAngka} onChange={handleChange} placeholder="Jumlah" required/></div>
                  <div className={styles.formGroup}><label>&nbsp;</label><select name="periodeSatuan" value={form.periodeSatuan} onChange={handleChange}><option value="bulan">Bulan</option><option value="tahun">Tahun</option></select></div>
                </div>
              )}
            </div>
            <div className={styles.formGroup}><label>Deskripsi</label><textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows="5"></textarea></div>
          </div>

          {/* Lokasi & Detail */}
          <div className={styles.formSection}>
            <h4>2. Lokasi & Detail</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>Lokasi (Alamat Lengkap)</label><input type="text" name="lokasi" value={form.lokasi} onChange={handleChange} required/></div>
              <div className={styles.formGroup}><label>Kecamatan</label><input type="text" name="kecamatan" value={form.kecamatan} onChange={handleChange}/></div>
              <div className={styles.formGroup}><label>Desa</label><input type="text" name="desa" value={form.desa} onChange={handleChange}/></div>
              <div className={styles.formGroup}><label>Luas Tanah (m²)</label><input type="number" name="luasTanah" value={form.luasTanah} onChange={handleChange}/></div>
              <div className={styles.formGroup}><label>Luas Bangunan (m²)</label><input type="number" name="luasBangunan" value={form.luasBangunan} onChange={handleChange}/></div>
              <div className={styles.formGroup}><label>Kamar Tidur</label><input type="number" name="kamarTidur" value={form.kamarTidur} onChange={handleChange}/></div>
              <div className={styles.formGroup}><label>Kamar Mandi</label><input type="number" name="kamarMandi" value={form.kamarMandi} onChange={handleChange}/></div>
            </div>
          </div>

          {/* Media */}
          <div className={styles.formSection}>
            <h4>3. Media (Foto/Video)</h4>
            <div className={styles.mediaUploader}>
              <div className={styles.dropZone} onClick={() => fileInputRef.current.click()}>
                <FaImage />
                <p>Klik atau seret file ke sini</p>
                <span>Maks. 4 file (foto &lt; 2MB)</span>
              </div>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }}/>
              <div className={styles.mediaPreview}>
                {mediaPreview.map((m,idx)=>(
                  <div key={`${m.file.name}-${idx}`} draggable onDragStart={(e)=>handleDragStart(idx,e)} onDragOver={allowDrop} onDrop={(e)=>handleDrop(idx,e)} className={styles.mediaItem}>
                    {m.file.type.startsWith("image/") ? <img src={m.url} alt="preview"/> : <video src={m.url}/> }
                    <button type="button" onClick={()=>removePreview(idx)}><FaTimes/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.submitSection}>
            <motion.button type="submit" className={styles.submitBtn} disabled={isSubmitting} whileHover={{y: -2}} whileTap={{scale:0.98}}>
              {isSubmitting ? "Menambahkan..." : <><FaPlus /> Tambah Properti</>}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default TambahPropertiContent;
