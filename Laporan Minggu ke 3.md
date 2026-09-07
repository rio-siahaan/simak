## LAPORAN MINGGUAN AKTUALISASI

## Pengembangan SIMAK — Sistem Informasi dan Manajemen Administrasi Kegiatan

Minggu ke-3 (17 – 23 Agustus 2026)

## 2.2. Mengembangkan SIMAK Sesuai Rancangan yang Telah Disusun

| Nama | Rio Manuppak Siahaan, S.Tr.Stat. |
| --- | --- |
| Jabatan | Pranata Komputer Ahli |
| Unit Kerja | BPS Kabupaten Flores Timur — Tim IPDS & Tim Umum |
| Periode Tahapan | 17 – 23 Agustus 2026 (Minggu ke-3) |
| Output Kegiatan | 1 (satu) aplikasi SIMAK versi pengembangan dengan modul inti berfungsi |

## 1. Latar Belakang dan Tujuan Pengembangan

Berdasarkan rancangan alur kerja dan desain fitur yang telah disusun dan dikonsultasikan kepada mentor pada tahap sebelumnya (Kegiatan 2.1), penulis melanjutkan ke tahap pengembangan teknis. Kegiatan ini merupakan wujud nilai Akuntabel dalam melaksanakan rancangan yang telah disepakati secara bertanggung jawab, nilai Kompeten dalam menerapkan pengetahuan teknis pengembangan aplikasi berbasis web, serta nilai Kolaboratif dalam menyesuaikan implementasi dengan kebutuhan koordinasi lintas tim di BPS Kabupaten Flores Timur.

Pengembangan pada minggu ini difokuskan pada penerapan lima fitur inti yang telah dirancang — kalender bersama, task assignment, notifikasi, checklist bukti dukung, dan log progres — ke dalam aplikasi yang dapat diakses dan diuji secara nyata.

## 2. Penyesuaian Arsitektur Teknis terhadap Rancangan Awal

Selama proses pengembangan, penulis melakukan sejumlah penyesuaian teknis terhadap rancangan awal. Penyesuaian ini tetap mempertahankan seluruh esensi dan tujuan dari kelima fitur inti yang dirancang, namun mengubah cara implementasinya agar lebih efisien, mudah dipelihara, dan tidak bergantung pada banyak layanan eksternal sekaligus. Hal ini mencerminkan nilai Adaptif — menyesuaikan solusi teknis dengan kondisi dan sumber daya yang tersedia, tanpa mengubah tujuan awal rancangan.

| Elemen | Rancangan Awal | Implementasi Aktual | Alasan Penyesuaian |
| --- | --- | --- | --- |
| Kalender Bersama | Google Calendar sebagai sumber data, disinkronkan via Apps Script | Kalender internal (react-big- calendar) terhubung langsung ke basis data aplikasi | Menghindari ketergantungan pada kuota dan otentikasi API eksternal; data lebih konsisten dalam satu sumber kebenaran |
| Notifikasi | Google Apps Script sebagai pengirim notifikasi WhatsApp | Modul backend aplikasi terintegrasi langsung dengan API WhatsApp pihak ketiga (Fonnte) | Logika notifikasi, penyimpanan data, dan pencatatan log berada pada satu backend yang sama, memudahkan pemeliharaan |
| Checklist Bukti Dukung | Daftar item checklist per kegiatan yang dicentang aktor | Disederhanakan menjadi satu tautan (link) | Aktor tetap bebas menyusun dokumentasi pendukung sesuai |


| Elemen | Rancangan Awal | Implementasi Aktual | Alasan Penyesuaian |
| --- | --- | --- | --- |
|   |   | folder/dokumen Google Drive per kegiatan | kebutuhan kegiatan tanpa dibatasi struktur checklist yang kaku |
| Log Progres & Rekap | Rekap disinkronkan otomatis ke Google Sheets | Rekap diekspor langsung dari aplikasi dalam format Excel/PDF sesuai kebutuhan | Mengurangi satu titik ketergantungan eksternal (otorisasi Google Sheets API) tanpa mengurangi manfaat rekap bagi admin |

## 3. Fitur yang Telah Dikembangkan

