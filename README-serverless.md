# Infogarut Properti - Serverless Migration Guide

Proyek ini telah dimigrasikan dari backend tradisional (Express + json-server) ke arsitektur serverless menggunakan Vercel dan Supabase.

## Perubahan Utama

### 1. Database Migration
- **Dari**: json-server (file JSON lokal)
- **Ke**: Supabase (PostgreSQL cloud)
- **Script migrasi**: `migration-script.js`

### 2. Backend Refactoring
- **Dari**: Express server persistent
- **Ke**: Vercel API routes (serverless functions)
- **Lokasi**: Folder `api/`

### 3. File Storage
- **Dari**: File lokal dengan Multer
- **Ke**: Vercel Blob storage

### 4. Real-time Features
- **Dari**: Socket.IO
- **Ke**: Polling dengan interval

## Setup dan Deployment

### 1. Setup Supabase
1. Buat akun di [supabase.com](https://supabase.com)
2. Buat proyek baru
3. Buat tabel: `users`, `properties`, `notifications`
4. Copy URL dan anon key

### 2. Migrasi Data
```bash
# Install dependencies
npm install @supabase/supabase-js

# Edit migration-script.js dengan kredensial Supabase Anda
# Jalankan migrasi
node migration-script.js
```

### 3. Environment Variables
Buat file `.env.local` di root proyek:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy ke Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login dan deploy
vercel

# Set environment variables di dashboard Vercel
```

## API Endpoints Baru

### Users
- `GET /api/users` - Ambil semua users
- `POST /api/users` - Buat user baru
- `PATCH /api/users?id=xxx` - Update user

### Properties
- `GET /api/properties` - Ambil semua properti
- `POST /api/properties` - Buat properti baru
- `DELETE /api/properties?id=xxx` - Hapus properti
- `PATCH /api/properties?id=xxx` - Update properti

### Notifications
- `GET /api/notifications?userId=xxx` - Ambil notifikasi user
- `POST /api/notifications` - Buat notifikasi baru

### Upload
- `POST /api/upload` - Upload file ke Vercel Blob

### Admin
- `GET /api/banned-users` - Ambil users yang diblokir
- `PATCH /api/users/[id]/unban` - Buka blokir user
- `POST /api/admin/property-status` - Update status properti

### Media
- `POST /api/media/cleanup` - Bersihkan file tidak terpakai

## Frontend Changes

### Constants
- API_URL sekarang menggunakan `/api/` (relative path)
- Socket.IO diganti dengan polling

### Polling
- Gunakan `pollingUtils.js` untuk real-time updates
- Interval polling: 5 detik (dapat dikonfigurasi)

## Testing

1. Test login/register
2. Test upload properti
3. Test approval/rejection properti
4. Test notifikasi real-time
5. Test admin functions

## Troubleshooting

### Common Issues
1. **CORS errors**: Pastikan environment variables benar
2. **Upload gagal**: Cek Vercel Blob configuration
3. **Database errors**: Verifikasi Supabase credentials
4. **Polling tidak bekerja**: Cek network dan API endpoints

### Logs
- Cek Vercel dashboard untuk function logs
- Cek browser console untuk frontend errors
- Cek Supabase dashboard untuk database queries

## Performance Considerations

- **Cold starts**: Serverless functions mungkin lambat pertama kali
- **Rate limits**: Supabase dan Vercel punya batas request
- **File storage**: Vercel Blob punya batas ukuran file
- **Polling**: Lebih efisien dari WebSockets untuk aplikasi kecil

## Next Steps

1. Implementasi Pusher untuk real-time yang lebih efisien
2. Optimasi database queries
3. Add caching layer
4. Implementasi authentication JWT
5. Add rate limiting