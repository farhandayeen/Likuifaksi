# LIKUIFAKSI — Web AR Learning Prototype v2

Media pembelajaran berbasis web untuk siswa SMP tentang getaran, gelombang gempa, tekanan air pori, tegangan efektif, dan fenomena likuifaksi. Dioptimalkan untuk Android dan penggunaan online.

## Menjalankan secara lokal

Karena menggunakan ES Modules, kamera, dan WebXR, jalankan melalui server lokal atau hosting HTTPS (jangan membuka `index.html` langsung sebagai `file://`).

```bash
python -m http.server 8000
```

Buka `http://localhost:8000` untuk mode 3D. Untuk AR markerless, deploy ke hosting HTTPS dan buka dari Android yang mendukung WebXR `immersive-ar`, hit-test, serta ARCore (dukungan berbeda menurut perangkat dan browser). Berikan izin kamera ketika diminta.

## Deploy online

Unggah seluruh isi folder `likuifaksi-web` ke layanan hosting statis yang menyediakan HTTPS, misalnya GitHub Pages, Netlify, atau Vercel. Pastikan `index.html`, `style.css`, dan `app.js` berada pada direktori publik yang sama. Prototype memuat Three.js dari jsDelivr CDN, sehingga koneksi internet diperlukan.

## Teknologi
- HTML, CSS, JavaScript (ES modules)
- Three.js 0.166.1 dari jsDelivr CDN
- OrbitControls untuk interaksi model 3D dengan sentuhan/drag
- WebXR Device API, ARButton, dan hit-test untuk penempatan markerless

## Pembaruan v2
- Mode 3D mendukung rotasi dan zoom dengan sentuhan.
- Ukuran model diperkecil saat ditempatkan pada permukaan AR.
- Pilihan kondisi tanah: pasir lepas jenuh air, pasir padat jenuh air, dan pasir kering.
- Panel edukasi menampilkan indeks tekanan air pori dan tegangan efektif relatif.
- Penjelasan tahap simulasi diperbarui berdasarkan kondisi tanah.
- Materi menerangkan hubungan tegangan efektif: `σ′ = σ − u`.

## Batasan ilmiah dan teknis yang harus dipahami
- Indeks tekanan air pori dan tegangan efektif pada layar adalah indikator konseptual untuk pembelajaran, bukan hasil pengukuran lapangan atau hasil perhitungan geoteknik tervalidasi.
- Intensitas 1–10 dan frekuensi 0,5–5 Hz adalah kontrol demonstrasi visual; belum dikalibrasi ke percepatan tanah, magnitudo gempa, atau rekaman gerakan tanah tertentu.
- Animasi deformasi bangunan/tanah bukan prediksi kerusakan. Prototype bukan alat mitigasi, desain struktur, atau prediksi bencana.
- AR markerless memerlukan HTTPS, dukungan browser/perangkat untuk WebXR AR, ARCore/layanan AR yang sesuai, dan izin kamera. Jika tidak tersedia, gunakan mode 3D.
- Model visual masih berupa prototipe geometri 3D. Model tanah/bangunan realistis, suara, narasi, penyimpanan hasil kuis, dan aksesibilitas dapat ditambahkan pada tahap lanjutan.

## Tujuan pembelajaran
Siswa dapat menjelaskan bahwa getaran siklik pada pasir lepas yang jenuh air dapat meningkatkan tekanan air pori. Peningkatan tekanan air pori dapat mengurangi tegangan efektif dan menyebabkan penurunan kekuatan tanah. Likuifaksi tidak otomatis terjadi pada semua tanah atau setiap gempa; kondisi tanah dan karakteristik guncangan sangat berpengaruh.
