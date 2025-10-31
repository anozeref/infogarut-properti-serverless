import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaImage, FaSave } from "react-icons/fa";
import styles from "./EditPropertyModal.module.css";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL, MEDIA_URL } from "../../../../../utils/constant";

// Modal Edit Properti Admin
export default function EditPropertyModal({ data, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    ...data,
    namaProperti: data.namaProperti || "",
    jenisProperti: data.jenisProperti || "sewa",
    tipeProperti: data.tipeProperti || "Rumah",
    harga: data.harga || 0,
    deskripsi: data.deskripsi || "",
    lokasi: data.lokasi || "",
    kecamatan: data.kecamatan || "",
    desa: data.desa || "",
    luasTanah: data.luasTanah || 0,
    luasBangunan: data.luasBangunan || 0,
    kamarTidur: data.kamarTidur || 0,
    kamarMandi: data.kamarMandi || 0,
    periodeAngka: data.periodeSewa ? parseInt(data.periodeSewa.match(/\d+/)?.[0] || "") : "",
    periodeSatuan: data.periodeSewa?.match(/bulan|tahun/i)?.[0].toLowerCase() || "bulan",
  });

  const [mediaItems, setMediaItems] = useState([]);
  useEffect(() => {
      const initialMedia = (data.media || []).map((fileName) => ({
      id: `existing-${fileName}-${Math.random()}`,
      file: fileName,
      url: `${MEDIA_URL}${fileName}`,
      isNew: false,
    }));
    setMediaItems(initialMedia);
  }, [data.media]); // Dependensi tetap data.media

  // Handle perubahan form
  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalFiles = mediaItems.length + files.length;
    if (totalFiles > 4) {
      Swal.fire("Error", "Total file maksimal 4!", "error");
      return;
    }
    
    // Validasi ukuran foto maksimal 2MB
    const invalidPhotos = files.filter(f => f.type.startsWith("image/") && f.size > 2 * 1024 * 1024);
    if (invalidPhotos.length > 0) {
      Swal.fire("Error", `Foto "${invalidPhotos[0].name}" terlalu besar! Maksimal 2MB.`, "error");
      return;
    }
    // Validasi video bisa ditambahkan di sini

    const newItems = files.map(file => ({
      id: `new-${file.name}-${Math.random()}`,
      file: file,
      url: URL.createObjectURL(file),
      isNew: true,
    }));

    setMediaItems(prev => [...prev, ...newItems]);
  };

  // Hapus media item
  const removeMedia = (idToRemove) => {
    const itemToRemove = mediaItems.find(item => item.id === idToRemove);
    if (itemToRemove && itemToRemove.isNew) {
      URL.revokeObjectURL(itemToRemove.url);
    }
    setMediaItems(prev => prev.filter(item => item.id !== idToRemove));
  };
  
  // Handle drag and drop untuk urutan media
  const handleDragStart = (index, e) => e.dataTransfer.setData("text/plain", index);
  const allowDrop = (e) => e.preventDefault();
  
  const handleDrop = (targetIndex, e) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("text/plain"));
    const newMediaItems = [...mediaItems];
    
    // Tukar posisi item
    const [draggedItem] = newMediaItems.splice(dragIndex, 1);
    newMediaItems.splice(targetIndex, 0, draggedItem);
    
    setMediaItems(newMediaItems);
  };


  // Submit perubahan properti
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newFilesToUpload = mediaItems.filter(item => item.isNew).map(item => item.file);
      let uploadedFileNames = [];

      if (newFilesToUpload.length > 0) {
        const formDataUpload = new FormData();
        newFilesToUpload.forEach(file => formDataUpload.append("media", file));
        // Upload ke server
        const uploadRes = await axios.post(`${API_URL}/upload`, formDataUpload);
        uploadedFileNames = uploadRes.data.files;
      }

      let newFileNameIndex = 0;
      const finalMediaOrder = mediaItems.map(item => item.isNew ? uploadedFileNames[newFileNameIndex++] : item.file);
      const periodeSewaFinal = form.jenisProperti === 'sewa' ? `/${form.periodeAngka} ${form.periodeSatuan}` : "";
      
      // Konversi field angka ke Number untuk konsistensi
      onSave({ 
        ...form, 
        harga: Number(form.harga),
        luasTanah: Number(form.luasTanah),
        luasBangunan: Number(form.luasBangunan),
        kamarTidur: Number(form.kamarTidur),
        kamarMandi: Number(form.kamarMandi),
        media: finalMediaOrder, 
        periodeSewa: periodeSewaFinal 
      });

    } catch (error) {
      console.error("Gagal menyimpan perubahan:", error);
      Swal.fire("Error", "Gagal menyimpan perubahan!", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className={styles.backdrop} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className={styles.modal} onClick={(e) => e.stopPropagation()} initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}>
          <div className={styles.header}>
            <h3>Edit Properti</h3>
            <button onClick={onClose} className={styles.closeButton}><FaTimes /></button>
          </div>
          <form onSubmit={handleSubmit} className={styles.formBody}>
            <div className={styles.formSection}>
              <h4>Informasi Utama</h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>Nama Properti</label><input name="namaProperti" value={form.namaProperti} onChange={handleChange} required /></div>
                <div className={styles.formGroup}><label>Jenis Properti</label><select name="jenisProperti" value={form.jenisProperti} onChange={handleChange}><option value="sewa">Sewa</option><option value="jual">Jual</option><option value="cicilan">Cicilan</option></select></div>
                <div className={styles.formGroup}><label>Tipe Properti</label><select name="tipeProperti" value={form.tipeProperti} onChange={handleChange}><option>Rumah</option><option>Kost</option><option>Ruko</option><option>Tanah</option><option>Villa</option><option>Apartemen</option><option>Perumahan</option></select></div>
                <div className={styles.formGroup}><label>Harga</label><input name="harga" type="number" value={form.harga} onChange={handleChange} required /></div>
                {form.jenisProperti === "sewa" && (
                  <div className={styles.periodeSewa}><div className={styles.formGroup}><label>Periode Sewa</label><input type="number" name="periodeAngka" value={form.periodeAngka} onChange={handleChange} placeholder="Jumlah" required/></div><div className={styles.formGroup}><label>&nbsp;</label><select name="periodeSatuan" value={form.periodeSatuan} onChange={handleChange}><option value="bulan">Bulan</option><option value="tahun">Tahun</option></select></div></div>
                )}
              </div>
              <div className={styles.formGroup}><label>Deskripsi</label><textarea name="deskripsi" rows="4" value={form.deskripsi} onChange={handleChange}></textarea></div>
            </div>
            
            <div className={styles.formSection}>
              <h4>Lokasi & Detail</h4>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}><label>Lokasi</label><input name="lokasi" value={form.lokasi} onChange={handleChange} required /></div>
                <div className={styles.formGroup}><label>Kecamatan</label><input name="kecamatan" value={form.kecamatan} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Desa</label><input name="desa" value={form.desa} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Luas Tanah (m²)</label><input name="luasTanah" type="number" value={form.luasTanah} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Luas Bangunan (m²)</label><input name="luasBangunan" type="number" value={form.luasBangunan} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Kamar Tidur</label><input name="kamarTidur" type="number" value={form.kamarTidur} onChange={handleChange} /></div>
                <div className={styles.formGroup}><label>Kamar Mandi</label><input name="kamarMandi" type="number" value={form.kamarMandi} onChange={handleChange} /></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h4>Media</h4>
              <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} style={{marginBottom: '16px'}} />
              <div className={styles.mediaPreview}>
                {mediaItems.map((item, idx) => (
                  <div key={item.id} draggable onDragStart={(e) => handleDragStart(idx, e)} onDragOver={allowDrop} onDrop={(e) => handleDrop(idx, e)} className={styles.mediaItem}>
                    {item.file && item.file.type && item.file.type.startsWith("video/") ? (
                      <video src={item.url} alt="preview" controls />
                    ) : (
                      <img src={item.url} alt="preview" />
                    )}
                    <button type="button" className={styles.removeButton} onClick={() => removeMedia(item.id)}><FaTimes /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>Batal</button>
              <motion.button type="submit" className={styles.saveBtn} disabled={isSaving} whileHover={{y: -2}} whileTap={{scale:0.98}}>
                {isSaving ? "Menyimpan..." : <><FaSave /> Simpan Perubahan</>}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}