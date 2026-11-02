# LIKUIFAKSI v4 — Android camera overlay

Versi ini mengganti percobaan WebXR immersive-ar yang dapat macet pada perangkat tanpa dukungan ARCore/WebXR dengan mode kamera overlay. Browser meminta izin kamera biasa (`getUserMedia`) dan menampilkan video kamera belakang di bawah canvas Three.js transparan. Model 3D dapat digeser dengan jari.

## Penting
- Ini **bukan world-tracked/markerless AR**: model tidak terkunci ke lantai dan tidak mendeteksi bidang/ruang. Ini adalah visualisasi 3D overlay di atas kamera.
- Untuk AR markerless sejati dengan deteksi permukaan, perangkat/browser harus mendukung ARCore + WebXR `immersive-ar` + `hit-test`.
- Host harus HTTPS (atau localhost), gunakan Chrome Android, dan izinkan kamera.

## Deploy
Upload isi folder `likuifaksi-web` ke Netlify/Vercel. Pastikan `index.html`, `app.js`, dan `style.css` berada di root deploy.

## Penggunaan
1. Buka website di Chrome Android.
2. Tekan **Buka kamera + model 3D**.
3. Izinkan kamera.
4. Geser model 3D dengan jari untuk mengatur posisi pada layar.
5. Atur intensitas/frekuensi dan tekan **Mulai gempa**.
6. Tekan **Stop kamera** untuk menghentikan kamera.

Three.js diambil dari jsDelivr CDN sehingga memerlukan internet.
