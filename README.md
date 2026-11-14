# Lembar Kerja Aslab

Website latihan untuk Tes MS Office & Design rekrutmen Asisten Laboratorium Informatika (IFLAB) Telkom University, Sabtu 14 November 2026.

Prinsipnya: soal dikerjakan di **Excel 365 / Excel 2024 / Excel for the web**, bukan di simulator browser. Website membuat workbook latihan, lalu membaca kembali file yang sudah kamu kerjakan: nilai hasil (cached value) dan teks rumusnya.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil statis di dist/, bisa dibuka offline atau di-deploy
npm run preview
```

`vite.config.ts` memakai `base: './'`, jadi `dist/` bisa langsung diunggah ke GitHub Pages (subfolder) atau Vercel tanpa konfigurasi tambahan. Font dibundel lokal, tidak ada request ke CDN.

> **Data pribadi.** `data-src/` dan `src/data/datasets.json` berisi nama dan NIM asli dari CSV asprak. Jangan deploy ke hosting publik sebelum data itu diganti atau dianonimkan.

## Struktur

```
data-src/                 CSV asli (Link Penting, Presensi Asprak Belum Nilai)
scripts/build-data.mjs    CSV -> src/data/datasets.json (bersih, kotor, sintetis; seed tetap)
scripts/verify/           verifikasi kunci jawaban dengan Excel asli
src/data/                 dataset + helper
src/content/levelN.ts     materi, soal Excel, dan kuis per level (data, terpisah dari komponen)
src/lib/xlsxWrite.ts      membuat workbook latihan (ExcelJS, dimuat saat tombol unduh ditekan)
src/lib/xlsxRead.ts       membaca .xlsx langsung dari XML (JSZip + xmldom): rumus <f> dan nilai <v>
src/lib/grader.ts         penilaian: nilai, fungsi wajib/terlarang, struktur (Table, Name)
src/lib/store.ts          progres di localStorage (try/catch), spaced repetition
src/components/visual/    peraga konsep: lookup, OFFSET, spill, REDUCE/SCAN (simulasi contoh, bukan engine formula)
src/content/wordTargets.ts  4 dokumen target Word + rubrik (fungsi uji atas hasil pembaca .docx)
src/content/level6.ts     materi desain, 6 brief, kuis
src/lib/docxCheck.ts      pembaca struktur .docx (JSZip + xmldom): heading, list, section, TOC, caption, dll.
src/lib/report.ts         rapor per bab dari hasil workbook
src/pages/Simulasi.tsx    simulasi tes 120 menit (Excel, kuis, Word, desain)
src/pages/Cheatsheet.tsx  cheat sheet otomatis dari sintaks materi, siap cetak
scripts/word/             membuat PDF target dan menguji pemeriksa .docx dengan Word asli
public/word/              PDF target hasil scripts/word
```

## Cara materi ditulis

Setiap topik tampil sendiri dalam satu layar (daftar topik di kiri, tombol "Sudah paham, lanjut" di bawah). Urutannya selalu: **Intinya** (satu-dua kalimat), penjelasan pendek, peraga kalau ada, cara menulis, satu contoh (contoh lain dilipat), lalu jebakan dan tips (dilipat). Bahasa sengaja sederhana untuk pemula. Topik "Fitur yang sering dipakai tanpa rumus" dan beberapa shortcut di Level 0 disarikan (bukan disalin) dari buku *Excel Bible for Beginners* yang diberikan pengguna.

## Dataset di workbook

| Sheet | Isi |
|---|---|
| Asprak | 50 asprak (NO, NIM, NAMA, KODE) |
| Aslab | 8 kode aslab |
| Kelas | 18 kelas. HARI/JAM/RUANG sintetis |
| Modul | Materi modul 1 sampai 16 |
| Presensi | Presensi asprak versi bersih + tanda "V" modul 1-8 (sintetis) |
| PresensiKotor | Versi asli: KELAS hanya di baris pertama tiap kelas, kolom REF teks seperti `$C$2` |
| AsprakKotor | Spasi berlebih, huruf campur, NIM teks, 2 baris dobel |
| Praktikan | 40 praktikan fiktif, nilai M1-M8 (ada yang kosong) |
| Inventaris | 30 PC lab fiktif |
| Grade, Bobot | Tabel acuan (vertikal dan horizontal) |

Header selalu di baris 1, data mulai baris 2.

## Penilaian workbook

Status per soal:

- **Benar**: nilai sama dengan kunci, rumus memakai fungsi yang diminta.
- **Nilai salah**: hasil rumus beda dengan kunci.
- **Diketik manual**: nilai benar tapi bukan rumus.
- **Fungsi tidak sesuai**: hasil benar, tapi fungsi wajib tidak dipakai atau fungsi terlarang dipakai (mis. VLOOKUP di soal XLOOKUP).
- **Struktur belum ada**: Table/Named Range yang diminta tidak ditemukan.
- **Nilai belum tersimpan**: ada rumus tapi tidak ada cached value. Ini terjadi kalau file belum pernah dibuka dan disimpan Excel. Pesan menyuruh buka di Excel lalu Ctrl+S.
- **Belum dijawab**.

Baris soal dicari lewat ID di kolom B, jadi tetap aman kalau pengguna menyisipkan baris. Awalan file seperti `_xlfn.`, `_xlws.`, `_xlpm.`, dan `_xlfn.ANCHORARRAY(A1)` dinormalisasi jadi `A1#`. Ada juga mode cadangan tempel nilai manual (fungsi tidak bisa dicek).

