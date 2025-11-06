// frontend/src/pages/user/TambahPropertiUser.jsx
import React, { useState, useContext, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { createSocketConnection } from "../../utils/socketUtils.js";
import Swal from "sweetalert2";
import { FaPlus, FaTimes } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../utils/constant.js";

export default function TambahPropertiUser({ darkMode, socket: externalSocket }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const socket = createSocketConnection();
  

  // ===================== STATE =====================
  const [form, setForm] = useState({
    namaProperti: "",
    jenisProperti: "Jual",
    tipeProperti: "Rumah",
    lokasi: "",
    kecamatan: "",
    desa: "",
    harga: "",
    luasTanah: "",
    luasBangunan: "",
    kamarTidur: "",
    kamarMandi: "",
    periodeAngka: "",
    periodeSatuan: "bulan",
    deskripsi: "",
    media: [],
    ownerId: user ? user.id : "",
    statusPostingan: "pending",
    postedAt: "",
    koordinat: { lat: 0, lng: 0 },
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [kecamatanList, setKecamatanList] = useState([]);
  const [desaList, setDesaList] = useState([]);
  const [selectedKecamatan, setSelectedKecamatan] = useState("");
  const [selectedDesa, setSelectedDesa] = useState("");

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
    if (kecamatanList.length > 0 && form.kecamatan) {
      const matchKec = kecamatanList.find(
        (k) => k.name.toLowerCase() === form.kecamatan.toLowerCase()
      );
      if (matchKec) setSelectedKecamatan(matchKec.id);
    }
  }, [kecamatanList, form.kecamatan]);

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
    if (desaList.length > 0 && form.desa) {
      const matchDesa = desaList.find((d) => d.name.toLowerCase() === form.desa.toLowerCase());
      if (matchDesa) setSelectedDesa(matchDesa.id);
    }
  }, [desaList, form.desa]);

  // ===================== HANDLER =====================
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const getTimestamp = () => {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      "0"
    )}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  };

  // ===================== FILE HANDLING =====================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalFiles = mediaFiles.length + files.length;
    if (totalFiles > 4) {
      Swal.fire("Error", "Total file maksimal 4!", "error");
      return;
    }

    const invalidPhoto = files.filter(
      (f) => f.type.startsWith("image/") && f.size > 2 * 1024 * 1024
    );
    if (invalidPhoto.length) {
      Swal.fire("Error", "Foto maksimal 2MB per file!", "error");
      return;
    }

    const newPreview = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreview([...mediaPreview, ...newPreview]);
  };

  const removePreview = (index) => {
    URL.revokeObjectURL(mediaPreview[index].url);
    const newFiles = [...mediaFiles];
    const newPreview = [...mediaPreview];
    newFiles.splice(index, 1);
    newPreview.splice(index, 1);
    setMediaFiles(newFiles);
    setMediaPreview(newPreview);
  };

  const handleDragStart = (index, e) => e.dataTransfer.setData("text/plain", index);
  const handleDrop = (index, e) => {
    e.preventDefault();
    const dragIndex = e.dataTransfer.getData("text/plain");
    const newPreview = [...mediaPreview];
    [newPreview[index], newPreview[dragIndex]] = [newPreview[dragIndex], newPreview[index]];
    setMediaPreview(newPreview);
    const newFiles = [...mediaFiles];
    [newFiles[index], newFiles[dragIndex]] = [newFiles[dragIndex], newFiles[index]];
    setMediaFiles(newFiles);
  };
  const allowDrop = (e) => e.preventDefault();

  // ===================== SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      Swal.fire("Oops!", "Kamu harus login dulu sebelum menambah properti!", "error");
      return;
    }

    const photoCount = mediaFiles.filter((f) => f.type.startsWith("image/")).length;
    if (photoCount < 2) {
      Swal.fire("Error", "Minimal 2 foto!", "error");
      return;
    }
    if (mediaFiles.length < 3) {
      Swal.fire("Error", "Minimal total 3 file (foto+video)!", "error");
      return;
    }

    let periodeSewa = "";
    if (form.jenisProperti === "Sewa") {
      if (!form.periodeAngka || !form.periodeSatuan) {
        Swal.fire("Error", "Isi periode sewa!", "error");
        return;
      }
      periodeSewa = `${form.periodeAngka} ${form.periodeSatuan}`;
    }

    try {
      // Upload media ke Supabase Storage via serverless API
      const toBase64NoHeader = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || "");
            const base64 = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const uploadOne = async (file) => {
        const fileBase64 = await toBase64NoHeader(file);
        const resp = await axios.post(`${API_URL}media/upload`, {
          fileBase64,
          fileName: file.name,
          pathPrefix: `properties/${user?.id || "anon"}`
        });
        return resp.data?.url || null;
      };

      const mediaUrls = [];
      for (const f of mediaFiles) {
        const url = await uploadOne(f);
        if (url) mediaUrls.push(url);
      }

      // Simpan properti ke db.json
      const hargaNum = Number(form.harga);
      if (!Number.isFinite(hargaNum)) {
        Swal.fire("Error", "Harga tidak valid. Masukkan angka yang benar.", "error");
        return;
      }
      const ownerIdNorm = Number.isFinite(Number(user?.id)) ? Number(user.id) : String(user?.id ?? "").trim();

      const propertyData = {
        namaProperti: String(form.namaProperti).trim(),
        ownerId: ownerIdNorm,
        harga: hargaNum,
        statusPostingan: "pending",
        media: mediaUrls
      };

      // Optional string fields (only include if non-empty)
      ["jenisProperti","tipeProperti","lokasi","kecamatan","desa","deskripsi"].forEach((k) => {
        const v = String(form[k] ?? "").trim();
        if (v) propertyData[k] = v;
      });

      // Optional numeric fields (include only if finite)
      [["luasTanah", form.luasTanah], ["luasBangunan", form.luasBangunan], ["kamarTidur", form.kamarTidur], ["kamarMandi", form.kamarMandi]].forEach(([k,v]) => {
        const n = Number(v);
        if (Number.isFinite(n)) propertyData[k] = n;
      });

      // Periode sewa (only for "Sewa", without leading slash)
      if (form.jenisProperti === "Sewa") {
        const ps = `${form.periodeAngka} ${form.periodeSatuan}`.trim();
        if (ps) propertyData.periodeSewa = ps;
      }

      console.info("TambahPropertiUser: Prepared payload keys", { keys: Object.keys(propertyData), mediaCount: Array.isArray(propertyData.media) ? propertyData.media.length : 0 });

      const reqId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
      await axios.post(`${API_URL}properties`, propertyData, { headers: { "x-request-id": reqId } });

      // 🔔 Emit notifikasi realtime ke admin
      if (socket && socket.connected) {
        socket.emit("propertyUpdate"); // trigger ke admin
      }

      Swal.fire("Sukses!", `Properti "${form.namaProperti}" berhasil ditambahkan!`, "success");
      navigate("/user/propertipending");


    } catch (err) {
      console.error("TambahPropertiUser: Submit error", { status: err?.response?.status });
      const payload = err?.response?.data;
      const parts = [];
      if (payload?.error) parts.push(String(payload.error));
      if (payload?.code) parts.push(`Code: ${payload.code}`);
      if (payload?.correlationId) parts.push(`ID: ${payload.correlationId}`);
      if (payload?.code === "validation_error" && Array.isArray(payload?.details)) {
        parts.push("Detail Validasi:");
        payload.details.forEach((d) => parts.push(`- ${d.field}: ${d.issue}`));
      }
      if (payload?.code === "db_insert_error" && payload?.db) {
        parts.push(`DB: ${payload.db.message || "Insert error"}`);
        if (payload.db.hint) parts.push(`Hint: ${payload.db.hint}`);
        if (payload.db.details) parts.push(`Details: ${payload.db.details}`);
      }
      const text = parts.length ? parts.join("\n") : "Gagal menambahkan properti!";
      Swal.fire("Error", text, "error");
    }
  };

  // ===================== STYLE MODE =====================
  const containerStyle = {
    backgroundColor: darkMode ? "#0d1117" : "#f9f9f9",
    color: darkMode ? "#f1f1f1" : "#1e1e1e",
    minHeight: "100vh",
    padding: "20px",
    borderRadius: "12px",
    transition: "background 0.3s ease, color 0.3s ease",
  };

  const inputStyle = {
    backgroundColor: darkMode ? "#161b22" : "#fff",
    color: darkMode ? "#e6edf3" : "#1e1e1e",
    border: darkMode ? "1px solid #30363d" : "1px solid #ccc",
    transition: "all 0.3s ease",
  };

  // ===================== RENDER =====================
  return (
    <motion.div
      className="container mt-4"
      style={containerStyle}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-center mb-4">Tambah Properti Baru</h2>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* FORM BAGIAN KIRI */}
          <div className="col-md-6">
            <label>Nama Properti</label>
            <input
              type="text"
              name="namaProperti"
              value={form.namaProperti}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
              required
            />
            <label>Jenis Properti</label>
            <select
              name="jenisProperti"
              value={form.jenisProperti}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
            >
              <option>Jual</option>
              <option>Sewa</option>
              <option>Cicilan</option>
            </select>
            <label>Tipe Properti</label>
            <select
              name="tipeProperti"
              value={form.tipeProperti}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
            >
              <option>Rumah</option>
              <option>Tanah</option>
              <option>Villa</option>
              <option>Kost</option>
              <option>Ruko</option>
              <option>Apartemen</option>
              <option>Perumahan</option>
            </select>
            <label>Harga</label>
            <input
              type="number"
              name="harga"
              value={form.harga}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
              required
            />
            {form.jenisProperti === "Sewa" && (
              <>
                <label>Periode Sewa</label>
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="number"
                    name="periodeAngka"
                    value={form.periodeAngka}
                    onChange={handleChange}
                    placeholder="Jumlah"
                    className="form-control"
                    style={inputStyle}
                    required
                  />
                  <select
                    name="periodeSatuan"
                    value={form.periodeSatuan}
                    onChange={handleChange}
                    className="form-control"
                    style={inputStyle}
                  >
                    <option value="bulan">Bulan</option>
                    <option value="tahun">Tahun</option>
                  </select>
                </div>
              </>
            )}
            <label>Deskripsi</label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              className="form-control mb-3"
              style={inputStyle}
            ></textarea>
          </div>

          {/* FORM BAGIAN KANAN */}
          <div className="col-md-6">
            <label>Lokasi</label>
            <input
              type="text"
              name="lokasi"
              value={form.lokasi}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
              required
            />
            <label>Kecamatan</label>
            <select
              name="kecamatan"
              value={form.kecamatan}
              onChange={(e) => {
                handleChange(e);
                const selected = kecamatanList.find((k) => k.name === e.target.value);
                setSelectedKecamatan(selected ? selected.id : "");
              }}
              className="form-select mb-2"
              style={inputStyle}
            >
              <option value="">-- Pilih Kecamatan --</option>
              {kecamatanList.map((kec) => (
                <option key={kec.id} value={kec.name}>
                  {kec.name}
                </option>
              ))}
            </select>
            <label>Desa</label>
            <select
              name="desa"
              value={form.desa}
              onChange={(e) => {
                handleChange(e);
                const selected = desaList.find((d) => d.name === e.target.value);
                setSelectedDesa(selected ? selected.id : "");
              }}
              className="form-select mb-2"
              style={inputStyle}
              disabled={!selectedKecamatan}
            >
              <option value="">-- Pilih Desa --</option>
              {desaList.map((desa) => (
                <option key={desa.id} value={desa.name}>
                  {desa.name}
                </option>
              ))}
            </select>
            <label>Luas Tanah (m²)</label>
            <input
              type="number"
              name="luasTanah"
              value={form.luasTanah}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
            />
            <label>Luas Bangunan (m²)</label>
            <input
              type="number"
              name="luasBangunan"
              value={form.luasBangunan}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
            />
            <label>Kamar Tidur</label>
            <input
              type="number"
              name="kamarTidur"
              value={form.kamarTidur}
              onChange={handleChange}
              className="form-control mb-2"
              style={inputStyle}
            />
            <label>Kamar Mandi</label>
            <input
              type="number"
              name="kamarMandi"
              value={form.kamarMandi}
              onChange={handleChange}
              className="form-control mb-3"
              style={inputStyle}
            />
            <label>Upload Media (Foto/Video)</label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="form-control mb-2"
              style={inputStyle}
            />
            <div className="d-flex flex-wrap gap-2">
              {mediaPreview.map((m, idx) => (
                <div
                  key={`${m.file.name}-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(idx, e)}
                  onDragOver={allowDrop}
                  onDrop={(e) => handleDrop(idx, e)}
                  className="position-relative"
                  style={{ width: "100px", height: "80px" }}
                >
                  {m.file.type.startsWith("image/") ? (
                    <img
                      src={m.url}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <video src={m.url} width="100" height="80" controls />
                  )}
                  <button
                    type="button"
                    onClick={() => removePreview(idx)}
                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                    style={{ transform: "translate(20%, -20%)" }}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <motion.button
          type="submit"
          className="btn btn-primary mt-4 w-100"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus className="me-2" /> Tambah Properti
        </motion.button>
      </form>
    </motion.div>
  );
}