Berikut status pengembangan kelima fitur inti serta modul pendukungnya per akhir minggu ke-3:

| No | Fitur | Status | Keterangan |
| --- | --- | --- | --- |
| 1 | Kalender Bersama Lintas Tim Selesai |   | Menampilkan seluruh kegiatan lintas tim dalam satu tampilan, dengan filter per tim dan tampilan bulan/minggu/hari/agenda. |
| 2 | Task Assignment (Pencatatan Aktor/PIC) | Selesai | Field nama aktor dan nomor WhatsApp aktor tersedia pada form Tambah/Edit Kegiatan, tersimpan pada setiap entri kegiatan. |
| 3 | Notifikasi WhatsApp Otomatis (saat kegiatan dibuat) | Selesai (versi dasar) | Terintegrasi dengan Fonnte; pesan terkirim otomatis ke aktor saat kegiatan disimpan, hasil pengiriman dicatat ke log notifikasi. |
| 4 | Pengingat Tenggat H-1 | Belum dikembangkan | Direncanakan pada minggu berikutnya, memakai mekanisme penjadwalan otomatis (cron) dengan logika pengiriman yang sama seperti notifikasi kegiatan baru. |
| 5 | Checklist / Tautan Bukti Dukung | Belum dikembangkan | Field tautan Google Drive pada form kegiatan sudah tersedia di skema data, tampilan input pada form masih dalam antrian pengembangan. |
| 6 | Validasi Tumpang Tindih Agenda | Belum dikembangkan | Direncanakan sebagai peringatan (warning) non- blocking saat admin menugaskan aktor yang sudah memiliki kegiatan lain pada tanggal sama. |
| 7 | Log Progres & Rekap Otomatis | Belum dikembangkan | Struktur data status kegiatan sudah tersedia; modul ekspor Excel/PDF direncanakan pada tahap akhir pengembangan. |

## 4. Implementasi Modul Notifikasi WhatsApp (Fonnte)

Sebagai capaian teknis utama minggu ini, penulis membangun modul pengiriman notifikasi WhatsApp otomatis yang terpicu setiap kali admin menyimpan kegiatan baru. Modul ini mencakup tiga bagian: (1) normalisasi format nomor WhatsApp aktor ke format baku 62xxx agar konsisten terkirim, (2) fungsi pengiriman pesan ke API Fonnte dengan penanganan kegagalan yang tidak mengganggu proses penyimpanan kegiatan, dan (3) pencatatan setiap hasil pengiriman (berhasil/gagal) ke dalam log notifikasi sebagai bahan audit dan dasar pengembangan fitur pengingat H-1 pada tahap berikutnya.


Pemilihan Fonnte sebagai penyedia API WhatsApp didasarkan pada ketersediaan kuota uji coba tanpa batas waktu untuk tahap pengembangan, dan kemudahan proses penyambungan akun. Perlu dicatat, layanan ini bersifat tidak resmi (unofficial, berbasis WhatsApp Web) sehingga digunakan melalui nomor WhatsApp dinas yang dipisahkan dari nomor pribadi, guna meminimalkan risiko operasional.

## 5. Kendala dan Catatan Teknis

- Layanan API WhatsApp pihak ketiga tidak memiliki jaminan tingkat layanan (SLA) resmi, sehingga koneksi berpotensi terputus sewaktu-waktu tanpa peringatan; perlu mekanisme pemantauan status koneksi pada pengembangan lanjutan.

- Kesalahan format nomor WhatsApp aktor merupakan penyebab paling umum kegagalan pengiriman; hal ini telah ditangani melalui normalisasi otomatis pada sisi sistem.

- Volume pengiriman notifikasi belum diuji pada skenario input kegiatan dalam jumlah besar/bersamaan; perlu antisipasi jeda pengiriman apabila pada tahap lanjutan tersedia fitur input kegiatan massal.

## 6. Keterkaitan dengan Nilai BerAKHLAK

## Akuntabel

Pengembangan dilaksanakan sesuai rancangan yang telah disusun dan dikonsultasikan sebelumnya, dengan setiap penyesuaian teknis didokumentasikan secara terbuka beserta alasannya, sebagai bentuk pertanggungjawaban atas keputusan teknis yang diambil secara mandiri.