## Verifikasi kunci jawaban

Butuh Windows + Excel desktop (COM).

```bash
npm run verify
```

1. `verify:export` menulis workbook tiap level ke `verify-out/` beserta daftar rumus kunci.
2. `verify:excel` membuka workbook di Excel asli, membuat Table/Name yang diminta soal, memasukkan **setiap** rumus kunci, membaca hasilnya, lalu menyimpan file `levelN.filled.xlsx` berisi campuran jawaban benar, ketik manual, salah, kosong, dan rumus alternatif.
3. `verify:check` memastikan:
   - setiap rumus kunci, dihitung Excel, sama dengan kunci hasil kode;
   - rumus kunci pertama lolos cek fungsi soalnya (alternatif yang sengaja tidak lolos diberi catatan);
   - file filled dinilai dengan status yang tepat;
   - file yang rumusnya ditulis library tanpa dibuka Excel terdeteksi sebagai "nilai belum tersimpan".

Hasil terakhir (Excel 365 build 20527): semua lolos.

| Level | Soal | Rumus kunci diuji |
|---|---|---|
| 0 Fondasi | 17 | 34 |
| 1 Lookup | 22 | 45 |
| 2 Referensi dinamis | 16 | 32 |
| 3 Array | 22 | 44 |
| 4 LET/LAMBDA | 21 | 42 |

Catatan: `Names.Add` lewat COM menolak LAMBDA, jadi skrip membuat nama dulu lalu mengisi `RefersTo`. ARRAYTOTEXT tidak dipakai di kunci karena pemisahnya ikut regional (`;` di Windows Indonesia).

### Verifikasi Word

```bash
npm run verify:word
```

1. `scripts/word/build.ts` membuat 4 dokumen target dengan library `docx`.
2. `scripts/word/word.ps1` membuka masing-masing di Word asli (satu instance per file, dengan batas waktu), memperbarui daftar isi, daftar gambar, dan field, menyimpan `.docx`, dan mengekspor PDF ke `public/word/`. Skrip juga membuat dokumen "berantakan" langsung di Word: judul hanya ditebalkan, Enter berderet, nomor diketik, spasi untuk merapikan.
3. `scripts/word/check.ts` memastikan keempat target lolos 100% rubriknya tanpa peringatan, dan dokumen berantakan gagal di sebagian besar rubrik serta memunculkan peringatan yang tepat.

Hasil terakhir: modul 11/11, surat 7/7, laporan 14/14, tata tertib 7/7; dokumen berantakan 1/11 dengan 4 peringatan.

## Menambah soal

