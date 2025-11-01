import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { FaCheck, FaTimes, FaTrash, FaEdit, FaInfoCircle, FaClock, FaCheckCircle, FaSearch, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./KelolaPropertiContent.module.css";
import { API_URL, SOCKET_URL } from "../../../utils/constant";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { smartParseDate, formatDisplayDate } from "../../../utils/dateUtils";
import { createSocketConnection, setupSocketListeners, emitAdminAction } from "../../../utils/socketUtils";
import { getAdminId, handleAdminAction, fetchAdminData, LoadingSpinner } from "../../../utils/adminUtils.jsx";
import PropertyTable from "./components/tables/PropertyTable";
import EditPropertyModal from "./components/components/EditPropertyModal";
import DetailPropertyModal from "./components/components/DetailPropertyModal";

const adminId = getAdminId();

// Halaman Kelola Properti Admin
export default function KelolaPropertiContent() {
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvedView, setApprovedView] = useState("user");
  const [editData, setEditData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Initialize socket connection
  const socket = createSocketConnection(SOCKET_URL);

  // Get nama owner dari ID - memoized untuk performa
  const getOwnerName = useCallback((ownerId) => {
    const user = users.find(u => String(u.id) === String(ownerId));
    return user ? user.username : "N/A";
  }, [users]);

  // Ambil data properti dan user
  const fetchData = useCallback(async (showLoading = false) => {
    console.log("KelolaPropertiContent: Fetching data, showLoading:", showLoading);
    if (showLoading) setIsLoading(true);
    try {
      const [properties, users] = await Promise.all([
        fetchAdminData("properties", "Gagal mengambil data properti"),
        fetchAdminData("users", "Gagal mengambil data user")
      ]);
      console.log("KelolaPropertiContent: Fetched properties count:", properties.length);
      console.log("KelolaPropertiContent: Fetched users count:", users.length);
      setProperties(properties.sort((a, b) => smartParseDate(b.postedAt) - smartParseDate(a.postedAt)));
      setUsers(users);
    } catch (err) {
      console.error("Gagal fetch data:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Setup socket listener
  useEffect(() => {
    fetchData(true);

    const cleanup = setupSocketListeners(socket, {
      propertyUpdate: () => fetchData(false),
      update_property: () => fetchData(false),
    });

    return cleanup;
  }, [fetchData]);

  // Handler umum untuk aksi properti
  const handleAction = (config) => handleAdminAction({
    ...config,
    emitSocket: config.skipSocketEmit !== true ? emitAdminAction : null,
    socket,
    socketAction: config.successData ? "adminPropertyUpdate" : "propertyUpdate",
    socketData: config.successData,
    onSuccess: () => {
      fetchData(false);
      if (config.onSuccess) config.onSuccess();
    }
  });

  // Handler setujui properti
  const handleApprove = (prop) => handleAction({
    swal: { title: "Setujui Properti?", text: `Properti "${prop.namaProperti}" akan diubah statusnya menjadi "Disetujui" dan akan tampil di halaman publik.`, icon: "question", showCancelButton: true, confirmButtonText: "Ya, Setujui Properti", cancelButtonText: "Batal", confirmButtonColor: "#3085d6", cancelButtonColor: "#d33" },
    action: () => axios.patch(`${API_URL}properties/${prop.id}`, { statusPostingan: "approved" }),
    successMsg: { title: "Properti Disetujui!", text: `Properti "${prop.namaProperti}" telah berhasil disetujui dan sekarang terlihat di halaman publik.` },
    errorMsg: { title: "Gagal Menyetujui!", text: "Terjadi kesalahan saat menyetujui properti. Silakan coba lagi." },
    successData: { ownerId: prop.ownerId, namaProperti: prop.namaProperti, statusPostingan: "approved" }
  });

  // Handler tolak properti
  const handleReject = (prop) => handleAction({
    swal: { title: "Tolak Properti?", text: `Properti "${prop.namaProperti}" akan diubah statusnya menjadi "Ditolak" dan dipindahkan ke daftar properti yang ditolak.`, icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Tolak Properti", cancelButtonText: "Batal", confirmButtonColor: "#e74c3c", cancelButtonColor: "#6c757d" },
    action: () => axios.patch(`${API_URL}properties/${prop.id}`, { statusPostingan: "rejected" }),
    successMsg: { title: "Properti Ditolak!", text: `Properti "${prop.namaProperti}" telah ditandai sebagai ditolak dan dipindahkan ke daftar properti ditolak.` },
    errorMsg: { title: "Gagal Menolak!", text: "Tidak dapat menolak properti. Silakan coba lagi." },
    successData: { ownerId: prop.ownerId, namaProperti: prop.namaProperti, statusPostingan: "rejected" }
  });

  // Handler hapus properti
  const handleDelete = (id) => handleAction({
    swal: { title: "Hapus Properti?", text: "Data properti ini akan dihapus secara permanen dan tidak dapat dikembalikan.", icon: "warning", showCancelButton: true, confirmButtonText: "Ya, Hapus Permanen", cancelButtonText: "Batal", confirmButtonColor: "#d33", cancelButtonColor: "#3085d6" },
    action: () => axios.delete(`${API_URL}properties/${id}`),
    successMsg: { title: "Properti Terhapus!", text: "Properti telah dihapus secara permanen dari sistem." },
    errorMsg: { title: "Gagal Menghapus!", text: "Tidak dapat menghapus properti. Silakan coba lagi." }
  });

  // Handler simpan edit
  const handleSaveEdit = (updated) => handleAction({
    swal: { title: "Simpan Perubahan?", text: `Perubahan pada properti "${updated.namaProperti}" akan disimpan ke database.`, icon: "question", showCancelButton: true, confirmButtonText: "Ya, Simpan Perubahan", cancelButtonText: "Batal", confirmButtonColor: "#3085d6", cancelButtonColor: "#aaa" },
    action: () => axios.patch(`${API_URL}properties/${updated.id}`, updated),
    onSuccess: () => setEditData(null),
    successMsg: { title: "Perubahan Tersimpan!", text: `Data properti "${updated.namaProperti}" berhasil diperbarui.` },
    errorMsg: { title: "Gagal Menyimpan!", text: "Tidak dapat menyimpan perubahan. Silakan coba lagi." },
    successData: { ownerId: updated.ownerId, namaProperti: updated.namaProperti, statusPostingan: updated.statusPostingan }
  });

  const handleEdit = (prop) => setEditData(prop);
  const handleDetail = (prop) => setDetailData(prop);

  // Render tombol aksi untuk properti pending
  const renderActionsPending = (prop) => (
    <>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDetail(prop)} title="Lihat Detail"><FaInfoCircle className={styles.infoIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleApprove(prop)} title="Setujui"><FaCheck className={styles.approveIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleReject(prop)} title="Tolak"><FaTimes className={styles.rejectIcon} /></motion.button>
    </>
  );

  // Render tombol aksi untuk properti approved
  const renderActionsApproved = (prop) => (
    <>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDetail(prop)} title="Lihat Detail"><FaInfoCircle className={styles.infoIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleEdit(prop)} title="Edit"><FaEdit className={styles.editIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDelete(prop.id)} title="Hapus"><FaTrash className={styles.deleteIcon} /></motion.button>
    </>
  );

  // Render tombol aksi untuk properti rejected
  const renderActionsRejected = (prop) => (
    <>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleApprove(prop)} title="Setujui Ulang"><FaCheck className={styles.approveIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDelete(prop.id)} title="Hapus Permanen"><FaTrash className={styles.deleteIcon} /></motion.button>
    </>
  );

  // Filter data properti berdasarkan status
  const pendingProperties = properties.filter((p) => p.statusPostingan === "pending");
  const approvedProperties = properties.filter((p) => p.statusPostingan === "approved");
  const rejectedProperties = properties.filter((p) => p.statusPostingan === "rejected");

  const filteredApproved = approvedProperties.filter(p => (
    approvedView === "admin"
      ? String(p.ownerId) === String(adminId)
      : String(p.ownerId) !== String(adminId)
  ));

  // Filter berdasarkan pencarian - memoized untuk performa
  const searchLower = globalSearch.toLowerCase();
  const filterLogic = useCallback(p =>
    p.namaProperti?.toLowerCase().includes(searchLower) ||
    p.lokasi?.toLowerCase().includes(searchLower) ||
    getOwnerName(p.ownerId).toLowerCase().includes(searchLower), [searchLower, getOwnerName]);

  const finalPendingProperties = useMemo(() => pendingProperties.filter(filterLogic), [pendingProperties, filterLogic]);
  const finalApprovedProperties = useMemo(() => filteredApproved.filter(filterLogic), [filteredApproved, filterLogic]);
  const finalRejectedProperties = useMemo(() => rejectedProperties.filter(filterLogic), [rejectedProperties, filterLogic]);

  // Tampilkan loading spinner
  if (isLoading) {
    return <LoadingSpinner className={styles.spinnerContainer} />;
  }

  // Render JSX utama
  return (
    <div className={styles.container}>
      {/* Header dengan pencarian */}
      <div className={styles.header}>
        <div>
          <h2>Kelola Properti</h2>
          <p>Pusat persetujuan dan manajemen untuk semua properti.</p>
        </div>
        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Cari judul, lokasi, owner..."
            className={styles.searchInput}
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel properti pending */}
      <PropertyTable
        icon={<FaClock />}
        title={`Properti Menunggu Persetujuan (${finalPendingProperties.length})`}
        properties={finalPendingProperties}
        users={users}
        renderActions={renderActionsPending}
        renderStatus={() => <span className={`${styles.badge} ${styles.pending}`}>Pending</span>}
        emptyMessage={globalSearch ? "Tidak ada properti pending yang cocok." : "Tidak ada properti yang menunggu persetujuan."}
      />

      {/* Tabel properti approved */}
      <PropertyTable
        icon={<FaCheckCircle />}
        title={`Properti Disetujui (${finalApprovedProperties.length})`}
        properties={finalApprovedProperties}
        users={users}
        renderActions={renderActionsApproved}
        renderStatus={() => <span className={`${styles.badge} ${styles.approved}`}>Approved</span>}
        emptyMessage={globalSearch ? "Tidak ada properti disetujui yang cocok." : "Tidak ada properti yang disetujui untuk filter ini."}
        approvedViewConfig={{ view: approvedView, onViewChange: setApprovedView }}
      />

      {/* Tabel properti rejected */}
      <PropertyTable
        icon={<FaTimesCircle />}
        title={`Properti Ditolak (${finalRejectedProperties.length})`}
        properties={finalRejectedProperties}
        users={users}
        renderActions={renderActionsRejected}
        renderStatus={() => <span className={`${styles.badge} ${styles.rejected}`}>Rejected</span>}
        emptyMessage={globalSearch ? "Tidak ada properti ditolak yang cocok." : "Tidak ada properti yang ditolak."}
      />

      {/* Modal edit properti */}
      {editData && (
        <EditPropertyModal
          data={editData}
          onClose={() => setEditData(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal detail properti */}
      {detailData && (
        <DetailPropertyModal
          data={detailData}
          onClose={() => setDetailData(null)}
          ownerName={getOwnerName(detailData.ownerId)}
          postedAt={formatDisplayDate(smartParseDate(detailData.postedAt))}
        />
      )}
    </div>
  );
}