## Kompeten

Penulis menerapkan pengetahuan pengembangan aplikasi web (basis data, antarmuka pemrograman/API pihak ketiga, logika backend) secara langsung untuk mewujudkan rancangan menjadi aplikasi yang berfungsi, sebagai bentuk peningkatan kompetensi sesuai tuntutan jabatan Pranata Komputer.

## Adaptif

Penyesuaian arsitektur dari rencana awal (Google Sites, Google Calendar, Apps Script) menjadi platform pengembangan yang lebih terintegrasi dilakukan tanpa mengubah tujuan dan manfaat inti aplikasi bagi organisasi, menunjukkan kemampuan beradaptasi terhadap kendala teknis yang ditemukan di lapangan.

## Kolaboratif

Field task assignment dan struktur tim pada kalender disusun berdasarkan struktur tim kerja aktual di BPS Kabupaten Flores Timur (IPDS, Statistik Sosial, Produksi, Distribusi, NWAS, PSS, Subbagian Umum, Humas), mencerminkan upaya membangun sistem yang benar-benar mendukung koordinasi lintas tim.

## 7. Output Kegiatan

Output dari tahapan ini adalah 1 (satu) aplikasi SIMAK versi pengembangan dengan modul Kalender Bersama, Task Assignment, dan Notifikasi WhatsApp otomatis (saat kegiatan dibuat) yang telah berfungsi dan siap diuji secara internal pada Kegiatan 2.3.

## 8. Catatan Terbuka / Perlu Konfirmasi

- Fitur Pengingat H-1, validasi tumpang tindih agenda, tautan bukti dukung, dan rekap otomatis masih dalam antrian pengembangan minggu berikutnya.


- Perlu ditentukan jadwal pemantauan rutin status koneksi akun WhatsApp dinas pada Fonnte, agar kegagalan notifikasi dapat terdeteksi lebih awal.


## 2.3. Melakukan Pengujian Internal (Self-Test) terhadap Fungsi Aplikasi

| Nama | Rio Manuppak Siahaan, S.Tr.Stat. |
| --- | --- |
| Jabatan | Pranata Komputer Ahli |
| Unit Kerja | BPS Kabupaten Flores Timur — Tim IPDS & Tim Umum |
| Periode Tahapan | 17 – 23 Agustus 2026 (Minggu ke-3) |
| Output Kegiatan | 1 (satu) laporan hasil pengujian internal (self-test) fungsi dasar SIMAK |

## 1. Latar Belakang dan Tujuan Pengujian

Setelah modul-modul inti SIMAK dikembangkan pada Kegiatan 2.2, penulis melakukan pengujian internal (self-test) secara mandiri untuk memastikan setiap fungsi berjalan sesuai rancangan sebelum digunakan lebih lanjut oleh admin dan aktor. Kegiatan ini merupakan wujud nilai Akuntabel — memastikan aplikasi teruji sebelum digunakan dalam proses kerja nyata — serta nilai Kompeten dalam menerapkan metode pengujian yang sistematis terhadap setiap fungsi yang dibangun.

## 2. Metode Pengujian

Pengujian dilakukan secara manual oleh penulis sendiri (self-test) terhadap setiap fungsi yang telah dikembangkan, dengan menyusun skenario uji berdasarkan alur proses bisnis yang telah dirancang pada Kegiatan 2.1. Setiap skenario diuji dengan membandingkan hasil yang diharapkan terhadap hasil aktual pada aplikasi, termasuk pengujian pada kondisi gagal (negative case) untuk memastikan sistem tetap stabil ketika terjadi kesalahan input atau kegagalan layanan eksternal.

## 3. Skenario dan Hasil Pengujian