Tambahkan objek ke array `questions` di `src/content/levelN.ts`:

```ts
{
  id: 'L1-23',                // unik, dipakai di workbook kolom B
  tier: 'sedang',             // mudah | sedang | sulit
  topic: 'XLOOKUP',           // untuk laporan bab lemah
  title: 'Judul pendek',
  prompt: 'Teks soal. Markup: `kode`, **tebal**, {{=RUMUS}}',
  expected: () => ...,        // HITUNG dari dataset, jangan diketik
  fns: { all: ['XLOOKUP'], anyOf: [['INDEX','MATCH']], forbid: ['VLOOKUP'], contains: ['TblPC['] },
  structure: { table: 'TblPC' },             // opsional
  setup: { table: { name, sheet, range } },  // opsional, dipakai skrip verifikasi
  keys: [{ formula: '=...' }, { formula: '=...', note: 'cara lain' }],
  steps: ['langkah 1', 'langkah 2'],
}
```

Lalu jalankan `npm run verify`. Kuis ada di array `quiz` (pilihan ganda `mcq` atau `isian` dengan mode `text`/`number`/`formula`).

## Cakupan kisi-kisi

| Kisi-kisi | Fungsi | Status |
|---|---|---|
| Data Lookup | VLOOKUP, XLOOKUP, INDEX, MATCH | [x] Level 1 |
| Cell Reference & Navigation | OFFSET, ADDRESS, INDIRECT | [x] Level 2 |
| Array Manipulation | FILTER, CHOOSECOLS, VSTACK | [x] Level 3 |
| Advanced Logic | LAMBDA, MAP, BYROW, REDUCE | [x] Level 4 |
| Design | Digital Visual Design | [x] Level 6 |
| Tambahan | MS Word PDF ke .docx | [x] Level 5 |

Materi pendukung: referensi relatif/absolut/campuran, operator, IF/IFS/AND/OR/IFERROR/IFNA, COUNTIF(S)/SUMIF(S)/AVERAGEIF(S), fungsi teks (TRIM, PROPER, LEN, LEFT/MID/RIGHT, FIND/SEARCH, SUBSTITUTE, TEXT, TEXTJOIN, TEXTSPLIT), Excel Table + structured reference, Named Range, semua pesan error, HLOOKUP, XMATCH, ROW/COLUMN/ROWS/COLUMNS, range dinamis, fungsi volatile, dropdown bertingkat, spill dan operator `#`, SORT, SORTBY, UNIQUE, CHOOSEROWS, HSTACK, TAKE, DROP, TOCOL, TOROW, SEQUENCE, LET, LAMBDA bernama di Name Manager, ISOMITTED, MAP dua array, BYCOL, SCAN, MAKEARRAY, fitur non-rumus (Paste Special, Flash Fill, Text to Columns, Freeze Panes, Conditional Formatting).

Soal wajib Level 4 dari spesifikasi: SCAN isi ke bawah (L4-12), BYROW hitung modul (L4-08), LAMBDA bernama (L4-16), REDUCE + VSTACK (L4-17), MAP dua array (L4-09).

## Fitur lain

- **Latihan Word**: 4 PDF target (modul, surat, laporan, tata tertib) dengan rubrik otomatis, plus "periksa dokumen apa saja". File dibaca di browser, tidak dikirim ke mana pun.
- **Latihan desain**: 6 brief dengan timer dan ceklis; hasil ekspor PNG/JPG dicek ukurannya. Latihan "perbaiki desain jelek": klik 7 kesalahan di poster, lalu bandingkan dengan versi yang sudah dibetulkan.
- **Simulasi tes**: 120 menit, 12 soal Excel acak dari Level 0-4 dalam satu workbook, 15 soal kuis, satu target Word, satu brief desain. Sesi tetap berjalan walaupun halaman ditutup.
- **Rapor belajar**: akurasi per bab, bab di bawah 70% ditandai dengan tautan ke soalnya.
- **Cheat sheet**: dibuat otomatis dari sintaks materi, tata letak dua kolom saat dicetak.
