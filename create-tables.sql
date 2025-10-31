-- Script SQL untuk membuat tabel di Supabase
-- Jalankan di SQL Editor di Supabase Dashboard

-- Tabel users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  no_hp TEXT,
  role TEXT DEFAULT 'user',
  kecamatan TEXT,
  desa TEXT,
  alamat TEXT,
  "joinedAt" TEXT,
  verified BOOLEAN DEFAULT false,
  "suspendedUntil" TEXT,
  banned BOOLEAN DEFAULT false,
  "bannedAt" TEXT
);

-- Tabel properties
CREATE TABLE properties (
  id TEXT PRIMARY KEY,
  "namaProperti" TEXT NOT NULL,
  "jenisProperti" TEXT NOT NULL,
  "tipeProperti" TEXT NOT NULL,
  lokasi TEXT,
  kecamatan TEXT,
  desa TEXT,
  harga BIGINT,
  "luasTanah" INTEGER,
  "luasBangunan" INTEGER,
  "kamarTidur" INTEGER,
  "kamarMandi" INTEGER,
  "periodeAngka" TEXT,
  "periodeSatuan" TEXT,
  deskripsi TEXT,
  media JSONB,
  "ownerId" TEXT REFERENCES users(id),
  "statusPostingan" TEXT DEFAULT 'pending',
  "postedAt" TEXT,
  koordinat JSONB,
  "periodeSewa" TEXT,
  "userId" TEXT
);

-- Tabel notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id),
  text TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TEXT NOT NULL,
  link TEXT
);