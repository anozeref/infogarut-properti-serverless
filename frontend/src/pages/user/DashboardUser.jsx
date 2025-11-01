// src/pages/user/DashboardUser.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
  Outlet,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

// Context
import { AuthContext } from "../../context/AuthContext";

// Components
import NavbarUser from "./components/NavbarUser";
import SidebarUser from "./components/Sidebar";
import FooterUser from "./components/FooterUser";
import CardProperty from "./components/CardProperty";
import AddPropertyButton from "./components/AddPropertyButton";

// Pages
import PropertiSaya from "./PropertiSaya";
import PropertiPending from "./PropertiPending";
import PropertiAktif from "./PropertiAktif";
import PropertiDitolak from "./PropertiDitolak";
import ProfileUser from "./ProfileUser/ProfileUser";
import EditProperty from "./EditProperty";
import TambahPropertiUser from "./TambahPropertiUser";

// Styles
import styles from "./DashboardUser.module.css";

const API_BASE_URL = "http://localhost:3004";
const SOCKET_SERVER_URL = "http://localhost:3005";

// ============================================================
// BUAT SATU KONEKSI SOCKET DI SINI
// ============================================================
const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
  reconnection: true,
  autoConnect: false, // Akan di-connect manual saat user login
});

export default function DashboardUser() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Jangan return dulu, cukup tandai status user valid
  const isUserValid = user && user.role === "user";

  // ============================================================
  // Semua hooks harus tetap dipanggil
  // ============================================================
  const [darkMode, setDarkMode] = useState(false);
  const [latestProperties, setLatestProperties] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // === Fungsi untuk ambil notifikasi dari DB ===
  const fetchNotifications = useCallback(async () => {
    if (!isUserValid) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/notifications?userId=${user.id}&_sort=createdAt&_order=desc`
      );
      const formattedNotifs = res.data.map((n) => ({
        id: n.id,
        message: n.text,
        time: new Date(n.createdAt),
        link: n.link,
        isRead: n.isRead,
      }));
      setNotifications(formattedNotifs);
    } catch (err) {
      console.error("Gagal fetch riwayat notifikasi:", err);
    }
  }, [isUserValid, user?.id]);

  useEffect(() => {
    if (isUserValid) fetchNotifications();
  }, [fetchNotifications, isUserValid]);

  // === Tambah notifikasi baru + toast ===
  const addNotification = useCallback(
    (data, isUpload = false) => {
      if (!isUserValid) return;
      let msg = "";
      let icon = "info";
      let link = null;

      if (isUpload) {
        msg = data.message || "Ada update file baru.";
        icon = "info";
      } else {
        link =
          data.statusPostingan === "approved"
            ? "/user/propertiaktif"
            : "/user/propertiditolak";
        if (data.statusPostingan === "approved") {
          msg = `Properti "${data.namaProperti}" telah disetujui 🟢`;
          icon = "success";
        } else if (data.statusPostingan === "rejected") {
          msg = `Properti "${data.namaProperti}" telah ditolak 🔴`;
          icon = "error";
        } else {
          msg = `Properti "${data.namaProperti}" telah diperbarui.`;
        }
      }

      fetchNotifications();

      Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title: msg,
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
        background: darkMode ? "#1e1e1e" : "#fff",
        color: darkMode ? "#eee" : "#333",
      });
    },
    [darkMode, fetchNotifications, isUserValid]
  );

  // === Ambil properti aktif terbaru ===
  const fetchLatestProperties = useCallback(() => {
    if (!isUserValid) return;
    axios
      .get(`${API_BASE_URL}/properties`)
      .then((res) => {
        const activeProps = res.data
          .filter(
            (p) =>
              String(p.ownerId) === String(user.id) &&
              p.statusPostingan === "approved"
          )
          .sort((a, b) => {
            const dateA = a.postedAt
              ? new Date(
                  a.postedAt.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")
                )
              : new Date(0);
            const dateB = b.postedAt
              ? new Date(
                  b.postedAt.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$2/$1/$3")
                )
              : new Date(0);
            return dateB - dateA;
          })
          .slice(0, 3);
        setLatestProperties(activeProps);
      })
      .catch((err) => console.error("❌ Gagal ambil data properti:", err));
  }, [isUserValid, user?.id]);

  useEffect(() => {
    if (isUserValid) fetchLatestProperties();
  }, [fetchLatestProperties, isUserValid]);

  // === Setup Socket.IO ===
  useEffect(() => {
    if (!isUserValid) return;

    if (!socket.connected) socket.connect();

    const joinRoom = () => {
      socket.emit("joinUserRoom", user.id);
      console.log(`👤 Socket.IO: User ${user.id} bergabung ke ruangan.`);
    };

    const handleStatusUpdate = (data) => {
      if (String(data.ownerId) === String(user.id)) {
        addNotification(data, false);
        fetchLatestProperties();
      }
    };

    const handleUploadNotif = (data) => {
      if (data.message) addNotification(data, true);
    };

    socket.on("propertyStatusUpdated", handleStatusUpdate);
    socket.on("notif_upload", handleUploadNotif);
    
    socket.on("connect", joinRoom);
    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });

    joinRoom();

    return () => {
      socket.off("propertyStatusUpdated", handleStatusUpdate);
      socket.off("notif_upload", handleUploadNotif);
      socket.off("connect", joinRoom);
      socket.off("disconnect");
    };
  }, [isUserValid, user?.id, addNotification, fetchLatestProperties]);

  // === Clear notifikasi ===
  const handleClearNotifications = async () => {
  if (!user?.id) return;

  try {
    // Ambil semua notifikasi milik user
    const res = await axios.get(`${API_BASE_URL}/notifications?userId=${user.id}`);
    const userNotifs = res.data;

    if (userNotifs.length === 0) return;

    // Hapus satu per satu (karena JSON Server belum dukung bulk delete)
    await Promise.all(
      userNotifs.map((notif) =>
        axios.delete(`${API_BASE_URL}/notifications/${notif.id}`)
      )
    );

    // Kosongkan state agar UI langsung bersih
    setNotifications([]);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Semua notifikasi berhasil dibersihkan!",
      showConfirmButton: false,
      timer: 2500,
      background: darkMode ? "#1e1e1e" : "#fff",
      color: darkMode ? "#eee" : "#333",
    });
  } catch (err) {
    console.error("Gagal menghapus notifikasi:", err);
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: "Tidak dapat membersihkan notifikasi.",
      background: darkMode ? "#1e1e1e" : "#fff",
      color: darkMode ? "#eee" : "#333",
    });
  }
};


  const toggleTheme = () => setDarkMode((prev) => !prev);
  const handleAddProperty = () => navigate("/user/tambahproperty");

  // ============================================================
  // RETURN UTAMA
  // ============================================================
  return (
    <>
      {!isUserValid ? (
        // ✅ Aman: tidak menghentikan eksekusi hook
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            color: "#666",
          }}
        >
          Memuat dashboard...
        </div>
      ) : (
        <div
          className={`${styles.dashboardContainer} ${
            darkMode ? styles.darkMode : styles.lightMode
          }`}
        >
          <NavbarUser
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            notifications={notifications}
            handleClear={handleClearNotifications}
          />

          <div style={{ display: "flex" }}>
            <SidebarUser darkMode={darkMode} />

            <div style={{ flex: 1, marginLeft: "20px" }}>
              <Routes>
                <Route
                  index
                  element={
                    <>
                      <h2
                        style={{
                          marginBottom: "10px",
                          color: darkMode ? "#e5e5e5" : "#1e1e1e",
                        }}
                      >
                        Halo,{" "}
                        <span style={{ color: "#4f46e5" }}>
                          {user.username || "User"}
                        </span>{" "}
                        — Selamat Datang di Info Garut Properti!
                      </h2>

                      <p
                        style={{
                          color: darkMode ? "#ccc" : "#555",
                          marginBottom: "20px",
                        }}
                      >
                        Yuk, kelola dan lihat update properti terbaru di
                        dashboard kamu!
                      </p>

                      <section style={{ marginTop: "10px" }}>
                        <h3
                          style={{
                            marginBottom: "15px",
                            color: darkMode ? "#ddd" : "#333",
                          }}
                        >
                          Update Properti Aktif Terbaru
                        </h3>

                        <div className={styles.propertyGrid}>
                          {latestProperties.length > 0 ? (
                            latestProperties.map((prop) => (
                              <div
                                key={prop.id}
                                className={styles.cardWrapper}
                              >
                                <CardProperty
                                  id={prop.id}
                                  namaProperti={prop.namaProperti}
                                  tipeProperti={prop.tipeProperti}
                                  jenisProperti={prop.jenisProperti}
                                  periodeSewa={prop.periodeSewa}
                                  harga={prop.harga}
                                  luasTanah={prop.luasTanah}
                                  luasBangunan={prop.luasBangunan}
                                  kamarTidur={prop.kamarTidur}
                                  kamarMandi={prop.kamarMandi}
                                  lokasi={prop.lokasi}
                                  deskripsi={prop.deskripsi}
                                  media={prop.media}
                                  status={prop.statusPostingan}
                                  darkMode={darkMode}
                                />
                              </div>
                            ))
                          ) : (
                            <p style={{ color: darkMode ? "#bbb" : "#777" }}>
                              Belum ada properti aktif ditambahkan.
                            </p>
                          )}
                        </div>
                      </section>
                    </>
                  }
                />

                <Route
                  path="propertisaya"
                  element={<Outlet context={{ darkMode, socket }} />}
                >
                  <Route index element={<PropertiSaya />} />
                </Route>

                <Route
                  path="propertipending"
                  element={<Outlet context={{ darkMode, socket }} />}
                >
                  <Route index element={<PropertiPending />} />
                </Route>

                <Route
                  path="propertiaktif"
                  element={<Outlet context={{ darkMode, socket }} />}
                >
                  <Route index element={<PropertiAktif />} />
                </Route>

                <Route
                  path="propertiditolak"
                  element={<Outlet context={{ darkMode, socket }} />}
                >
                  <Route index element={<PropertiDitolak />} />
                </Route>

                <Route
                  path="edit-property/:id"
                  element={<EditProperty darkMode={darkMode} socket={socket} />}
                />
                <Route
                  path="tambahproperty"
                  element={
                    <TambahPropertiUser darkMode={darkMode} socket={socket} />
                  }
                />
                <Route
                  path="profileuser"
                  element={<ProfileUser darkMode={darkMode} socket={socket} />}
                />
              </Routes>
            </div>
          </div>

          <FooterUser darkMode={darkMode} />

          {location.pathname.startsWith("/user") &&
            !location.pathname.includes("tambahproperty") && (
              <AddPropertyButton onClick={handleAddProperty} />
            )}
        </div>
      )}
    </>
  );
}
