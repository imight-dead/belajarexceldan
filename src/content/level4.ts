import { avg, col, round, rows, sum } from '../data/ds'
import { gradeOf } from './helpers'
import type { Concept, ExcelQuestion, Level, QuizQ } from './types'

const inv = rows('Inventaris')
const prak = rows('Praktikan')
const asp = rows('Asprak')
const pres = rows('Presensi')
const M = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'] as const
const marks = (r: Record<string, unknown>) => Array.from({ length: 16 }, (_, i) => r[`Modul ${i + 1}`] === 'V')
const avgOf = (r: Record<string, unknown>) => avg(M.map((m) => r[m] as number))
const avgHarga = (ruang: string) => avg(inv.filter((r) => r.RUANG === ruang).map((r) => r.HARGA))

// ------------------------------------------------------------------ MATERI
const concepts: Concept[] = [
  {
    id: 'let',
    title: 'LET: buat variabel / catatan kecil di dalam rumus',
    intro: 'LET itu seperti menulis hasil hitungan di kertas coretan dan memberinya nama pendek (misalnya "r"), supaya tidak perlu mengetik ulang rumus panjang berkali-kali.',
    body: [
      'Bayangkan kamu harus menulis `AVERAGE(Praktikan!E7:L7)` sampai berkali-kali di dalam satu rumus `IF`. Selain bikin jari keriting dan mata pusing, Excel juga jadi bekerja lambat karena menghitung rata-rata yang sama berulang kali.',
      'Dengan **LET**, kamu cukup menghitungnya **satu kali**, menyimpannya ke dalam nama singkat (misalnya `r`), lalu tinggal memanggil huruf `r` di bagian rumus berikutnya!',
      '**Aturan mainnya selalu berpasangan:** `nama1, isi_nama1, nama2, isi_nama2, ...` lalu ditutup dengan **rumus hasil akhirnya** di paling belakang.',
    ],
    syntax: [
      {
        formula: 'LET(nama1, nilai1, [nama2, nilai2, ...], hasil_akhir)',
        args: [
          { name: 'nama1', desc: 'Nama variabel bebas (misalnya r, total, atau rata). Jangan pakai nama yang mirip alamat sel seperti A1 atau C2.' },
          { name: 'nilai1', desc: 'Angka atau rumus yang hasilnya mau disimpan ke dalam nama1.' },
          { name: 'nama2, nilai2', desc: 'Boleh membuat variabel kedua, ketiga, dst. Variabel baru boleh memakai variabel sebelumnya!', optional: true },
          { name: 'hasil_akhir', desc: 'Argumen paling terakhir: rumus utama yang menggunakan nama-nama variabel tadi.' },
        ],
      },
    ],
    examples: [
      {
        formula: '=LET(r,AVERAGE(Praktikan!E7:L7),XLOOKUP(r,Grade!A2:A8,Grade!B2:B8,,-1))',
        result: gradeOf(avgOf(prak[5])),
        note: 'Hitung rata-rata sekali saja, simpan di variabel r, lalu masukkan r ke XLOOKUP.',
      },
      {
        formula: '=LET(a,AVERAGEIF(Inventaris!B2:B31,"LAB A",Inventaris!H2:H31),b,AVERAGEIF(Inventaris!B2:B31,"LAB B",Inventaris!H2:H31),a-b)',
        result: String(round(avgHarga('LAB A') - avgHarga('LAB B'), 2)),
        note: 'Simpan rata-rata LAB A di variabel a, rata-rata LAB B di variabel b, lalu kurangkan a - b.',
      },
    ],
    mistakes: ['Lupa menulis rumus hasil akhir di argumen paling belakang (misalnya cuma `LET(a, 5)`), sehingga error.', 'Memakai nama variabel yang bentrok dengan koordinat sel Excel seperti `x1` atau `B2`.'],
    practice: ['L4-01', 'L4-10'],
  },
  {
    id: 'lambda',
    title: 'LAMBDA: meracik resep fungsi buatanmu sendiri',
    intro: 'LAMBDA itu seperti menulis resep masakan: kamu tentukan apa bahan bakunya (input), lalu bagaimana cara mengolahnya (rumus).',
    body: [
      'Misalnya kamu sering menghitung *"harga ditambah pajak PPN 11%"*. Kalau dijadikan resep **LAMBDA**, bahan bakunya kita beri nama `x`, dan cara mengolahnya adalah `x * 1.11`. Maka jadilah: {{=LAMBDA(x, x*1.11)}}.',
      '**Kenapa kalau diketik `=LAMBDA(x, x*1.11)` saja malah muncul `#CALC!`?** Karena itu baru kertas resepnya, belum dikasih bahan bakunya! Untuk langsung memasaknya di sel, taruh angka/sel bahannya di dalam kurung tepat di belakangnya: {{=LAMBDA(x, x*1.11)(100)}} → hasilnya `111`.',
      '**Kenapa LAMBDA wajib banget dikuasai?** Karena LAMBDA adalah **"mesin penggerak"** untuk fungsi-fungsi level lanjut di kisi-kisi: **MAP**, **BYROW**, dan **REDUCE**! Ketiga fungsi itu butuh resep LAMBDA untuk bekerja.',
    ],
    syntax: [
      {
        formula: 'LAMBDA(input1, [input2, ...], rumus_olahan)',
        args: [
          { name: 'input1', desc: 'Nama bahan baku pertama (bebas, misalnya x, n, atau baris).' },
          { name: 'input2', desc: 'Nama bahan baku kedua kalau resepmu butuh lebih dari satu input.', optional: true },
          { name: 'rumus_olahan', desc: 'Argumen paling belakang: rumus perhitungan yang mengolah input tadi.' },
        ],
      },
    ],
    examples: [
      { formula: '=LAMBDA(x,x*1.11)(Inventaris!H2)', result: String(round((inv[0].HARGA as number) * 1.11, 2)), note: 'Resep tambah 11% langsung dipanggil dengan bahan baku sel Inventaris!H2.' },
      { formula: '=LAMBDA(a,b,a+b)(3,4)', result: '7', note: 'Resep dengan dua bahan baku (a dan b), dipanggil dengan angka (3, 4).' },
    ],
    mistakes: ['Mengetik LAMBDA di sel tanpa memberi kurung berisi nilai input di belakangnya, sehingga muncul `#CALC!`.', 'Jumlah nilai yang dimasukkan saat memanggil tidak sesuai dengan jumlah input di resepnya (`#VALUE!`).'],
    practice: ['L4-02', 'L4-22'],
  },
  {
    id: 'lambda-nama',
    title: 'Simpan LAMBDA di Name Manager',
    intro: 'LAMBDA yang disimpan di Name Manager bisa dipanggil seperti fungsi bawaan Excel, misalnya =RATAMODUL(E2:L2).',
    body: [
      '**Langkah 1.** Tekan **Ctrl+F3** untuk membuka Name Manager, lalu klik **New**.',
      '**Langkah 2.** Isi **Name** dengan nama fungsi, misalnya `RATAMODUL`. Tanpa spasi.',
      '**Langkah 3.** Isi **Refers to** dengan LAMBDA-nya, tanpa input di belakang: `=LAMBDA(baris,ROUND(AVERAGE(baris),2))`. Klik OK.',
      '**Langkah 4.** Sekarang di sel mana pun kamu bisa menulis {{=RATAMODUL(Praktikan!E2:L2)}}.',
      'Input bisa dibuat **boleh dikosongkan** dengan tanda kurung siku, misalnya `[d]`. Di dalam rumus, cek dengan **ISOMITTED(d)** apakah input itu diisi atau tidak.',
    ],
    examples: [
      { formula: '=RATAMODUL(Praktikan!E12:L12)', result: String(round(avgOf(prak[10]), 2)), note: 'Setelah RATAMODUL dibuat di Name Manager.' },
      {
        formula: '=LAMBDA(x,[d],ROUND(x,IF(ISOMITTED(d),0,d)))(1234.567)',
        result: '1235',
        note: 'd tidak diisi, jadi dibulatkan 0 desimal. Kalau dipanggil dengan (1234.567,2) hasilnya 1234.57.',
      },
    ],
    mistakes: ['Menulis input di belakang LAMBDA saat menyimpan di Name Manager. Yang disimpan harus fungsinya saja.', 'Nama fungsi sama dengan fungsi bawaan, misalnya `SUM`. Excel menolaknya.'],
    practice: ['L4-16', 'L4-18'],
  },
  {
    id: 'map',
    title: 'MAP: terapkan resep LAMBDA ke tiap sel satu per satu',
    intro: 'MAP itu seperti ban berjalan di pabrik: dia mengambil isi sel satu per satu, memasukkannya ke resep LAMBDA, lalu menyusun hasilnya.',
    body: [
      'Kalau kamu memberi blok berisi 30 sel ke **MAP**, maka MAP akan menjalankan resep LAMBDA-mu sebanyak **30 kali** (satu kali untuk setiap sel).',
      '**Bisa mengolah 2 atau lebih kolom sekaligus!** Misalnya kamu ingin memeriksa kolom `RAM` dan kolom `STORAGE` secara bersamaan per baris. Cukup masukkan kedua kolom itu ke dalam MAP, lalu buat LAMBDA dengan **2 input** (`LAMBDA(r, s, ...)`).',
      '**Kelebihan spesial MAP:** Karena di dalam LAMBDA-nya `r` dan `s` dipegang satu sel demi satu sel, kamu **bisa memakai fungsi `AND(...)` dan `OR(...)` secara normal**! (Ingat: kalau pakai `AND` untuk menghasilkan angka `1` atau `0`, tambahkan tanda strip ganda `--AND(...)`).',
    ],
    syntax: [
      {
        formula: 'MAP(range1, [range2, ...], LAMBDA(x1, [x2, ...], rumus))',
        args: [
          { name: 'range1', desc: 'Blok sel pertama yang mau dikerjakan satu per satu.' },
          { name: 'range2', desc: 'Blok sel kedua (ukurannya wajib sama persis dengan range1).', optional: true },
          { name: 'LAMBDA', desc: 'Resep olahannya. Jumlah variabel inputnya harus sama dengan jumlah range yang dimasukkan.' },
        ],
      },
    ],
    examples: [
      { formula: '=SUM(MAP(Asprak!C2:C51,LAMBDA(n,LEN(n))))', result: String(sum(asp.map((r) => String(r.NAMA).length))), note: 'Menghitung panjang huruf tiap nama satu per satu, lalu dijumlahkan.' },
      {
        formula: '=SUM(MAP(Inventaris!D2:D31,Inventaris!E2:E31,LAMBDA(r,s,--AND(r>=16,s>=512))))',
        result: String(inv.filter((r) => (r.RAM as number) >= 16 && (r.STORAGE as number) >= 512).length),
        note: 'Memeriksa 2 kolom (RAM dan STORAGE) baris demi baris dengan AND.',
      },
    ],
    mistakes: ['Ukuran `range1` dan `range2` tidak sama panjang, sehingga muncul `#VALUE!`.', 'Memasukkan 2 range ke MAP tapi hanya menulis 1 variabel input di dalam LAMBDA.'],
    practice: ['L4-04', 'L4-09', 'L4-19', 'L4-23'],
  },
  {
    id: 'byrow',
    title: 'BYROW dan BYCOL: olah satu baris utuh atau satu kolom utuh sekaligus',
    intro: 'Kalau MAP menyuapi LAMBDA satu sel demi satu sel, BYROW menyuapi LAMBDA satu baris penuh sekaligus (misalnya 8 nilai modul milik 1 mahasiswa)!',
    body: [
      'Bayangkan tabel nilai `Praktikan` punya 40 mahasiswa (baris), dan tiap mahasiswa punya 8 nilai modul (`M1` sampai `M8`) dari kiri ke kanan. Kalau kamu ingin menghitung **rata-rata per mahasiswa**, kamu tidak bisa pakai `AVERAGE(E2:L41)` karena itu malah merata-rata seluruh kelas jadi 1 angka!',
      'Di sinilah **BYROW** menjadi pahlawan: dia memotong tabelmu baris demi baris, menyerahkan 1 baris utuh (`r`) ke LAMBDA, lalu menghitung `AVERAGE(r)` untuk masing-masing baris.',
      '• **BYROW(tabel, LAMBDA(baris, rumus))** = menghasilkan 1 nilai rekap untuk setiap **baris**.',
      '• **BYCOL(tabel, LAMBDA(kolom, rumus))** = menghasilkan 1 nilai rekap untuk setiap **kolom**.',
    ],
    syntax: [
      {
        formula: 'BYROW(tabel, LAMBDA(baris, rumus_ringkasan))',
        args: [
          { name: 'tabel', desc: 'Range tabel banyak baris x banyak kolom yang mau direkap per baris.' },
          { name: 'LAMBDA', desc: 'Menerima 1 variabel (mewakili 1 baris penuh) dan WAJIB menghasilkan 1 angka/teks ringkasan.' },
        ],
      },
    ],
    examples: [
      {
        formula: '=BYROW(Presensi!E2:T85,LAMBDA(r,COUNTIF(r,"V")))',
        result: '84 angka, satu per asprak',
        note: 'Menghitung ada berapa tanda "V" di setiap baris asprak.',
      },
      {
        formula: '=BYCOL(Praktikan!E2:L41,LAMBDA(c,COUNT(c)))',
        result: M.map((m) => prak.filter((r) => r[m] !== '').length).join(' | '),
        note: 'Menghitung berapa praktikan yang hadir di masing-masing kolom modul.',
      },
    ],
    mistakes: ['Rumus di dalam LAMBDA milik BYROW menghasilkan banyak sel (misalnya `LAMBDA(r, r*2)`), bukan diringkas jadi 1 nilai dengan `SUM`/`AVERAGE`/`COUNTIF`, sehingga error `#CALC!`.'],
    practice: ['L4-03', 'L4-07', 'L4-08', 'L4-14', 'L4-21', 'L4-24'],
  },
  {
    id: 'reduce',
    title: 'REDUCE dan SCAN: celengan yang menggelinding dari atas ke bawah',
    intro: 'REDUCE itu seperti membawa celengan (`a`) dari baris pertama sampai terakhir: di setiap sel (`x`), kamu memasukkan sesuatu ke celengan, lalu di akhir REDUCE membuka isi total celengannya!',
    body: [
      'Berbeda dengan MAP atau BYROW, **REDUCE** dan **SCAN** punya **ingatan** dari langkah sebelumnya! Keduanya selalu membutuhkan **nilai awal celengan** dan `LAMBDA(a, x, rumus)` dengan **dua input wajib**:',
      '• **`a` (accumulator / isi celengan sementara)**: nilai hasil dari langkah sebelumnya.',
      '• **`x` (current value / koin baru)**: isi sel yang sedang dilewati saat ini.',
      '**Apa bedanya REDUCE dan SCAN?**',
      '• **REDUCE** hanya menampilkan **1 hasil paling akhir** setelah semua sel selesai dilewati (cocok untuk mencari total bersyarat, nilai terpanjang, atau menumpuk tabel dengan VSTACK).',
      '• **SCAN** menampilkan **catatan isi celengan di setiap langkah** dari baris pertama sampai terakhir (sangat sakti untuk membuat total berjalan atau mengisi sel kosong ke bawah mengikuti sel di atasnya!).',
      'Coba mainkan peraga di bawah ini untuk melihat bagaimana nilai `a` berubah langkah demi langkah.',
    ],
    visual: 'reduce',
    syntax: [
      {
        formula: 'REDUCE(nilai_awal, range, LAMBDA(a, x, rumus))',
        args: [
          { name: 'nilai_awal', desc: 'Isi celengan a sebelum mulai berjalan (biasanya 0 untuk hitungan angka, atau "" untuk teks).' },
          { name: 'range', desc: 'Daftar sel yang akan dilewati satu per satu.' },
          { name: 'LAMBDA(a, x, ...)', desc: 'a = hasil sementara di celengan, x = isi sel saat ini. Hasil rumus ini akan menjadi isi celengan a di langkah berikutnya!' },
        ],
      },
      {
        formula: 'SCAN(nilai_awal, range, LAMBDA(a, x, rumus))',
        args: [{ name: 'sama seperti REDUCE', desc: 'Bedanya, SCAN memunculkan daftar isi celengan a di setiap baris, bukan cuma hasil akhirnya.' }],
      },
    ],
    examples: [
      { formula: '=REDUCE(0,Inventaris!D2:D31,LAMBDA(a,x,a+x))', result: String(sum(col('Inventaris', 'RAM'))), note: 'Celengan mulai dari 0, lalu setiap sel RAM (x) ditambahkan ke celengan (a+x).' },
      { formula: '=SCAN("",PresensiKotor!C2:C85,LAMBDA(a,x,IF(x="",a,x)))', result: 'Kolom KELAS yang terisi penuh', note: 'Kalau sel saat ini kosong (x=""), pakai nama kelas sebelumnya (a). Kalau ada isinya, perbarui celengan dengan kelas baru (x)!' },
      {
        formula: '=REDUCE("KODE",Inventaris!A2:A31,LAMBDA(a,x,IF(XLOOKUP(x,Inventaris!A2:A31,Inventaris!G2:G31)="Rusak",VSTACK(a,x),a)))',
        result: ['KODE', ...inv.filter((r) => r.STATUS === 'Rusak').map((r) => r.KODE)].join(' | '),
        note: 'Menumpuk kode PC yang Rusak ke bawah celengan menggunakan VSTACK(a, x).',
      },
    ],
    mistakes: ['Terbalik urutan input LAMBDA: ingat selalu **`a` (celengan sementara) dulu, baru `x` (sel saat ini)**!', 'Memberi nilai awal `0` padahal rumus di dalamnya mengolah teks, atau memberi nilai awal `0` saat melakukan perkalian beruntun (seharusnya `1`).'],
    practice: ['L4-05', 'L4-06', 'L4-11', 'L4-12', 'L4-15', 'L4-17', 'L4-20', 'L4-25'],
  },
  {
    id: 'makearray',
    title: 'MAKEARRAY: bikin tabel dari rumus',
    intro: 'MAKEARRAY membuat tabel berukuran tertentu. Isi tiap selnya dihitung dari nomor baris dan nomor kolomnya.',
    body: [
      'Kamu menentukan jumlah baris dan kolom, lalu LAMBDA dengan dua input: `r` (nomor baris) dan `c` (nomor kolom).',
      'Contoh paling mudah: tabel perkalian. Isi tiap sel adalah `r*c`.',
    ],
    syntax: [
      {
        formula: 'MAKEARRAY(baris, kolom, LAMBDA(r, c, rumus))',
        args: [
          { name: 'baris, kolom', desc: 'Ukuran tabel.' },
          { name: 'LAMBDA(r, c, ...)', desc: 'r dan c mulai dari 1.' },
        ],
      },
    ],
    examples: [
      { formula: '=MAKEARRAY(3,3,LAMBDA(r,c,r*c))', result: '1 2 3 / 2 4 6 / 3 6 9', note: 'Tabel perkalian 3x3.' },
      { formula: '=SUM(MAKEARRAY(9,9,LAMBDA(r,c,r*c)))', result: '2025', note: 'Jumlah seluruh isi tabel perkalian 9x9.' },
    ],
    practice: ['L4-13'],
  },
  {
    id: 'pilih4',
    title: 'Pilih yang mana?',
    intro: 'Semua fungsi di level ini memakai LAMBDA. Bedanya ada di apa yang diberikan ke LAMBDA dan apa yang dikembalikan.',
    body: ['Kalau bingung, tanya dirimu: LAMBDA-nya perlu melihat satu sel, satu baris, atau perlu mengingat hasil sebelumnya?'],
    grid: {
      headers: ['Fungsi', 'LAMBDA menerima', 'Hasilnya'],
      rows: [
        ['MAP', 'Satu sel (dari tiap range)', 'Sebanyak sel di range'],
        ['BYROW', 'Satu baris utuh', 'Satu nilai per baris'],
        ['BYCOL', 'Satu kolom utuh', 'Satu nilai per kolom'],
        ['REDUCE', 'Hasil sementara + satu sel', 'Satu hasil akhir'],
        ['SCAN', 'Hasil sementara + satu sel', 'Semua hasil sementara'],
        ['MAKEARRAY', 'Nomor baris + nomor kolom', 'Tabel baru'],
        ['LET', 'Bukan LAMBDA, hanya memberi nama', 'Hasil rumus terakhir'],
      ],
    },
  },
]

