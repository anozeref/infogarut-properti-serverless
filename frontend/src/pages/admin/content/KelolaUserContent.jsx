import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { FaCheck, FaClock, FaUndo, FaBan, FaInfoCircle, FaUsers, FaUserClock, FaUserSlash, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import { ThemeContext } from "../DashboardAdmin";
import styles from "./KelolaUserContent.module.css";
import { API_URL } from "../../../utils/constant";
import { formatToCustomTimestamp, parseAndFormatDate, parseDateStringForComparison, parseAndFormatShortDate } from "../../../utils/dateUtils";
import { fetchAdminData, LoadingSpinner } from "../../../utils/adminUtils.jsx";
import TabelUser from "./components/tables/TabelUser";
import ModalUser from "./ModalUser";

// Halaman Kelola User Admin
const KelolaUserContent = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewVerified, setViewVerified] = useState("user");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);


  // Ambil data user dan properti
  const fetchData = useCallback(async () => {
    console.log("KelolaUserContent: Fetching data");
    try {
      const [usersData, propertiesData] = await Promise.all([
        fetchAdminData("users", "Gagal mengambil data user"),
        fetchAdminData("properties", "Gagal mengambil data properti")
      ]);
      console.log("KelolaUserContent: Fetched users count:", usersData.length);
      console.log("KelolaUserContent: Fetched properties count:", propertiesData.length);
      setUsers(usersData.map((u) => ({ ...u, verified: u.verified === true })));
      setProperties(propertiesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup data fetching
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // [REVISED] Update data user: only handles logic (API & socket), returns promise
  const updateUser = async (id, updatedFields) => {
    const target = users.find((u) => u.id === id);
    if (!target) {
      throw new Error("User tidak ditemukan.");
    }
    try {
      await axios.put(`${API_URL}users/${id}`, { ...target, ...updatedFields });
    } catch (error) {
      console.error("Gagal memperbarui data user:", error);
      throw new Error("Gagal memperbarui data user.");
    }
  };

  // [REVISED] Handler verifikasi user
  const handleVerify = (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    Swal.fire({
      title: `Verifikasi User "${target.username}"?`,
      text: `User "${target.username}" akan diverifikasi dan mendapatkan status "Verified".`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Verifikasi User",
      cancelButtonText: "Batal",
      confirmButtonColor: "#28a745",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateUser(id, { verified: true });
          Swal.fire("Berhasil!", `User "${target.username}" telah diverifikasi.`, "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  // [REVISED] Handler suspend user
  const handleSuspend = (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    Swal.fire({
      title: `Suspend User "${target.username}"?`,
      html: `
        <p>Pilih durasi suspend untuk user "${target.username}":</p>
        <div class="swal-radio-container">
          <label class="swal-radio-option"><input type="radio" name="suspend_duration" value="3" checked><span>3 Hari</span></label>
          <label class="swal-radio-option"><input type="radio" name="suspend_duration" value="7"><span>7 Hari</span></label>
          <label class="swal-radio-option"><input type="radio" name="suspend_duration" value="14"><span>14 Hari</span></label>
          <label class="swal-radio-option"><input type="radio" name="suspend_duration" value="30"><span>30 Hari</span></label>
        </div>
      `,
      customClass: { htmlContainer: 'swal-suspend-override' },
      showCancelButton: true,
      confirmButtonText: "Ya, Suspend User",
      cancelButtonText: "Batal",
      confirmButtonColor: "#f59e0b",
      preConfirm: () => document.querySelector('input[name="suspend_duration"]:checked').value,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const durationInDays = parseInt(result.value, 10);
          const suspendedUntil = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
          const formattedDate = formatToCustomTimestamp(suspendedUntil);
          await updateUser(id, { suspendedUntil: formattedDate });
          Swal.fire("Berhasil!", `User "${target.username}" disuspend selama ${durationInDays} hari.`, "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  // [REVISED] Handler unsuspend user
  const handleUnSuspend = (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    Swal.fire({
      title: `Cabut Suspend User "${target.username}"?`,
      text: `Suspend untuk user "${target.username}" akan dicabut.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Cabut Suspend",
      cancelButtonText: "Batal",
      confirmButtonColor: "#28a745",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateUser(id, { suspendedUntil: null });
          Swal.fire("Berhasil!", `Suspend untuk user "${target.username}" telah dicabut.`, "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  // [REVISED] Handler banned user
  const handleBanned = (id) => {
    const target = users.find(u => u.id === id);
    if (!target) return;

    Swal.fire({
      title: `Banned User "${target.username}"?`,
      text: `Tindakan ini tidak bisa dibatalkan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Banned User",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc3545",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const timestamp = formatToCustomTimestamp(new Date());
          await updateUser(id, { banned: true, bannedAt: timestamp });
          Swal.fire("Berhasil!", `User "${target.username}" telah dibanned.`, "success");
        } catch (error) {
          Swal.fire("Error!", error.message, "error");
        }
      }
    });
  };

  // Handler detail user
  const handleDetail = (user) => {
    setSelectedUser({ ...user });
    setModalOpen(true);
  };

  // Render tombol aksi untuk user aktif
  const renderActionsForActive = (user) => (
    <>
      {!user.verified && (<motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleVerify(user.id)} title="Verifikasi User"><FaCheck className={styles.approveIcon} /></motion.button>)}
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleSuspend(user.id)} title="Suspend User"><FaClock className={styles.suspendIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleBanned(user.id)} title="Banned User"><FaBan className={styles.deleteIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDetail(user)} title="Lihat Detail"><FaInfoCircle className={styles.infoIcon} /></motion.button>
    </>
  );

  // Render tombol aksi untuk user suspend
  const renderActionsForSuspend = (user) => (
    <>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleUnSuspend(user.id)} title="Cabut Suspend"><FaUndo className={styles.unsuspendIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleBanned(user.id)} title="Banned User"><FaBan className={styles.deleteIcon} /></motion.button>
      <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDetail(user)} title="Lihat Detail"><FaInfoCircle className={styles.infoIcon} /></motion.button>
    </>
  );

  // Render tombol aksi untuk user banned
  const renderActionsForBanned = (user) => (
    <motion.button whileHover={{ y: -2 }} className={styles.iconBtn} onClick={() => handleDetail(user)} title="Lihat Detail"><FaInfoCircle className={styles.infoIcon} /></motion.button>
  );

  // Render status badge
  const renderStatus = {
    active: (user) => user.verified ? <span className={`${styles.badge} ${styles.approved}`}>Verified</span> : <span className={`${styles.badge} ${styles.pending}`}>Unverified</span>,
    suspend: () => <span className={`${styles.badge} ${styles.suspended}`}>Suspend</span>,
    banned: () => <span className={`${styles.badge} ${styles.banned}`}>Banned</span>,
  };

  // Filter logic untuk user
  const todayStartOfDay = new Date();
  todayStartOfDay.setHours(0, 0, 0, 0);

  const sortedUsers = useMemo(() => [...users].sort((a, b) => {
    const dateA = parseDateStringForComparison(a.joinedAt);
    const dateB = parseDateStringForComparison(b.joinedAt);
    if (dateA && dateB) return dateB - dateA;
    if (dateA) return -1;
    if (dateB) return 1;
    return b.id - a.id;
  }), [users]);

  const searchLower = searchTerm.toLowerCase();

  const baseFilteredUsers = useMemo(() => sortedUsers
    .filter((u) => u.role !== "admin")
    .filter((u) =>
      (u.username?.toLowerCase() || '').includes(searchLower) ||
      (u.nama?.toLowerCase() || '').includes(searchLower)
    ), [sortedUsers, searchLower]);

  const activeUsers = useMemo(() => baseFilteredUsers
    .filter((u) => {
      const suspendedUntilDate = parseDateStringForComparison(u.suspendedUntil);
      return !u.banned && (!suspendedUntilDate || suspendedUntilDate < todayStartOfDay);
    })
    .filter((u) => (viewVerified === "verified" ? u.verified : !u.verified)), [baseFilteredUsers, viewVerified, todayStartOfDay]);

  const suspendUsers = useMemo(() => baseFilteredUsers.filter((u) => {
    const suspendedUntilDate = parseDateStringForComparison(u.suspendedUntil);
    return !u.banned && suspendedUntilDate && suspendedUntilDate >= todayStartOfDay;
  }), [baseFilteredUsers, todayStartOfDay]);

  const bannedUsers = useMemo(() => baseFilteredUsers.filter((u) => u.banned === true), [baseFilteredUsers]);

  // Tampilkan loading spinner
  if (isLoading) {
    return <LoadingSpinner className={styles.spinnerContainer} />;
  }

  return (
    <div className={styles.container} data-theme={theme}>
      <div className={styles.header}>
        <div>
          <h2>Kelola User</h2>
          <p>Tinjau dan kelola semua pengguna terdaftar.</p>
        </div>
        <div className={styles.controls}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input type="text" placeholder="Cari username atau nama..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className={styles.toggleContainer}>
            <span>Unverified</span>
            <label>
              <input type="checkbox" checked={viewVerified === "verified"} onChange={() => setViewVerified(viewVerified === "verified" ? "user" : "verified")} />
              <div className={styles.slider}><div className={styles.sliderBall}></div></div>
            </label>
            <span>Verified</span>
          </div>
        </div>
      </div>

      <TabelUser
        icon={<FaUsers />}
        title={`User Aktif (${activeUsers.length})`}
        users={activeUsers}
        properties={properties}
        renderActions={renderActionsForActive}
        renderStatus={renderStatus.active}
        emptyMessage={searchTerm ? "Tidak ada user aktif yang cocok." : "Tidak ada user aktif untuk filter ini."}
        dateColumnHeader="Tgl Bergabung"
        renderDateColumn={(user) => parseAndFormatShortDate(user.joinedAt)}
      />
      <TabelUser
        icon={<FaUserClock />}
        title={`User Suspend (${suspendUsers.length})`}
        users={suspendUsers}
        properties={properties}
        renderActions={renderActionsForSuspend}
        renderStatus={renderStatus.suspend}
        emptyMessage={searchTerm ? "Tidak ada user suspend yang cocok." : "Tidak ada user yang sedang disuspend."}
        dateColumnHeader="Suspend Berakhir"
        renderDateColumn={(user) => parseAndFormatShortDate(user.suspendedUntil)}
      />
      <TabelUser
        icon={<FaUserSlash />}
        title={`User Banned (${bannedUsers.length})`}
        users={bannedUsers}
        properties={properties}
        renderActions={renderActionsForBanned}
        renderStatus={renderStatus.banned}
        emptyMessage={searchTerm ? "Tidak ada user banned yang cocok." : "Tidak ada user yang dibanned."}
        dateColumnHeader="Tanggal Dibanned"
        renderDateColumn={(user) => parseAndFormatShortDate(user.bannedAt)}
      />

      {modalOpen && (
        <ModalUser
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          user={selectedUser}
          properties={properties.filter(p => String(p.ownerId) === String(selectedUser.id))}
          theme={theme}
          joinedDate={parseAndFormatDate(selectedUser.joinedAt)}
        />
      )}
    </div>
  );
};

export default KelolaUserContent;