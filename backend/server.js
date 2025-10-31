// backend/server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = 3005; // Port untuk backend aplikasi ini
const DB_URL = "http://localhost:3004"; // Alamat json-server (database)

// === 1. Middleware Dasar ===
app.use(cors());
app.use(express.json());

// Pastikan folder media ada
const mediaDir = path.join(__dirname, "public/media");
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

// Serve file statis (gambar) dari folder public/media
app.use("/media", express.static(mediaDir));

// === 2. Setup Server HTTP + Socket.IO ===
const httpServer = createServer(app); // Ganti nama variabel server -> httpServer
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Sesuaikan dengan URL frontend Anda
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// === 3. Logika Koneksi Socket.IO (Digabung) ===
io.on("connection", (socket) => {
  console.log(`✅ User terhubung via Socket.IO: ${socket.id}`);

  // Event umum untuk refresh data di Admin
  socket.on('propertyUpdate', () => {
    console.log("🔔 [Server] Menerima 'propertyUpdate', membalas ke semua admin...");
    io.emit('propertyUpdate'); // Dipakai di KelolaProperti
  });
  socket.on('userUpdate', () => {
    console.log("🔔 [Server] Menerima 'userUpdate', membalas ke semua admin...");
    io.emit('userUpdate'); // Dipakai di KelolaUser & Pengaturan
  });

  // Event untuk notifikasi upload global (jika masih dipakai)
  socket.on("new_upload", (data) => {
    console.log("🆕 Upload baru terdeteksi:", data);
    io.emit("notif_upload", data); // Kirim ke semua client
  });

  // Event untuk user bergabung ke room notifikasi pribadinya
  socket.on("joinUserRoom", (userId) => {
    if (userId) {
      socket.join(String(userId));
      console.log(`✅ User ${socket.id} (ID: ${userId}) bergabung ke room: ${userId}`);
    }
  });

  // Event saat admin mengubah status properti (kirim notif ke user pemilik)
  socket.on("adminPropertyUpdate", async (data) => {
    if (!data || !data.ownerId || !data.namaProperti) {
        console.warn("⚠️ Data 'adminPropertyUpdate' tidak lengkap:", data);
        return;
    }

    console.log("🔔 [Server] Menerima 'adminPropertyUpdate', memproses notifikasi...");

    try {
      const statusText = data.statusPostingan === 'approved' ? 'disetujui' : 'ditolak';
      const link = data.statusPostingan === 'approved' ? '/user/propertiaktif' : '/user/propertiditolak';

      const newNotification = {
        userId: String(data.ownerId), // Pastikan ownerId dikirim dari frontend
        text: `Properti '${data.namaProperti}' Anda telah ${statusText} oleh admin.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        link: link
      };

      // Simpan notifikasi ke db.json (melalui json-server)
      await axios.post(`${DB_URL}/notifications`, newNotification);
      console.log(`🔔 [Server] Notifikasi disimpan untuk User ID: ${data.ownerId}`);

      // ==================================================================
      // PERUBAHAN DI SINI:
      // Kirim event 'propertyStatusUpdated' beserta data (namaProperti, statusPostingan)
      // agar sesuai dengan listener di DashboardUser.jsx
      io.to(String(data.ownerId)).emit("propertyStatusUpdated", data);
      console.log(`🔔 [Server] Event 'propertyStatusUpdated' dikirim ke room: ${data.ownerId}`);
      // ==================================================================

      // (Opsional) Kirim update properti umum ke admin
      io.emit("propertyUpdate");
      console.log("🔔 [Server] Membalas 'propertyUpdate' ke semua admin...");

    } catch (err) {
      console.error("❌ Gagal menyimpan atau mengirim notifikasi:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User terputus: ${socket.id}`);
  });
});


// === 4. Setup Multer (Upload File) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, mediaDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

// Batas ukuran file 20MB, maks 4 file
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
}).array("media", 4);

// === 5. Endpoint-endpoint API Anda ===

// Endpoint untuk upload
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error("❌ Error saat upload:", err.message);
      return res.status(400).json({ error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Tidak ada file yang diupload" });
    }
    const files = req.files.map((f) => f.filename);
    console.log("📸 File berhasil diupload:", files);
    res.json({ files });
    io.emit("new_upload", { files, time: new Date() }); // Kirim notif upload global
  });
});

