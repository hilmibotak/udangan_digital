# ruangjanji

Platform undangan digital berbasis Next.js App Router, React, TypeScript, Tailwind CSS, Auth.js Credentials, MongoDB Atlas/Mongoose, Zod, dan Cloudinary.

## Menjalankan lokal

1. Gunakan Node.js 20.9 atau lebih baru.
2. Salin `.env.example` ke `.env.local`, lalu isi nilai konfigurasi lokal untuk database, Auth.js, dan Cloudinary. Jangan commit `.env.local` atau menyalin rahasianya ke browser.
3. Jalankan `npm install` lalu `npm run dev`.
4. Buka `http://localhost:3000`, daftar, masuk, dan buat draft undangan.
5. Tambahkan data mempelai, foto, acara, dan bagian lain dari dashboard. Preview draft tersedia untuk pemilik; URL publik hanya merender undangan berstatus published.

Database menggunakan nama `wedding_invitation`; konfigurasi koneksi yang sudah ada dipertahankan.

## Alur undangan

- `POST /api/invitations` membuat draft dengan slug unik. Slug manual yang sudah dipakai akan ditolak.
- `PATCH /api/invitations/[id]` menyimpan perubahan, status, template, dan slug dengan validasi ownership.
- `GET/POST /api/events`, `/api/gallery`, `/api/love-stories`, `/api/music`, `/api/gifts`, `/api/guests`, `/api/rsvp`, dan `/api/wishes` mengelola data per undangan.
- `PATCH/DELETE /api/manage/[resource]/[id]` mengedit atau menghapus item setelah memeriksa sesi pemilik dan relasinya.
- `POST /api/upload/image` menerima JPG, PNG, WEBP maksimal 5 MB; `POST /api/upload/audio` menerima MP3/WAV maksimal 10 MB. Konten file dan MIME diperiksa di server sebelum dikirim ke Cloudinary.
- `DELETE /api/upload/image` menghapus aset dari folder Cloudinary milik undangan tersebut.
- `POST /api/public/[slug]/rsvp` dan `/wishes` menerima kiriman tamu hanya untuk undangan terpublikasi. RSVP disimpan dan status tamu ikut diperbarui.
- `/undangan/[slug]` memuat data MongoDB, countdown, galeri/lighbox, hadiah, musik manual dengan percobaan putar setelah cover dibuka, RSVP, ucapan, metadata sosial, dan preview pribadi untuk draft.

## Pemeriksaan lokal

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Untuk uji alur, daftar/masuk, buat undangan dengan slug baru, lengkapi nama dan tanggal/acara, unggah foto dan audio di dashboard, tambahkan galeri/acara/hadiah/cerita/tamu, preview, lalu publikasikan. Buka URL undangan di jendela privat untuk memeriksa akses publik; kirim RSVP dan ucapan, lalu cek hasilnya di dashboard. Atur viewport browser ke 360, 375, 390, 414, 768, 1024, 1280, dan 1440 piksel untuk pemeriksaan responsif.

Cloudinary memerlukan pengaturan tiga variabel server-side yang disediakan di `.env.example`. Database Atlas dan konfigurasi lokal sudah tersedia pada lingkungan pengembangan ini. Uji upload end-to-end memerlukan akses Cloudinary yang valid.