// ------------------------------------------------------------------ SOAL
const kotor = rows('PresensiKotor')
const scanFill = (() => {
  let a = ''
  return kotor.map((r) => (a = r.KELAS === '' ? a : (r.KELAS as string)))
})()
const posInGroup = (() => {
  let a = 0
  return kotor.map((r) => (a = r.KELAS !== '' ? 1 : a + 1))
})()
const rusakKode = inv.filter((r) => r.STATUS === 'Rusak').map((r) => r.KODE)
const top = [...prak].sort((a, b) => avgOf(b) - avgOf(a))[0]
const nim24A = asp.filter((r) => String(r.NIM).slice(5, 7) === '24' && String(r.KODE).toUpperCase().includes('A')).length
const urut = pres.filter((r) => {
  const m = marks(r)
  const n = m.filter(Boolean).length
  const lastV = m.lastIndexOf(true) + 1
  return n === lastV
}).length

export const questions: ExcelQuestion[] = [
  {
    id: 'L4-01',
    tier: 'mudah',
    topic: 'LET',
    title: 'Selisih dua rata-rata',
    prompt: 'Dengan LET, simpan rata-rata HARGA PC `LAB A` sebagai `a` dan `LAB B` sebagai `b`, lalu hitung `a-b`.',
    expected: () => avgHarga('LAB A') - avgHarga('LAB B'),
    fns: { all: ['LET'] },
    keys: [
      { formula: '=LET(a,AVERAGEIF(Inventaris!B2:B31,"LAB A",Inventaris!H2:H31),b,AVERAGEIF(Inventaris!B2:B31,"LAB B",Inventaris!H2:H31),a-b)' },
      { formula: '=AVERAGEIF(Inventaris!B2:B31,"LAB A",Inventaris!H2:H31)-AVERAGEIF(Inventaris!B2:B31,"LAB B",Inventaris!H2:H31)', note: 'Tanpa LET. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['Pola LET: nama, nilai, nama, nilai, hasil.'],
  },
  {
    id: 'L4-02',
    tier: 'mudah',
    topic: 'LAMBDA',
    title: 'Harga plus PPN',
    prompt: 'Tulis LAMBDA dengan satu input `x` yang menghitung `x*1.11`, lalu langsung panggil dengan `Inventaris!H2` sebagai inputnya.',
    expected: () => (inv[0].HARGA as number) * 1.11,
    fns: { all: ['LAMBDA'] },
    keys: [{ formula: '=LAMBDA(x,x*1.11)(Inventaris!H2)' }, { formula: '=LAMBDA(x,x+x*11%)(Inventaris!H2)' }],
    steps: ['LAMBDA(x, x*1.11) adalah fungsinya.', '(Inventaris!H2) di belakangnya adalah inputnya.'],
  },
  {
    id: 'L4-03',
    tier: 'mudah',
    topic: 'BYROW/BYCOL',
    title: 'Hadir lengkap',
    prompt: 'Berapa praktikan yang nilai M1 sampai M8-nya terisi semua (8 nilai)? Pakai BYROW pada `Praktikan!E2:L41`.',
    expected: () => prak.filter((r) => M.every((m) => r[m] !== '')).length,
    fns: { all: ['BYROW', 'LAMBDA'] },
    keys: [
      { formula: '=SUM(BYROW(Praktikan!E2:L41,LAMBDA(r,--(COUNT(r)=8))))' },
      { formula: '=SUM(BYROW(Praktikan!E2:L41,LAMBDA(r,IF(COUNTBLANK(r)=0,1,0))))' },
    ],
    steps: ['COUNT(r) menghitung angka di satu baris.', '--(COUNT(r)=8) jadi 1 kalau lengkap, 0 kalau tidak.', 'SUM menjumlahkan semuanya.'],
  },
  {
    id: 'L4-04',
    tier: 'mudah',
    topic: 'MAP',
    title: 'Total huruf nama',
    prompt: 'Dengan MAP, hitung LEN setiap nama di `Asprak!C2:C51`, lalu jumlahkan.',
    expected: () => sum(asp.map((r) => String(r.NAMA).length)),
    fns: { all: ['MAP', 'LAMBDA'] },
    keys: [{ formula: '=SUM(MAP(Asprak!C2:C51,LAMBDA(n,LEN(n))))' }, { formula: '=SUM(LEN(Asprak!C2:C51))', note: 'LEN sudah bisa per sel tanpa MAP. Tidak lolos cek fungsi soal ini.' }],
    steps: ['MAP memberikan satu nama ke n setiap langkah.'],
  },
  {
    id: 'L4-05',
    tier: 'mudah',
    topic: 'REDUCE/SCAN',
    title: 'Jumlah dengan REDUCE',
    prompt: 'Jumlahkan seluruh RAM di Inventaris dengan REDUCE, mulai dari 0.',
    expected: () => sum(col('Inventaris', 'RAM')),
    fns: { all: ['REDUCE'] },
    keys: [{ formula: '=REDUCE(0,Inventaris!D2:D31,LAMBDA(a,x,a+x))' }, { formula: '=REDUCE(0,Inventaris!D2:D31,LAMBDA(total,ram,total+ram))', note: 'Nama input bebas.' }],
    steps: ['a = total sementara, x = RAM saat ini.'],
  },
  {
    id: 'L4-06',
    tier: 'mudah',
    topic: 'REDUCE/SCAN',
    title: 'Total berjalan ke-10',
    prompt: 'Dengan SCAN, buat total berjalan HARGA di Inventaris. Ambil nilai ke-10 dengan INDEX.',
    expected: () => sum(inv.slice(0, 10).map((r) => r.HARGA)),
    fns: { all: ['SCAN'] },
    keys: [{ formula: '=INDEX(SCAN(0,Inventaris!H2:H31,LAMBDA(a,x,a+x)),10)' }, { formula: '=SUM(Inventaris!H2:H11)', note: 'Tidak lolos cek fungsi soal ini.' }],
    steps: ['SCAN menghasilkan 30 total sementara.', 'Yang ke-10 sama dengan jumlah 10 harga pertama.'],
  },
  {
    id: 'L4-07',
    tier: 'mudah',
    topic: 'BYROW/BYCOL',
    title: 'Modul paling sepi',
    prompt: 'Dengan BYCOL, hitung berapa praktikan yang hadir (nilai terisi) di tiap modul M1 sampai M8. Berapa jumlah hadir yang paling sedikit?',
    expected: () => Math.min(...M.map((m) => prak.filter((r) => r[m] !== '').length)),
    fns: { all: ['BYCOL'] },
    keys: [{ formula: '=MIN(BYCOL(Praktikan!E2:L41,LAMBDA(c,COUNT(c))))' }, { formula: '=MIN(BYCOL(Praktikan!E2:L41,LAMBDA(k,40-COUNTBLANK(k))))' }],
    steps: ['BYCOL memberikan satu kolom ke c.', 'MIN dari 8 hasilnya.'],
  },
  {
    id: 'L4-08',
    tier: 'sedang',
    topic: 'BYROW/BYCOL',
    title: 'Asprak rajin input',
    prompt: 'Di sheet `Presensi`, kolom Modul 1 sampai 16 (`E2:T85`) berisi `V` kalau nilai sudah diinput. Dengan BYROW, hitung berapa baris yang punya **minimal 8** tanda V.',
    expected: () => pres.filter((r) => marks(r).filter(Boolean).length >= 8).length,
    fns: { all: ['BYROW', 'COUNTIF'] },
    keys: [
      { formula: '=SUM(BYROW(Presensi!E2:T85,LAMBDA(r,--(COUNTIF(r,"V")>=8))))' },
      { formula: '=COUNT(FILTER(Presensi!D2:D85,BYROW(Presensi!E2:T85,LAMBDA(r,COUNTIF(r,"V")))>=8))' },
    ],
    steps: ['BYROW memberikan 16 sel modul satu baris ke r.', 'COUNTIF(r,"V") menghitung tanda V.', 'Ubah jadi 1/0 dengan >=8, lalu jumlahkan.'],
  },
  {
    id: 'L4-09',
    tier: 'sedang',
    topic: 'MAP',
    title: 'MAP dua range',
    prompt: 'Berapa PC yang RAM-nya minimal 16 **dan** STORAGE-nya minimal 512? Wajib memakai MAP dengan dua range (RAM dan STORAGE) dan AND di dalam LAMBDA.',
    expected: () => inv.filter((r) => (r.RAM as number) >= 16 && (r.STORAGE as number) >= 512).length,
    fns: { all: ['MAP', 'AND'] },
    keys: [
      { formula: '=SUM(MAP(Inventaris!D2:D31,Inventaris!E2:E31,LAMBDA(r,s,--AND(r>=16,s>=512))))' },
      { formula: '=COUNTIFS(Inventaris!D2:D31,">=16",Inventaris!E2:E31,">=512")', note: 'Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['Dua range, jadi LAMBDA punya dua input: r untuk RAM, s untuk STORAGE.', 'Di MAP, r dan s masing-masing satu nilai, jadi AND bekerja normal.'],
  },
  {
    id: 'L4-10',
    tier: 'sedang',
    topic: 'LET',
    title: 'Huruf mutu dengan LET',
    prompt: 'Dalam satu LET: simpan rata-rata M1 sampai M8 praktikan di baris 7 sheet `Praktikan` sebagai `r`, lalu cari huruf mutunya di tabel `Grade` dengan XLOOKUP.',
    expected: () => gradeOf(avgOf(prak[5])),
    fns: { all: ['LET', 'XLOOKUP'] },
    keys: [
      { formula: '=LET(r,AVERAGE(Praktikan!E7:L7),XLOOKUP(r,Grade!A2:A8,Grade!B2:B8,,-1))' },
      { formula: '=LET(r,AVERAGE(Praktikan!E7:L7),INDEX(Grade!B2:B8,MATCH(r,Grade!A2:A8,1)))', note: 'INDEX-MATCH. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: [`Rata-ratanya ${round(avgOf(prak[5]), 2)}.`, 'XLOOKUP dengan cara cocok -1 mencari batas terdekat di bawahnya.'],
  },
  {
    id: 'L4-11',
    tier: 'sedang',
    topic: 'REDUCE/SCAN',
    title: 'Hitung PC tua',
    prompt: 'Dengan REDUCE, hitung berapa PC yang TAHUN-nya sebelum 2020.',
    expected: () => inv.filter((r) => (r.TAHUN as number) < 2020).length,
    fns: { all: ['REDUCE'] },
    keys: [{ formula: '=REDUCE(0,Inventaris!F2:F31,LAMBDA(a,x,a+(x<2020)))' }, { formula: '=REDUCE(0,Inventaris!F2:F31,LAMBDA(a,x,IF(x<2020,a+1,a)))' }],
    steps: ['(x<2020) bernilai TRUE/FALSE, yang dihitung 1/0 saat ditambah.'],
  },
  {
    id: 'L4-12',
    tier: 'sedang',
    topic: 'REDUCE/SCAN',
    title: 'Isi ke bawah dengan SCAN',
    prompt: 'Kolom KELAS di `PresensiKotor!C2:C85` hanya terisi di baris pertama tiap kelas. Dengan SCAN, isi ke bawah (sel kosong memakai kelas sebelumnya). Ambil hasil ke-40.',
    expected: () => scanFill[39],
    fns: { all: ['SCAN'] },
    keys: [
      { formula: '=INDEX(SCAN("",PresensiKotor!C2:C85,LAMBDA(a,x,IF(x="",a,x))),40)' },
      { formula: '=LOOKUP(2,1/(PresensiKotor!C2:C41<>""),PresensiKotor!C2:C41)', note: 'Ambil isi terakhir yang tidak kosong sampai baris 41. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['Nilai awal "" karena hasilnya teks.', 'IF(x="",a,x): kosong pakai a, terisi pakai x.', 'Hasil ke-40 adalah baris 41 sheet.'],
  },
  {
    id: 'L4-13',
    tier: 'sedang',
    topic: 'MAKEARRAY',
    title: 'Tabel perkalian',
    prompt: 'Buat tabel perkalian 9x9 dengan MAKEARRAY, lalu jumlahkan seluruh isinya.',
    expected: () => 2025,
    fns: { all: ['MAKEARRAY'] },
    keys: [{ formula: '=SUM(MAKEARRAY(9,9,LAMBDA(r,c,r*c)))' }, { formula: '=SUM(SEQUENCE(9)*SEQUENCE(1,9))', note: 'Kolom kali baris. Tidak lolos cek fungsi soal ini.' }],
    steps: ['r dan c mulai dari 1 sampai 9.'],
  },
  {
    id: 'L4-14',
    tier: 'sedang',
    topic: 'BYROW/BYCOL',
    title: 'Praktikan terbaik',
    prompt: 'Siapa NAMA praktikan dengan rata-rata M1 sampai M8 tertinggi? Hitung rata-rata tiap baris dengan BYROW.',
    expected: () => top.NAMA,
    fns: { all: ['BYROW'] },
    keys: [
      { formula: '=LET(r,BYROW(Praktikan!E2:L41,LAMBDA(x,AVERAGE(x))),XLOOKUP(MAX(r),r,Praktikan!B2:B41))' },
      { formula: '=INDEX(SORTBY(Praktikan!B2:B41,BYROW(Praktikan!E2:L41,LAMBDA(x,AVERAGE(x))),-1),1)' },
    ],
    steps: ['BYROW menghasilkan 40 rata-rata.', 'Cari yang terbesar dengan MAX, lalu XLOOKUP namanya.'],
  },
  {
    id: 'L4-15',
    tier: 'sedang',
    topic: 'REDUCE/SCAN',
    title: 'Faktorial',
    prompt: 'Hitung 10! (1x2x3x...x10) dengan REDUCE dan SEQUENCE.',
    expected: () => 3628800,
    fns: { all: ['REDUCE', 'SEQUENCE'] },
    keys: [{ formula: '=REDUCE(1,SEQUENCE(10),LAMBDA(a,x,a*x))' }, { formula: '=FACT(10)', note: 'Tidak lolos cek fungsi soal ini.' }],
    steps: ['Nilai awal 1, karena dikali. Kalau 0, hasilnya selalu 0.'],
  },
  {
    id: 'L4-16',
    tier: 'sulit',
    topic: 'LAMBDA',
    title: 'Fungsi RATAMODUL',
    prompt:
      'Buat nama `RATAMODUL` di Name Manager (Ctrl+F3) yang berisi `=LAMBDA(baris,ROUND(AVERAGE(baris),2))`. Lalu di sel jawaban, pakai `RATAMODUL` untuk praktikan di baris 12 (`Praktikan!E12:L12`).',
    expected: () => round(avgOf(prak[10]), 2),
    fns: { contains: ['RATAMODUL('] },
    structure: { definedName: 'RATAMODUL' },
    setup: { name: { name: 'RATAMODUL', ref: '=LAMBDA(baris,ROUND(AVERAGE(baris),2))' } },
    keys: [
      { formula: '=RATAMODUL(Praktikan!E12:L12)' },
      { formula: '=LAMBDA(baris,ROUND(AVERAGE(baris),2))(Praktikan!E12:L12)', note: 'Hasilnya sama, tapi tidak lolos cek fungsi soal ini karena tidak memakai nama.' },
    ],
    steps: ['Ctrl+F3 > New. Name: RATAMODUL. Refers to: =LAMBDA(baris,ROUND(AVERAGE(baris),2)).', 'Klik OK, tutup Name Manager.', 'Ketik =RATAMODUL(Praktikan!E12:L12) di sel kuning.'],
    hint: 'Name Manager ikut tersimpan di file, jadi website bisa memeriksa apakah RATAMODUL sudah dibuat.',
  },
  {
    id: 'L4-17',
    tier: 'sulit',
    topic: 'REDUCE/SCAN',
    title: 'FILTER buatan sendiri',
    prompt:
      'Tanpa FILTER, kumpulkan KODE PC yang STATUS-nya `Rusak` dengan REDUCE dan VSTACK. Mulai dari judul `"KODE"`, buang judulnya di akhir dengan DROP, lalu gabungkan hasilnya dengan `, `.',
    expected: () => rusakKode.join(', '),
    fns: { all: ['REDUCE', 'VSTACK'], forbid: ['FILTER'] },
    keys: [
      {
        formula:
          '=TEXTJOIN(", ",TRUE,DROP(REDUCE("KODE",SEQUENCE(30),LAMBDA(a,i,IF(INDEX(Inventaris!G2:G31,i)="Rusak",VSTACK(a,INDEX(Inventaris!A2:A31,i)),a))),1))',
      },
      {
        formula: '=TEXTJOIN(", ",TRUE,DROP(REDUCE("KODE",Inventaris!A2:A31,LAMBDA(a,x,IF(XLOOKUP(x,Inventaris!A2:A31,Inventaris!G2:G31)="Rusak",VSTACK(a,x),a))),1))',
      },
    ],
    steps: [
      'REDUCE berjalan di nomor urut 1 sampai 30 (SEQUENCE), supaya bisa membaca STATUS dan KODE di baris yang sama dengan INDEX.',
      'Kalau rusak, VSTACK(a, kode) menumpuk kode ke daftar. Kalau tidak, a dibiarkan.',
      'DROP(...,1) membuang judul "KODE".',
    ],
  },
  {
    id: 'L4-18',
    tier: 'sulit',
    topic: 'LAMBDA',
    title: 'Input opsional',
    prompt:
      'Tulis LAMBDA dengan input `x` dan input opsional `[d]`. Kalau d tidak diisi (cek dengan ISOMITTED), bulatkan x ke 0 desimal. Kalau diisi, bulatkan ke d desimal. Panggil langsung dengan rata-rata HARGA Inventaris saja, tanpa d.',
    expected: () => round(avg(col('Inventaris', 'HARGA')), 0),
    fns: { all: ['LAMBDA', 'ISOMITTED'] },
    keys: [
      { formula: '=LAMBDA(x,[d],ROUND(x,IF(ISOMITTED(d),0,d)))(AVERAGE(Inventaris!H2:H31))' },
      { formula: '=LAMBDA(x,[d],IF(ISOMITTED(d),ROUND(x,0),ROUND(x,d)))(AVERAGE(Inventaris!H2:H31))' },
    ],
    steps: ['[d] dengan kurung siku artinya boleh tidak diisi.', 'ISOMITTED(d) bernilai TRUE kalau d tidak diisi.'],
  },
  {
    id: 'L4-19',
    tier: 'sulit',
    topic: 'MAP',
    title: 'Angkatan 24 dengan huruf A',
    prompt:
      'Digit ke-6 dan ke-7 NIM menunjukkan angkatan (misalnya `103012400155` adalah angkatan 24). Dengan MAP dua range (NIM dan KODE di sheet `Asprak`), hitung asprak angkatan 24 yang KODE-nya mengandung huruf `A`.',
    expected: () => nim24A,
    fns: { all: ['MAP'] },
    keys: [
      { formula: '=SUM(MAP(Asprak!B2:B51,Asprak!D2:D51,LAMBDA(n,k,--AND(MID(n,6,2)="24",ISNUMBER(SEARCH("A",k))))))' },
      { formula: '=SUM((MID(Asprak!B2:B51,6,2)="24")*ISNUMBER(SEARCH("A",Asprak!D2:D51)))', note: 'Cara array biasa. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['MID menghasilkan teks, jadi bandingkan dengan "24".', 'SEARCH memberi posisi kalau ketemu, error kalau tidak. ISNUMBER mengubahnya jadi TRUE/FALSE.'],
  },
  {
    id: 'L4-20',
    tier: 'sulit',
    topic: 'REDUCE/SCAN',
    title: 'Nomor urut dalam kelas',
    prompt:
      'Di `PresensiKotor`, baris yang KELAS-nya terisi adalah awal kelas baru. Dengan SCAN, buat nomor urut yang mulai dari 1 di tiap awal kelas dan bertambah 1 di baris berikutnya. Berapa nomor urut di baris ke-40 data (baris 41 sheet)?',
    expected: () => posInGroup[39],
    fns: { all: ['SCAN'] },
    keys: [
      { formula: '=INDEX(SCAN(0,PresensiKotor!C2:C85,LAMBDA(a,x,IF(x<>"",1,a+1))),40)' },
      { formula: '=41-LOOKUP(2,1/(PresensiKotor!C2:C41<>""),ROW(PresensiKotor!C2:C41))+1', note: 'Baris 41 dikurangi baris awal kelasnya. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['Kalau x terisi, mulai lagi dari 1.', 'Kalau kosong, a+1.'],
  },
  {
    id: 'L4-21',
    tier: 'sulit',
    topic: 'BYROW/BYCOL',
    title: 'Input tanpa bolong',
    prompt:
      'Asprak dianggap "rapi" kalau tanda V-nya berurutan dari Modul 1 tanpa bolong. Artinya, posisi V terakhir sama dengan jumlah V (baris tanpa V juga dihitung rapi). Dengan BYROW pada `Presensi!E2:T85`, ada berapa baris yang rapi?',
    expected: () => urut,
    fns: { all: ['BYROW'] },
    keys: [
      { formula: '=SUM(BYROW(Presensi!E2:T85,LAMBDA(r,--(COUNTIF(r,"V")=IFERROR(XMATCH("V",r,0,-1),0)))))' },
      { formula: '=SUM(BYROW(Presensi!E2:T85,LAMBDA(r,--(COUNTIF(r,"V")=IFERROR(MATCH(2,1/(r="V")),0)))))', note: 'MATCH(2,1/(syarat)) adalah trik lama untuk mencari posisi terakhir yang memenuhi syarat.' },
    ],
    steps: ['XMATCH("V",r,0,-1) mencari dari kanan, memberi posisi V terakhir.', 'Kalau tidak ada V, XMATCH error, jadi IFERROR(...,0).', 'Bandingkan dengan jumlah V.'],
  },
  {
    id: 'L4-22',
    tier: 'mudah',
    topic: 'LAMBDA',
    title: 'Selisih tertinggi dan terendah dengan LAMBDA',
    prompt: 'Tulis **LAMBDA** dengan dua input `(a, b)` yang menghitung `a - b`, lalu langsung panggil di belakangnya dengan `(MAX(Inventaris!H2:H31), MIN(Inventaris!H2:H31))` (dilarang memakai LET).',
    expected: () => Math.max(...inv.map((r) => r.HARGA as number)) - Math.min(...inv.map((r) => r.HARGA as number)),
    fns: { all: ['LAMBDA', 'MAX', 'MIN'], forbid: ['LET'] },
    keys: [
      { formula: '=LAMBDA(a,b,a-b)(MAX(Inventaris!H2:H31),MIN(Inventaris!H2:H31))' },
      { formula: '=LAMBDA(r,MAX(r)-MIN(r))(Inventaris!H2:H31)' },
    ],
    steps: [
      'Buat resep LAMBDA(a, b, a-b) lalu beri kurung berisi dua argumen (MAX(...), MIN(...)) di belakangnya.',
    ],
  },
  {
    id: 'L4-23',
    tier: 'sedang',
    topic: 'MAP',
    title: 'Simulasi diskon PC mahal dengan MAP',
    prompt: 'Dengan **MAP** pada `Inventaris!H2:H31`, jika harga (`h`) lebih dari `15000000`, kalikan dengan `0.9` (diskon 10%), selain itu biarkan tetap `h`. Lalu hitung rata-rata seluruh harga hasil simulasi tersebut dengan **AVERAGE**.',
    expected: () => avg(inv.map((r) => ((r.HARGA as number) > 15000000 ? (r.HARGA as number) * 0.9 : (r.HARGA as number)))),
    fns: { all: ['AVERAGE', 'MAP', 'LAMBDA', 'IF'] },
    keys: [
      { formula: '=AVERAGE(MAP(Inventaris!H2:H31,LAMBDA(h,IF(h>15000000,h*0.9,h))))' },
      { formula: '=AVERAGE(MAP(Inventaris!H2:H31,LAMBDA(x,IF(x>15000000,x*90%,x))))' },
    ],
    steps: [
      'MAP memproses tiap sel harga h satu per satu dengan IF(h>15000000, h*0.9, h).',
      'AVERAGE menghitung rata-rata dari 30 harga baru tersebut.',
    ],
  },
  {
    id: 'L4-24',
    tier: 'sedang',
    topic: 'BYROW/BYCOL',
    title: 'Praktikan dengan rata-rata minimal 80',
    prompt: 'Berapa banyak praktikan di `Praktikan!E2:L41` yang rata-rata nilai modulnya (`AVERAGE`) minimal `80`? Wajib memakai **BYROW**, **LAMBDA**, dan **AVERAGE**.',
    expected: () => prak.filter((r) => avgOf(r) >= 80).length,
    fns: { all: ['BYROW', 'LAMBDA', 'AVERAGE'] },
    keys: [
      { formula: '=SUM(BYROW(Praktikan!E2:L41,LAMBDA(r,--(AVERAGE(r)>=80))))' },
      { formula: '=SUM(BYROW(Praktikan!E2:L41,LAMBDA(r,IF(AVERAGE(r)>=80,1,0))))' },
    ],
    steps: [
      'BYROW menyerahkan satu baris nilai modul (r) ke LAMBDA.',
      'AVERAGE(r)>=80 menghasilkan TRUE/FALSE, ubah ke 1/0 dengan -- lalu jumlahkan dengan SUM.',
    ],
  },
  {
    id: 'L4-25',
    tier: 'sulit',
    topic: 'REDUCE/SCAN',
    title: 'Panjang nama terpanjang dengan REDUCE',
    prompt: 'Berapa jumlah karakter (huruf + spasi) dari NAMA asprak paling panjang di `Asprak!C2:C51`? Wajib memakai **REDUCE** (mulai dari `0`), **LAMBDA**, dan **LEN** (dilarang memakai MAP).',
    expected: () => Math.max(...asp.map((r) => String(r.NAMA).length)),
    fns: { all: ['REDUCE', 'LAMBDA', 'LEN'], forbid: ['MAP'] },
    keys: [
      { formula: '=REDUCE(0,Asprak!C2:C51,LAMBDA(a,x,MAX(a,LEN(x))))' },
      { formula: '=REDUCE(0,Asprak!C2:C51,LAMBDA(a,x,IF(LEN(x)>a,LEN(x),a)))' },
    ],
    steps: [
      'Celengan a dimulai dari 0.',
      'Di tiap nama x, bandingkan isi celengan a dengan LEN(x) memakai MAX(a, LEN(x)) atau IF(LEN(x)>a, LEN(x), a).',
    ],
  },
]

// ------------------------------------------------------------------ KUIS
const quiz: QuizQ[] = [
  {
    id: 'q4-1',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=LET(a,3,b,a*2,a+b)',
    accept: ['9'],
    mode: 'number',
    why: 'a=3, b=3*2=6, a+b=9.',
  },
  {
    id: 'q4-2',
    type: 'mcq',
    kind: 'error',
    q: 'Kamu mengetik `=LAMBDA(x,x*2)` di sel. Hasilnya?',
    options: ['#CALC!', '0', 'x*2', '#NAME?'],
    answer: 0,
    why: 'LAMBDA belum diberi input. Tambahkan (5) di belakangnya, atau simpan di Name Manager.',
  },
  {
    id: 'q4-3',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=REDUCE(0,{2;4;6},LAMBDA(a,x,a+x*x))',
    accept: ['56'],
    mode: 'number',
    why: '0+4=4, 4+16=20, 20+36=56.',
  },
  {
    id: 'q4-4',
    type: 'mcq',
    kind: 'tebak',
    q: '`=SCAN(0,{1;2;3;4},LAMBDA(a,x,a+x))` menghasilkan?',
    options: ['1, 3, 6, 10', '10', '1, 2, 3, 4', '0, 1, 3, 6'],
    answer: 0,
    why: 'SCAN menulis setiap total sementara: 1, 1+2, 3+3, 6+4.',
  },
  {
    id: 'q4-5',
    type: 'mcq',
    kind: 'konsep',
    q: 'Di `LAMBDA(a,x,...)` milik REDUCE, apa itu `a`?',
    options: ['Hasil sementara dari langkah sebelumnya', 'Sel yang sedang diproses', 'Nomor baris', 'Range aslinya'],
    answer: 0,
    why: 'Input pertama selalu akumulator (hasil sementara). Input kedua adalah sel saat ini.',
  },
  {
    id: 'q4-6',
    type: 'mcq',
    kind: 'error',
    q: '`=BYROW(A2:C5,LAMBDA(r,r*2))` menghasilkan `#CALC!`. Kenapa?',
    options: ['LAMBDA mengembalikan satu baris (3 nilai), padahal BYROW butuh satu nilai per baris', 'BYROW tidak boleh dikali', 'Range terlalu kecil', 'Harus pakai BYCOL'],
    answer: 0,
    why: 'r*2 menghasilkan 3 nilai. Bungkus dengan SUM atau fungsi lain yang memberi satu nilai.',
  },
  {
    id: 'q4-7',
    type: 'mcq',
    kind: 'konsep',
    q: 'Kenapa AND boleh dipakai di dalam `MAP(...,LAMBDA(r,s,AND(r>=16,s>=512)))`, padahal tidak boleh di FILTER?',
    options: ['Di MAP, r dan s masing-masing satu nilai, bukan satu range', 'MAP punya AND versi khusus', 'Sebenarnya tetap salah', 'Karena ada dua range'],
    answer: 0,
    why: 'MAP menjalankan LAMBDA sel per sel. AND hanya bermasalah kalau diberi range, karena merangkum semuanya jadi satu.',
  },
  {
    id: 'q4-8',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=SUM(MAKEARRAY(2,3,LAMBDA(r,c,r+c)))',
    accept: ['21'],
    mode: 'number',
    why: 'Baris 1: 2, 3, 4. Baris 2: 3, 4, 5. Totalnya 9 + 12 = 21.',
  },
  {
    id: 'q4-9',
    type: 'mcq',
    kind: 'konsep',
    q: 'Saat menyimpan LAMBDA di Name Manager, apa yang ditulis di kotak Refers to?',
    options: ['=LAMBDA(x,x*2)', '=LAMBDA(x,x*2)(5)', 'LAMBDA', '=x*2'],
    answer: 0,
    why: 'Yang disimpan fungsinya saja, tanpa input. Inputnya diberikan saat dipanggil di sel.',
  },
  {
    id: 'q4-10',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=LAMBDA(x,[y],IF(ISOMITTED(y),x,x*y))(5)',
    accept: ['5'],
    mode: 'number',
    why: 'y tidak diisi, ISOMITTED(y) TRUE, jadi hasilnya x = 5.',
  },
  {
    id: 'q4-11',
    type: 'mcq',
    kind: 'tebak',
    q: '`=SCAN("",{"A";"";"B";""},LAMBDA(a,x,IF(x="",a,x)))` menghasilkan?',
    options: ['A, A, B, B', 'A, "", B, ""', 'B', 'A, B'],
    answer: 0,
    why: 'Sel kosong memakai nilai sebelumnya. Ini pola isi ke bawah.',
  },
  {
    id: 'q4-12',
    type: 'mcq',
    kind: 'konsep',
    q: 'Untuk menghitung jumlah tanda V di **setiap baris** Presensi, fungsi yang paling tepat?',
    options: ['BYROW', 'MAP', 'REDUCE', 'MAKEARRAY'],
    answer: 0,
    why: 'BYROW memberikan satu baris utuh ke LAMBDA dan menghasilkan satu nilai per baris.',
  },
]

const order = { mudah: 0, sedang: 1, sulit: 2 }
questions.sort((a, b) => order[a.tier] - order[b.tier])

export const level4: Level = {
  n: 4,
  slug: 'logika',
  title: 'LET, LAMBDA, dan kawan-kawan',
  short: 'LET, LAMBDA, MAP, BYROW, REDUCE, SCAN, MAKEARRAY',
  goal: 'Bisa membuat fungsi sendiri dan memproses data baris per baris atau langkah demi langkah.',
  day: 'Rabu',
  concepts,
  questions,
  quiz,
}
