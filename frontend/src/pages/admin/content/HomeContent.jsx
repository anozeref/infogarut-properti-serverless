import React, { useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaUsers, FaBuilding, FaClock, FaCheckCircle, FaBell } from "react-icons/fa";
import styles from "./HomeContent.module.css";
import { ThemeContext } from "../DashboardAdmin";
import { API_URL } from "../../../utils/constant";
import { smartParseDate, formatDateSeparator } from "../../../utils/dateUtils";
import { createSocketConnection, setupSocketListeners } from "../../../utils/socketUtils";
import { LoadingSpinner } from "../../../utils/adminUtils.jsx";
import StatCard from "./components/components/StatCard";

// Halaman utama dashboard admin
const HomeContent = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUser: 0, totalProperti: 0, propertiPending: 0, propertiApproved: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  // Ambil data statistik dan notifikasi
  const fetchData = useCallback(async () => {
    console.log("HomeContent: Fetching data from API_URL:", API_URL);
    try {
      const [usersRes, propsRes] = await Promise.all([
        fetch(`${API_URL}users`),
        fetch(`${API_URL}properties`)
      ]);
      console.log("HomeContent: Users response status:", usersRes.status);
      console.log("HomeContent: Properties response status:", propsRes.status);
      if (!usersRes.ok || !propsRes.ok) throw new Error("Gagal mengambil data");

      const users = await usersRes.json();
      const props = await propsRes.json();
      console.log("HomeContent: Fetched users count:", users.length);
      console.log("HomeContent: Fetched properties count:", props.length);

      setStats({
        totalUser: users.filter(u => u.role === "user").length,
        totalProperti: props.length,
        propertiPending: props.filter(p => p.statusPostingan === "pending").length,
        propertiApproved: props.filter(p => p.statusPostingan === "approved").length,
      });
      
      const notifUsers = users.filter(u => u.role === "user").map(u => ({
        id: `u${u.id}`, text: `User ${u.username} telah bergabung`, timestamp: smartParseDate(u.joinedAt), type: "user",
      }));
      const notifProps = props
        .filter(p => {
          // Exclude properti yang owner-nya adalah admin (role admin)
          const owner = users.find(u => u.id === p.ownerId);
          return owner && owner.role === "user";
        })
        .map(p => {
          let text;
          const username = users.find(u => u.id === p.ownerId)?.username || "?";
          const propertyName = p.namaProperti || "?";

          switch (p.statusPostingan) {
            case "pending":
              text = `User ${username} meminta pengajuan properti "${propertyName}"`;
              break;
            case "approved":
              text = `Pengajuan properti "${propertyName}" oleh ${username} telah disetujui`;
              break;
            case "rejected":
              text = `Pengajuan properti "${propertyName}" oleh ${username} telah ditolak`;
              break;
            default:
              text = `Properti "${propertyName}" oleh ${username} - Status: ${p.statusPostingan}`;
          }

          return {
            id: `p${p.id}`,
            text,
            timestamp: smartParseDate(p.postedAt),
            type: "property",
          };
        });
      
      // Urutkan notifikasi terbaru
      setNotifications([...notifUsers, ...notifProps].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
    } catch (err) {
      console.error("Error fetch HomeContent:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Setup socket listener
  useEffect(() => {
    fetchData();
    const socket = createSocketConnection();
    const cleanup = setupSocketListeners(socket, {
      userUpdate: fetchData,
      propertyUpdate: fetchData,
      update_property: fetchData,
    });

    return () => {
      cleanup();
      socket.disconnect();
    };
  }, [fetchData]);

  // Navigasi berdasarkan tipe notifikasi
  const handleNotifClick = (notif) => {
    if (notif.type === "user") navigate("/admin/user");
    else if (notif.type === "property") navigate("/admin/properti");
  };
  
  // Format pemisah tanggal (Hari Ini, Kemarin, dll)
  const formatDateSeparator = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateObj = new Date(date);

    if (dateObj.toDateString() === today.toDateString()) return "Hari Ini";
    if (dateObj.toDateString() === yesterday.toDateString()) return "Kemarin";
    return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  if (isLoading) {
    return <LoadingSpinner className={styles.spinnerContainer} />;
  }

  let lastDate = null;

  return (
    <div className={styles.container}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className={styles.header}>
          <div>
            <h2>Selamat Datang, Admin</h2>
            <p>{today}</p>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <StatCard icon={<FaUsers />} title="Total User" value={stats.totalUser} colorClass="user" />
          <StatCard icon={<FaBuilding />} title="Total Properti" value={stats.totalProperti} colorClass="properti" />
          <StatCard icon={<FaClock />} title="Properti Pending" value={stats.propertiPending} colorClass="pending" />
          <StatCard icon={<FaCheckCircle />} title="Disetujui" value={stats.propertiApproved} colorClass="approved" />
        </div>

        <div className={styles.notificationsCard}>
          <div className={styles.cardHeader}>
            <FaBell />
            <h5>Notifikasi Aktivitas</h5>
          </div>
          <div className={styles.notifList}>
            {notifications.length > 0 ? (
              notifications.map((notif) => {
                const currentDate = new Date(notif.timestamp).toDateString();
                const showDateSeparator = currentDate !== lastDate;
                lastDate = currentDate;

                return (
                  <React.Fragment key={notif.id}>
                    {showDateSeparator && (
                      <div className={styles.notifDateSeparator}>
                        {formatDateSeparator(notif.timestamp)}
                      </div>
                    )}
                    <div className={styles.notifRow} onClick={() => handleNotifClick(notif)}>
                      <span className={styles.notifTimestamp}>
                        {notif.timestamp ? new Date(notif.timestamp).toLocaleString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </span>
                      <p className={styles.notifContent}>{notif.text}</p>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div className={styles.emptyState}>Tidak ada notifikasi terbaru.</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HomeContent;