|   | No Fungsi yang Diuji Skenario Uji |   | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| 1 | Kalender Bersama | Menambahkan kegiatan baru lengkap dengan tim, aktor, dan tenggat waktu | Kegiatan tampil pada kalender sesuai tanggal dan warna tim yang bersangkutan | Berhasil |
| 2 |   | Task Assignment Mengisi nama aktor dan nomor WhatsApp pada form Tambah Kegiatan | Data aktor tersimpan dan tampil pada detail kegiatan serta tabel Daftar Kegiatan | Berhasil |
| 3 | Notifikasi WhatsApp — pengiriman normal | Menyimpan kegiatan baru dengan nomor WhatsApp aktor uji (format 08xxx) yang valid | Nomor dinormalisasi ke format 62xxx, pesan diterima aktor berisi nama kegiatan, tim, dan tenggat waktu | Berhasil |
| 4 | Notifikasi WhatsApp — skenario gagal | Menyimpan kegiatan dengan nomor WhatsApp tidak valid/tidak aktif | Kegiatan tetap tersimpan; status pengiriman tercatat "gagal" pada log notifikasi beserta keterangannya | Berhasil |
| 5 | Pencatatan Log Notifikasi | Memeriksa tabel log setelah beberapa kali pengiriman (berhasil & gagal) | Setiap percobaan pengiriman tercatat lengkap dengan status dan waktu kirim | Berhasil |


|   | No Fungsi yang Diuji Skenario Uji |   | Hasil yang Diharapkan | Status |
| --- | --- | --- | --- | --- |
| 6 | Manajemen Pengguna | Menambah, mengubah, dan menghapus data pengguna/aktor | Perubahan data tersimpan dan langsung tersedia sebagai pilihan aktor pada form kegiatan | Berhasil |
| 7 | Dashboard Admin | Membuka halaman dashboard setelah beberapa kegiatan diinput | Statistik jumlah kegiatan dan aktivitas terbaru tampil sesuai data terkini | Berhasil |

## 4. Temuan dan Tindak Lanjut

|   | No Temuan | Tindak Lanjut | Prioritas |
| --- | --- | --- | --- |
| 1 | Belum ada peringatan saat aktor ditugaskan pada dua kegiatan dengan tanggal yang tumpang tindih | Membangun validasi peringatan (warning) non-blocking pada form Tambah/Edit Kegiatan | Tinggi |
| 2 | Koneksi akun WhatsApp dinas pada Fonnte berpotensi terputus tanpa peringatan otomatis ke admin | Menyusun mekanisme pemeriksaan status koneksi secara berkala pada tahap pengembangan lanjutan | Sedang |
| 3 | Field tautan Google Drive bukti dukung belum tersedia pada form kegiatan | Menambahkan input tautan Drive beserta validasi format URL pada minggu berikutnya | Tinggi |
| 4 | Rekap laporan pada halaman Laporan masih menggunakan data contoh (belum data aktual) | Menghubungkan halaman Laporan ke data aktual dan menambahkan fungsi ekspor Excel/PDF | Sedang |

## 5. Keterkaitan dengan Nilai BerAKHLAK

## Akuntabel

Pengujian dilakukan secara menyeluruh terhadap setiap fungsi sebelum dinyatakan selesai, termasuk pada skenario kegagalan, sebagai bentuk tanggung jawab agar aplikasi yang diserahkan kepada pengguna benar-benar dapat diandalkan.

## Kompeten

Penyusunan skenario uji yang mencakup kondisi normal maupun kondisi gagal menunjukkan penerapan metode pengujian perangkat lunak secara sistematis, sebagai bagian dari peningkatan kapasitas diri di bidang pengembangan sistem informasi.

## Berorientasi Pelayanan

Pengujian menekankan pada keandalan notifikasi kepada aktor, karena keterlambatan atau kegagalan notifikasi berdampak langsung pada kualitas layanan koordinasi lintas tim yang menjadi tujuan utama SIMAK.

## 6. Output Kegiatan

Output dari tahapan ini adalah 1 (satu) laporan hasil pengujian internal (self-test) terhadap fungsi dasar SIMAK — kalender bersama, task assignment, notifikasi WhatsApp, manajemen pengguna, dan dashboard


admin — beserta daftar temuan dan rencana tindak lanjut untuk pengembangan fitur pada tahap berikutnya.

## 7. Catatan Terbuka / Perlu Konfirmasi

- Dokumentasi bukti pengujian (tangkapan layar dan log pengiriman notifikasi) akan dilampirkan terpisah sebagai lampiran pendukung laporan ini.

- Empat temuan pada Bagian 4 akan menjadi dasar penyusunan prioritas pengembangan pada laporan minggu berikutnya.