// Endpoint GET users (contoh)
app.get("/users", async (_, res) => {
  try {
    const { data } = await axios.get(`${DB_URL}/users`);
    res.json(data);
  } catch (err) {
    console.error("❌ Gagal mengambil users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Endpoint GET properties (contoh)
app.get("/properties", async (_, res) => {
  try {
    const { data } = await axios.get(`${DB_URL}/properties`);
    res.json(data);
  } catch (err) {
    console.error("❌ Gagal mengambil properties:", err.message);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});


// Endpoint DELETE property + media
app.delete("/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil data properti yang akan dihapus untuk mendapatkan nama filenya
    const { data: property } = await axios.get(`${DB_URL}/properties/${id}`);

    // Hapus file-file media terkait
    if (property.media && Array.isArray(property.media)) {
      property.media.forEach((file) => {
        const filePath = path.join(mediaDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ File media dihapus: ${file}`);
        }
      });
    }

    // Hapus data properti dari db.json
    await axios.delete(`${DB_URL}/properties/${id}`);

    io.emit("propertyUpdate", { id, deleted: true }); // Kirim update ke admin
    res.json({ success: true, deletedId: id });

  } catch (err) {
    console.error("❌ Error saat menghapus properti:", err.message);
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: "Properti tidak ditemukan" });
    }
    res.status(500).json({ error: "Gagal menghapus properti" });
  }
});

// Endpoint GET semua user yang dibanned
app.get("/api/banned-users", async (_, res) => {
  try {
    const { data: users } = await axios.get(`${DB_URL}/users`);
    // Filter user yang memiliki properti banned === true
    const bannedUsers = users.filter(u => u.banned === true);
    res.json(bannedUsers);
  // BAGIAN YANG HILANG DITAMBAHKAN DI SINI
  } catch (err) {
    console.error("❌ Fetch banned users error:", err.message);
    res.status(500).json({ error: "Gagal mengambil data user yang diblokir" });
  }
}); // <-- Kurung kurawal penutup untuk route handler

// Endpoint PATCH untuk unban user
app.patch("/api/users/:id/unban", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: user } = await axios.get(`${DB_URL}/users/${id}`);
    if (!user) return res.status(4404).json({ error: "User tidak ditemukan" });
    if (!user.banned) {
      return res.status(400).json({ error: "User ini tidak sedang diblokir." });
    }

    // Ubah banned jadi false, HAPUS bannedAt
    // Gunakan delete untuk menghapus properti bannedAt jika ada
    const updatedUserData = { banned: false };
    delete user.bannedAt; // Hapus properti bannedAt jika ada
    
    await axios.patch(`${DB_URL}/users/${id}`, updatedUserData);

    const { data: updatedUserResponse } = await axios.get(`${DB_URL}/users/${id}`); // Ambil data terbaru

    io.emit("userUpdate", { id, unbanned: true }); // Kirim update ke admin
    console.log(`✅ [Server] User ${id} di-unban via endpoint.`);
    res.json({ success: true, user: updatedUserResponse }); // Kirim data user terbaru
  } catch (err) {
    console.error("❌ Unban error:", err.message);
    res.status(500).json({ error: "Gagal membuka blokir user" });
  }
});

// Endpoint untuk membersihkan file media yang tidak terpakai
app.post("/api/media/cleanup", async (_, res) => {
  try {
    const { data: properties } = await axios.get(`${DB_URL}/properties`);
    // Kumpulkan semua nama file media yang MASIH digunakan
    const usedFiles = new Set(properties.flatMap((p) => p.media || []));
    // Baca semua file yang ADA di folder media
    const allFiles = fs.readdirSync(mediaDir);

    let deletedCount = 0;
    allFiles.forEach((file) => {
      // Jika file di folder TIDAK ADA dalam daftar yang digunakan
      if (!usedFiles.has(file)) {
        fs.unlinkSync(path.join(mediaDir, file)); // Hapus file fisik
        deletedCount++;
        console.log(`🧹 File media tidak terpakai dihapus: ${file}`);
      }
    });

    io.emit("mediaCleanup", { deletedCount, time: new Date() });
    res.json({ message: `${deletedCount} file tidak terpakai telah dihapus.` });
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
    res.status(500).json({ error: "Gagal membersihkan media" });
  }
});


// === 6. Jalankan Server ===
httpServer.listen(PORT, () => {
  console.log(`🚀 Backend aplikasi aktif di http://localhost:${PORT}`);
});

/* 
===========================================================
🗑️ DELETE property (tanpa hapus media)
===========================================================
*/
app.delete("/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: properties } = await axios.get(`${DB_URL}/properties`);
    const property = properties.find((p) => String(p.id) === String(id));
    if (!property) return res.status(404).json({ error: "Property not found" });

    // 🚫 Tidak hapus file media
    // Media akan dibersihkan otomatis oleh admin lewat endpoint /api/media/cleanup

    // ✅ Hapus data properti dari DB.json
    await axios.delete(`${DB_URL}/properties/${id}`);
    io.emit("update_property", { id, deleted: true });
    res.json({ success: true, deletedId: id, message: "Properti dihapus tanpa menghapus media." });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

