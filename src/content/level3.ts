import { DATA, avg, rows, sum } from '../data/ds'
import { proper, xtrim } from './helpers'
import type { Concept, ExcelQuestion, Level, QuizQ } from './types'

const inv = rows('Inventaris')
const prak = rows('Praktikan')
const asp = rows('Asprak')
const pres = rows('Presensi')
const M = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8'] as const
const kode = (rs: Record<string, unknown>[]) => rs.map((r) => r.KODE as string)
const hargaDesc = inv.map((r) => r.HARGA as number).sort((a, b) => b - a)
const hargaAsc = [...hargaDesc].reverse()
// UNIQUE di Excel tidak membedakan huruf besar kecil
const uniqCi = (vs: string[]) => [...new Map(vs.map((v) => [v.toLowerCase(), v])).values()]
const cmpText = (a: string, b: string) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0)

// ------------------------------------------------------------------ MATERI
const concepts: Concept[] = [
  {
    id: 'spill',
    title: 'Rumus yang hasilnya tumpah (spill)',
    intro: 'Di Excel 365, satu rumus bisa menghasilkan banyak sel sekaligus. Hasilnya otomatis "tumpah" mengisi sel-sel di bawah atau di sampingnya.',
    body: [
      'Di Excel zaman dulu, satu rumus hanya bisa mengisi satu kotak sel. Di Excel modern (365/2021+), kalau rumusmu menghasilkan sebuah daftar (array), Excel otomatis menuangkan daftar itu ke sel-sel kosong di bawah atau di kanannya. Kamu cukup mengetik rumusnya di **satu sel paling kiri-atas** saja!',
      'Area tumpahan ini ditandai dengan bingkai biru tipis saat diklik. Sel-sel tumpahannya ibarat bayangan: tidak bisa dihapus satu-satu. Kalau mau mengedit atau menghapus, klik sel paling atas tempat rumus aslinya berada.',
      '**Kenapa muncul `#SPILL!`?** Artinya jalur tumpahnya **terhalang** oleh sel lain yang sudah ada isinya. Cukup hapus isi sel yang menghalangi di bawahnya, maka daftar hasil rumusmu akan langsung muncul kembali.',
      '**Trik tanda pagar (`#`):** Kalau kamu mau menghitung seluruh hasil tumpahan yang dimulai di sel `F2`, cukup tulis `F2#` (misalnya {{=ROWS(F2#)}}). Tanda `#` artinya *"ambil seluruh area tumpahan dari F2"*.',
    ],
    visual: 'spill',
    mistakes: [
      'Menulis rumus spill di dalam fitur Excel Table (`Ctrl+T`). Tabel tidak mengizinkan rumus tumpah, sehingga langsung keluar `#SPILL!`.',
      'Mengetik teks/angka manual di bawah sel rumus array, sehingga menghalangi jalur tumpahnya.',
    ],
  },
  {
    id: 'filter',
    title: 'FILTER: saring semua baris yang memenuhi syarat',
    intro: 'Kalau VLOOKUP/XLOOKUP hanya mengambil 1 pemenang pertama, FILTER itu seperti saringan kopi: menyaring dan mengeluarkan SEMUA baris yang cocok!',
    body: [
      'Cara pakai **FILTER** sangat manusiawi. Kamu cuma perlu menyebutkan dua hal: **1) Tabel/kolom mana yang mau diambil**, dan **2) Apa syarat penyaringannya** (misalnya `Inventaris!G2:G31="Rusak"`).',
      '**Bagaimana kalau syaratnya ada dua atau lebih?** Di dalam FILTER, jangan pakai fungsi `AND` atau `OR`! Gunakan matematika sederhana:',
      '• **Syarat DAN (harus terpenuhi semua)** = kalikan dengan tanda bintang **`*`**. Contoh: `(B2:B31="LAB A") * (G2:G31="Baik")`.',
      '• **Syarat ATAU (salah satu saja cukup)** = jumlahkan dengan tanda tambah **`+`**. Contoh: `(B2:B31="LAB A") + (B2:B31="LAB E")`.',
      '**Bagaimana kalau tidak ada satupun data yang lolos saringan?** FILTER akan menampilkan error `#CALC!`. Supaya rapi, isi argumen ke-3 dengan pesan cadangan seperti `"Tidak ada"`.',
    ],
    syntax: [
      {
        formula: 'FILTER(data, syarat, [kalau_kosong])',
        args: [
          { name: 'data', desc: 'Kolom atau tabel yang mau ditampilkan hasilnya.' },
          { name: 'syarat', desc: 'Kalimat perbandingan yang tingginya wajib sama persis dengan data, misalnya B2:B31="LAB A".' },
          { name: 'kalau_kosong', desc: 'Pesan pengganti kalau tidak ada baris yang cocok (agar tidak muncul #CALC!).', optional: true },
        ],
      },
    ],
    examples: [
      { formula: '=FILTER(Inventaris!A2:A31,Inventaris!G2:G31="Rusak")', result: kode(inv.filter((r) => r.STATUS === 'Rusak')).join(' | '), note: 'Menyaring semua kode PC yang berstatus Rusak.' },
      {
        formula: '=FILTER(Inventaris!A2:H31,(Inventaris!B2:B31="LAB A")*(Inventaris!D2:D31>=16))',
        result: `${inv.filter((r) => r.RUANG === 'LAB A' && (r.RAM as number) >= 16).length} baris x 8 kolom`,
        note: 'Menyaring seluruh kolom untuk PC di LAB A DAN memiliki RAM minimal 16 GB.',
      },
      { formula: '=FILTER(Inventaris!A2:A31,Inventaris!B2:B31="LAB F","Tidak ada")', result: 'Tidak ada', note: 'Karena LAB F tidak ada, yang muncul adalah teks "Tidak ada".' },
    ],
    mistakes: [
      'Memakai `AND(...)` atau `OR(...)` di dalam syarat FILTER. Ingat: wajib pakai perkalian `*` untuk DAN, serta penjumlahan `+` untuk ATAU (jangan lupa kurung tiap syaratnya!).',
      'Tinggi blok `data` dan blok `syarat` tidak sejajar (misalnya `A2:A31` dipasangkan dengan `G1:G31`). Hasilnya langsung `#VALUE!`.',
    ],
    practice: ['L3-01', 'L3-02', 'L3-08', 'L3-09', 'L3-24'],
  },
  {
    id: 'sort',
    title: 'SORT dan SORTBY: mengurutkan',
    intro: 'SORT mengurutkan data dengan rumus, jadi data aslinya tidak berubah.',
    body: [
      '**SORT** mengurutkan berdasarkan nomor kolom di dalam data. Argumen ketiganya **1** untuk kecil ke besar (A ke Z), **-1** untuk besar ke kecil.',
      '**SORTBY** mengurutkan berdasarkan kolom lain, bahkan kolom yang tidak ikut ditampilkan. SORTBY juga bisa mengurutkan dengan beberapa kunci sekaligus.',
    ],
    syntax: [
      {
        formula: 'SORT(data, [nomor_kolom], [arah])',
        args: [
          { name: 'data', desc: 'Range yang diurutkan.' },
          { name: 'nomor_kolom', desc: 'Kolom ke berapa yang jadi patokan. Bawaannya 1.', optional: true },
          { name: 'arah', desc: '1 naik, -1 turun. Bawaannya 1.', optional: true },
        ],
      },
      {
        formula: 'SORTBY(data, kolom_patokan1, arah1, [kolom_patokan2, arah2])',
        args: [
          { name: 'data', desc: 'Range yang mau ditampilkan.' },
          { name: 'kolom_patokan1', desc: 'Range yang jadi patokan urut. Tingginya sama dengan data.' },
          { name: 'arah1', desc: '1 naik, -1 turun.' },
          { name: 'kolom_patokan2, arah2', desc: 'Patokan kedua kalau patokan pertama sama.', optional: true },
        ],
      },
    ],
    examples: [
      { formula: '=SORT(Inventaris!H2:H31,,-1)', result: `${hargaDesc[0]}, ${hargaDesc[1]}, ...`, note: 'Argumen kedua dikosongkan dengan dua koma.' },
      { formula: '=SORTBY(Inventaris!A2:A31,Inventaris!B2:B31,1,Inventaris!H2:H31,-1)', result: 'Kode PC per ruang, termahal duluan', note: 'Urut ruang dulu, lalu harga dari yang termahal.' },
    ],
    mistakes: ['Lupa dua koma: `SORT(H2:H31,-1)` artinya kolom ke -1, hasilnya error.'],
    practice: ['L3-04', 'L3-15'],
  },
  {
    id: 'unique',
    title: 'UNIQUE: buang yang dobel',
    intro: 'UNIQUE membuat daftar tanpa duplikat. Bungkus dengan COUNTA untuk tahu ada berapa jenis.',
    body: [
      '{{=UNIQUE(Inventaris!C2:C31)}} memberi daftar jenis CPU, masing-masing satu kali.',
      'Argumen ketiga **TRUE** artinya "hanya yang muncul tepat satu kali". Ini berbeda dari daftar tanpa dobel.',
      'UNIQUE tidak membedakan huruf besar dan kecil. `anr` dan `ANR` dianggap sama. Tapi spasi berlebih dianggap beda, jadi rapikan dulu dengan TRIM.',
    ],
    syntax: [
      {
        formula: 'UNIQUE(data, [per_kolom], [hanya_sekali])',
        args: [
          { name: 'data', desc: 'Range yang mau dibuang dobelnya.' },
          { name: 'per_kolom', desc: 'Biarkan kosong (FALSE) untuk data ke bawah.', optional: true },
          { name: 'hanya_sekali', desc: 'TRUE untuk mengambil yang muncul tepat sekali saja.', optional: true },
        ],
      },
    ],
    examples: [
      { formula: '=COUNTA(UNIQUE(Inventaris!C2:C31))', result: String(new Set(inv.map((r) => r.CPU)).size), note: 'Ada berapa jenis CPU.' },
      { formula: '=UNIQUE(Inventaris!B2:B31)', result: [...new Set(inv.map((r) => r.RUANG))].join(' | '), note: 'Daftar ruang.' },
    ],
    practice: ['L3-03', 'L3-10', 'L3-14', 'L3-16'],
  },
  {
    id: 'ambil',
    title: 'Ambil sebagian: CHOOSECOLS, CHOOSEROWS, TAKE, DROP',
    intro: 'Empat fungsi pemotong tabel: pilih kolom tertentu saja (CHOOSECOLS), pilih baris tertentu (CHOOSEROWS), comot beberapa dari ujung (TAKE), atau buang beberapa dari ujung (DROP).',
    body: [
      'Bayangkan kamu baru saja menyaring tabel berisi 8 kolom dengan `FILTER`, tapi yang diminta soal cuma **kolom ke-1 (KODE)** dan **kolom ke-8 (HARGA)**. Di sinilah **CHOOSECOLS** beraksi!',
      '• **CHOOSECOLS(tabel, nomor_kolom1, nomor_kolom2, ...)** = memilih kolom nomor berapa saja yang mau ditampilkan (dihitung dari kiri mulai dari 1). Kamu bahkan bisa membalik urutan kolomnya, misalnya `CHOOSECOLS(A2:D51, 4, 3)` untuk menaruh kolom ke-4 di kiri kolom ke-3!',
      '• **CHOOSEROWS(tabel, nomor_baris1, ...)** = memilih baris nomor berapa saja yang mau diambil.',
      '• **TAKE(tabel, N)** = mengambil `N` baris paling atas (kalau diisi minus `-N`, artinya mengambil `N` baris paling bawah).',
      '• **DROP(tabel, N)** = membuang `N` baris paling atas (atau `-N` untuk membuang `N` baris paling bawah).',
    ],
    grid: {
      headers: ['Rumus', 'Hasilnya'],
      rows: [
        ['CHOOSECOLS(A2:H31,1,8)', 'Kolom ke-1 dan ke-8 saja (KODE dan HARGA)'],
        ['CHOOSEROWS(A2:H31,1,3)', 'Baris ke-1 dan ke-3 saja'],
        ['TAKE(A2:H31,5)', '5 baris teratas'],
        ['TAKE(A2:H31,-5)', '5 baris terbawah'],
        ['DROP(A1:H31,1)', 'Semua kecuali baris pertama (headernya dibuang)'],
        ['DROP(A2:H31,-3)', 'Semua kecuali 3 baris terbawah'],
      ],
    },
    examples: [
      { formula: '=AVERAGE(TAKE(SORT(Inventaris!H2:H31,,-1),5))', result: String(avg(hargaDesc.slice(0, 5))), note: 'Urutkan dari termahal, lalu TAKE 5 teratas untuk dihitung rata-ratanya.' },
      { formula: '=CHOOSECOLS(FILTER(Inventaris!A2:H31,Inventaris!G2:G31="Rusak"),1,8)', result: 'KODE dan HARGA PC rusak', note: 'FILTER mengambil semua kolom PC rusak, lalu CHOOSECOLS memilih kolom ke-1 dan ke-8 saja.' },
    ],
    practice: ['L3-05', 'L3-11', 'L3-12', 'L3-13', 'L3-23', 'L3-26'],
  },
  {
    id: 'gabung',
    title: 'Gabung dan bentuk ulang: VSTACK, HSTACK, TOCOL, TOROW',
    intro: 'VSTACK menumpuk dua tabel ke bawah (Vertikal). HSTACK menjejerkan dua tabel ke samping (Horizontal). TOCOL meratakan tabel jadi satu kolom panjang.',
    body: [
      'Bayangkan kamu punya daftar kode Asprak di satu sheet, dan daftar kode Aslab di sheet lain. Bagaimana cara menggabungkannya jadi satu daftar panjang dari atas ke bawah? Gunakan **VSTACK** (Vertical Stack / Tumpuk Vertikal)!',
      '• **VSTACK(range1, range2, ...)** = menumpuk `range2` tepat di bawah `range1`. Sangat berguna untuk menggabungkan data dari beberapa tabel atau menempelkan judul di atas hasil `FILTER`.',
      '• **HSTACK(range1, range2, ...)** = menjejerkan `range2` di sebelah kanan `range1`.',
      '• **TOCOL(tabel, [abaikan_kosong])** = menyulap tabel kotak (banyak baris × banyak kolom) menjadi **satu kolom lurus ke bawah**. Kalau argumen keduanya diisi **1**, semua sel yang kosong otomatis dibuang!',
    ],
    examples: [
      { formula: '=ROWS(VSTACK(Asprak!D2:D51,Aslab!A2:A9))', result: '58', note: 'Menumpuk 50 kode asprak + 8 kode aslab menjadi 58 baris.' },
      { formula: '=ROWS(TOCOL(Praktikan!E2:L41,1))', result: String(prak.flatMap((r) => M.map((m) => r[m])).filter((v) => v !== '').length), note: 'Menghitung berapa banyak nilai yang sudah terisi dari 40x8 sel.' },
    ],
    mistakes: ['Menumpuk dua tabel dengan jumlah kolom yang berbeda memakai VSTACK, sehingga kolom yang kurang muncul sebagai `#N/A`.'],
    practice: ['L3-07', 'L3-17', 'L3-18', 'L3-21', 'L3-25', 'L3-26'],
  },
  {
    id: 'sequence',
    title: 'SEQUENCE: bikin deret angka',
    intro: 'SEQUENCE membuat deret angka otomatis, misalnya 1 sampai 10, atau 10, 20, 30.',
    body: [
      '{{=SEQUENCE(5)}} menghasilkan 1, 2, 3, 4, 5 ke bawah. Kamu juga bisa mengatur jumlah kolom, angka awal, dan lompatannya.',
      'SEQUENCE sering dipakai sebagai "nomor urut" untuk fungsi lain. Contoh: ambil setiap data ke-10 dengan INDEX dan SEQUENCE.',
    ],
    syntax: [
      {
        formula: 'SEQUENCE(baris, [kolom], [mulai], [lompat])',
        args: [
          { name: 'baris', desc: 'Berapa angka ke bawah.' },
          { name: 'kolom', desc: 'Berapa angka ke samping. Bawaannya 1.', optional: true },
          { name: 'mulai', desc: 'Angka pertama. Bawaannya 1.', optional: true },
          { name: 'lompat', desc: 'Selisih tiap angka. Bawaannya 1.', optional: true },
        ],
      },
    ],
    examples: [
      { formula: '=SEQUENCE(5,1,10,10)', result: '10, 20, 30, 40, 50', note: '5 angka, mulai 10, lompat 10.' },
      { formula: '=SUM(SEQUENCE(50,1,2,2))', result: '2550', note: 'Jumlah bilangan genap 2 sampai 100.' },
    ],
    practice: ['L3-06', 'L3-19'],
  },
  {
    id: 'satu-sel',
    title: 'Menjawab di satu sel',
    intro: 'Di workbook latihan, jawaban harus muat di satu sel. Jadi hasil array perlu diringkas dulu.',
    body: [
      'FILTER, SORT, dan UNIQUE menghasilkan banyak sel. Supaya bisa dinilai, bungkus hasilnya dengan fungsi yang menghasilkan satu nilai.',
      'Pilih pembungkus sesuai pertanyaannya. Ini juga kebiasaan yang bagus untuk tes.',
    ],
    grid: {
      headers: ['Pertanyaannya', 'Bungkus dengan'],
      rows: [
        ['Ada berapa?', 'ROWS(...) atau COUNTA(...)'],
        ['Sebutkan semuanya', 'TEXTJOIN(", ",TRUE,...)'],
        ['Yang ke-N', 'INDEX(...,N)'],
        ['Totalnya / rata-ratanya', 'SUM(...) / AVERAGE(...)'],
        ['Yang terbesar', 'MAX(...) atau INDEX(SORT(...,,-1),1)'],
      ],
    },
    examples: [{ formula: '=TEXTJOIN(", ",TRUE,FILTER(Inventaris!A2:A31,Inventaris!D2:D31=32))', result: kode(inv.filter((r) => r.RAM === 32)).join(', '), note: 'Semua kode PC dengan RAM 32 GB dalam satu sel.' }],
  },
]

// ------------------------------------------------------------------ SOAL
const rusak = inv.filter((r) => r.STATUS === 'Rusak')
const sesi7 = uniqCi(pres.filter((r) => r.SESI === 7).map((r) => r.KODE as string))
const kodeCount = pres.reduce<Record<string, number>>((a, r) => ((a[r.KODE as string] = (a[r.KODE as string] ?? 0) + 1), a), {})
const kotorNames = uniqCi(DATA.AsprakKotor.rows.map((r) => proper(xtrim(String(r[2])))))
const allCodes = [...asp.map((r) => r.KODE as string), ...DATA.Aslab.rows.map((r) => r[0] as string)].sort(cmpText)
const blanks = prak.flatMap((r) => M.map((m) => r[m])).filter((v) => v === '').length
const minH = Math.min(...hargaAsc)
const maxH = Math.max(...hargaAsc)
const kelasList = [...new Set(prak.map((r) => r.KELAS as string))]
const kelasAvg = kelasList.map((k) => [k, avg(prak.filter((r) => r.KELAS === k).map((r) => r.M1))] as const).sort((a, b) => b[1] - a[1])
const labB = inv.filter((r) => r.RUANG === 'LAB B').sort((a, b) => (b.HARGA as number) - (a.HARGA as number))
const sortedByRuang = [...inv].sort((a, b) => cmpText(a.RUANG as string, b.RUANG as string) || (b.HARGA as number) - (a.HARGA as number))

export const questions: ExcelQuestion[] = [
  {
    id: 'L3-01',
    tier: 'mudah',
    topic: 'FILTER',
    title: 'Berapa yang rusak',
    prompt: 'Dengan FILTER, ambil KODE PC yang STATUS-nya `Rusak`, lalu hitung ada berapa baris hasilnya.',
    expected: () => rusak.length,
    fns: { all: ['FILTER'], anyOf: [['ROWS'], ['COUNTA']] },
    keys: [{ formula: '=ROWS(FILTER(Inventaris!A2:A31,Inventaris!G2:G31="Rusak"))' }, { formula: '=COUNTA(FILTER(Inventaris!A2:A31,Inventaris!G2:G31="Rusak"))' }],
    steps: ['FILTER(data, syarat) menghasilkan daftar kode.', 'ROWS menghitung berapa baris daftar itu.'],
  },
  {
    id: 'L3-02',
    tier: 'mudah',
    topic: 'FILTER',
    title: 'Daftar PC RAM 32',
    prompt: 'Sebutkan semua KODE PC yang RAM-nya 32 GB, digabung dengan pemisah koma dan spasi (`, `). Pakai FILTER dan TEXTJOIN.',
    expected: () => kode(inv.filter((r) => r.RAM === 32)).join(', '),
    fns: { all: ['FILTER', 'TEXTJOIN'] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,FILTER(Inventaris!A2:A31,Inventaris!D2:D31=32))' },
      { formula: '=TEXTJOIN(", ",TRUE,FILTER(Inventaris!A2:A31,Inventaris!D2:D31>=32))', note: '>=32 sama hasilnya karena RAM terbesar 32.' },
    ],
    steps: ['RAM angka, jadi tulis =32 tanpa tanda kutip.', 'TEXTJOIN(", ",TRUE, ...) menggabung hasil FILTER.'],
  },
  {
    id: 'L3-03',
    tier: 'mudah',
    topic: 'UNIQUE',
    title: 'Jenis CPU',
    prompt: 'Ada berapa jenis CPU berbeda di Inventaris? Pakai UNIQUE.',
    expected: () => new Set(inv.map((r) => r.CPU)).size,
    fns: { all: ['UNIQUE'] },
    keys: [{ formula: '=COUNTA(UNIQUE(Inventaris!C2:C31))' }, { formula: '=ROWS(UNIQUE(Inventaris!C2:C31))' }],
    steps: ['UNIQUE membuat daftar CPU tanpa dobel.', 'COUNTA atau ROWS menghitung panjang daftar itu.'],
  },
  {
    id: 'L3-04',
    tier: 'mudah',
    topic: 'SORT',
    title: 'Harga tertinggi ketiga',
    prompt: 'Urutkan HARGA dari terbesar dengan SORT, lalu ambil yang ke-3.',
    expected: () => hargaDesc[2],
    fns: { all: ['SORT'] },
    keys: [{ formula: '=INDEX(SORT(Inventaris!H2:H31,,-1),3)' }, { formula: '=LARGE(Inventaris!H2:H31,3)', note: 'Lebih pendek. Tidak lolos cek fungsi soal ini.' }],
    steps: ['SORT(range,,-1) urut dari besar. Dua koma karena nomor kolom dikosongkan.', 'INDEX(...,3) ambil yang ketiga.'],
  },
  {
    id: 'L3-05',
    tier: 'mudah',
    topic: 'CHOOSEROWS/TAKE/DROP',
    title: 'Materi modul 9 sampai 12',
    prompt: 'Gabungkan MATERI modul 9, 10, 11, dan 12 (sheet `Modul`) dengan pemisah `, `. Pakai CHOOSEROWS dan TEXTJOIN.',
    expected: () => DATA.Modul.rows.slice(8, 12).map((r) => r[2]).join(', '),
    fns: { all: ['CHOOSEROWS', 'TEXTJOIN'] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,CHOOSEROWS(Modul!C2:C17,9,10,11,12))' },
      { formula: '=TEXTJOIN(", ",TRUE,TAKE(DROP(Modul!C2:C17,8),4))', note: 'Buang 8 teratas, ambil 4. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['CHOOSEROWS(range, 9, 10, 11, 12) memilih baris ke-9 sampai ke-12 dari range.'],
  },
  {
    id: 'L3-06',
    tier: 'mudah',
    topic: 'SEQUENCE',
    title: 'Jumlah bilangan genap',
    prompt: 'Jumlahkan semua bilangan genap dari 2 sampai 100 dengan SEQUENCE.',
    expected: () => 2550,
    fns: { all: ['SEQUENCE'] },
    keys: [{ formula: '=SUM(SEQUENCE(50,1,2,2))' }, { formula: '=SUM(SEQUENCE(50)*2)' }],
    steps: ['Dari 2 sampai 100 ada 50 bilangan genap.', 'Mulai 2, lompat 2.'],
  },
  {
    id: 'L3-07',
    tier: 'mudah',
    topic: 'VSTACK/HSTACK',
    title: 'Gabung dua daftar',
    prompt: 'Tumpuk KODE asprak (`Asprak!D2:D51`) dan KODE aslab (`Aslab!A2:A9`) dengan VSTACK. Ada berapa baris hasilnya?',
    expected: () => 58,
    fns: { all: ['VSTACK'] },
    keys: [{ formula: '=ROWS(VSTACK(Asprak!D2:D51,Aslab!A2:A9))' }, { formula: '=COUNTA(VSTACK(Asprak!D2:D51,Aslab!A2:A9))' }],
    steps: ['VSTACK menyambung range kedua di bawah range pertama.'],
  },
  {
    id: 'L3-08',
    tier: 'sedang',
    topic: 'FILTER',
    title: 'Dua ruang, satu status',
    prompt: 'Berapa PC di `LAB A` **atau** `LAB E` yang STATUS-nya `Perbaikan`? Pakai FILTER.',
    expected: () => inv.filter((r) => (r.RUANG === 'LAB A' || r.RUANG === 'LAB E') && r.STATUS === 'Perbaikan').length,
    fns: { all: ['FILTER'] },
    keys: [
      { formula: '=ROWS(FILTER(Inventaris!A2:A31,((Inventaris!B2:B31="LAB A")+(Inventaris!B2:B31="LAB E"))*(Inventaris!G2:G31="Perbaikan")))' },
      { formula: '=COUNTIFS(Inventaris!B2:B31,"LAB A",Inventaris!G2:G31,"Perbaikan")+COUNTIFS(Inventaris!B2:B31,"LAB E",Inventaris!G2:G31,"Perbaikan")', note: 'Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['"Atau" ditulis dengan +, dan harus dikurung dulu.', 'Lalu dikali dengan syarat status ("dan").'],
  },
  {
    id: 'L3-09',
    tier: 'sedang',
    topic: 'FILTER',
    title: 'Kalau tidak ada',
    prompt: 'Ambil KODE PC di ruang `LAB F` dengan FILTER. Ruang itu tidak ada, jadi tampilkan `Tidak ada` lewat argumen ketiga FILTER.',
    expected: () => 'Tidak ada',
    fns: { all: ['FILTER'], forbid: ['IFERROR'] },
    keys: [{ formula: '=FILTER(Inventaris!A2:A31,Inventaris!B2:B31="LAB F","Tidak ada")' }, { formula: '=IFERROR(FILTER(Inventaris!A2:A31,Inventaris!B2:B31="LAB F"),"Tidak ada")', note: 'Bisa, tapi soal ini minta argumen ketiga FILTER.' }],
    steps: ['Tanpa argumen ketiga hasilnya #CALC!.'],
  },
  {
    id: 'L3-10',
    tier: 'sedang',
    topic: 'UNIQUE',
    title: 'Asprak sesi 7',
    prompt: 'Di sheet `Presensi`, ada berapa asprak berbeda (lihat KODE) yang punya baris dengan SESI = 7?',
    expected: () => sesi7.length,
    fns: { all: ['UNIQUE', 'FILTER'] },
    keys: [{ formula: '=COUNTA(UNIQUE(FILTER(Presensi!B2:B85,Presensi!D2:D85=7)))' }, { formula: '=ROWS(UNIQUE(FILTER(Presensi!B2:B85,Presensi!D2:D85=7)))' }],
    steps: ['FILTER dulu yang SESI-nya 7.', 'Satu asprak bisa muncul di beberapa kelas, jadi buang dobelnya dengan UNIQUE.'],
  },
  {
    id: 'L3-11',
    tier: 'sedang',
    topic: 'CHOOSEROWS/TAKE/DROP',
    title: 'Praktikan asprak RTD',
    prompt: 'FILTER seluruh tabel `Praktikan!A2:L41` untuk ASPRAK `RTD`, lalu ambil kolom NAMA saja dengan CHOOSECOLS. Gabungkan dengan `, `.',
    expected: () => prak.filter((r) => r.ASPRAK === 'RTD').map((r) => r.NAMA).join(', '),
    fns: { all: ['FILTER', 'CHOOSECOLS'] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,CHOOSECOLS(FILTER(Praktikan!A2:L41,Praktikan!D2:D41="RTD"),2))' },
      { formula: '=TEXTJOIN(", ",TRUE,FILTER(Praktikan!B2:B41,Praktikan!D2:D41="RTD"))', note: 'Langsung filter kolom NAMA. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['NAMA adalah kolom ke-2 dari A2:L41.'],
  },
  {
    id: 'L3-12',
    tier: 'sedang',
    topic: 'CHOOSEROWS/TAKE/DROP',
    title: 'Lima termahal',
    prompt: 'Hitung rata-rata 5 HARGA tertinggi dengan SORT dan TAKE.',
    expected: () => avg(hargaDesc.slice(0, 5)),
    fns: { all: ['SORT', 'TAKE'] },
    keys: [{ formula: '=AVERAGE(TAKE(SORT(Inventaris!H2:H31,,-1),5))' }, { formula: '=AVERAGE(TAKE(SORT(Inventaris!H2:H31),-5))', note: 'Urut naik, lalu ambil 5 dari bawah.' }],
    steps: ['Urutkan dari besar, lalu TAKE 5 baris teratas.'],
  },
  {
    id: 'L3-13',
    tier: 'sedang',
    topic: 'CHOOSEROWS/TAKE/DROP',
    title: 'Rata-rata tanpa ujung',
    prompt: 'Urutkan HARGA, buang 3 termurah dan 3 termahal dengan DROP, lalu hitung rata-rata sisanya.',
    expected: () => avg(hargaAsc.slice(3, -3)),
    fns: { all: ['DROP', 'SORT'] },
    keys: [{ formula: '=AVERAGE(DROP(DROP(SORT(Inventaris!H2:H31),3),-3))' }, { formula: '=TRIMMEAN(Inventaris!H2:H31,0.2)', note: 'TRIMMEAN membuang 20% data (3 atas, 3 bawah). Tidak lolos cek fungsi soal ini.' }],
    steps: ['DROP(...,3) membuang 3 teratas. DROP(...,-3) membuang 3 terbawah.'],
  },
  {
    id: 'L3-14',
    tier: 'sedang',
    topic: 'UNIQUE',
    title: 'Mengajar satu kelas saja',
    prompt: 'Ada berapa KODE asprak yang muncul **tepat satu kali** di `Presensi!B2:B85`? Pakai argumen ketiga UNIQUE.',
    expected: () => Object.values(kodeCount).filter((n) => n === 1).length,
    fns: { all: ['UNIQUE'] },
    keys: [{ formula: '=ROWS(UNIQUE(Presensi!B2:B85,,TRUE))' }, { formula: '=COUNTA(UNIQUE(Presensi!B2:B85,FALSE,TRUE))' }],
    steps: ['UNIQUE(data,,TRUE) hanya menyisakan yang muncul sekali.'],
  },
  {
    id: 'L3-15',
    tier: 'sedang',
    topic: 'SORT',
    title: 'Urut dua kunci',
    prompt: 'Urutkan KODE PC berdasarkan RUANG (A ke Z), lalu HARGA (terbesar duluan) dengan SORTBY. Apa KODE di urutan pertama?',
    expected: () => sortedByRuang[0].KODE,
    fns: { all: ['SORTBY'] },
    keys: [
      { formula: '=INDEX(SORTBY(Inventaris!A2:A31,Inventaris!B2:B31,1,Inventaris!H2:H31,-1),1)' },
      { formula: '=TAKE(SORTBY(Inventaris!A2:A31,Inventaris!B2:B31,1,Inventaris!H2:H31,-1),1)' },
    ],
    steps: ['SORTBY(data, patokan1, 1, patokan2, -1).', 'INDEX(...,1) ambil yang pertama.'],
  },
  {
    id: 'L3-16',
    tier: 'sulit',
    topic: 'UNIQUE',
    title: 'Nama unik dari data kotor',
    prompt: 'Sheet `AsprakKotor` berisi nama dengan spasi berlebih, huruf campur, dan baris dobel. Rapikan nama di `C2:C53` dengan TRIM dan PROPER **di dalam satu rumus**, lalu hitung ada berapa nama unik.',
    expected: () => kotorNames.length,
    fns: { all: ['UNIQUE', 'TRIM'] },
    keys: [{ formula: '=COUNTA(UNIQUE(PROPER(TRIM(AsprakKotor!C2:C53))))' }, { formula: '=ROWS(UNIQUE(TRIM(AsprakKotor!C2:C53)))', note: 'UNIQUE tidak peduli huruf besar kecil, jadi PROPER boleh dilewati.' }],
    steps: ['TRIM dan PROPER bisa langsung diberi range, hasilnya array.', 'Tanpa TRIM, "  ALDI" dan "ALDI" dianggap beda.'],
  },
  {
    id: 'L3-17',
    tier: 'sulit',
    topic: 'VSTACK/HSTACK',
    title: 'Lima kode pertama A-Z',
    prompt: 'Tumpuk KODE asprak dan KODE aslab dengan VSTACK, urutkan A ke Z, ambil 5 teratas, lalu gabung dengan `, `.',
    expected: () => allCodes.slice(0, 5).join(', '),
    fns: { all: ['VSTACK', 'SORT', 'TAKE'] },
    keys: [{ formula: '=TEXTJOIN(", ",TRUE,TAKE(SORT(VSTACK(Asprak!D2:D51,Aslab!A2:A9)),5))' }, { formula: '=TEXTJOIN(", ",TRUE,TAKE(SORT(VSTACK(Aslab!A2:A9,Asprak!D2:D51)),5))', note: 'Urutan tumpukan tidak penting karena diurutkan setelahnya.' }],
    steps: ['Kerjakan dari dalam ke luar: VSTACK, lalu SORT, lalu TAKE, lalu TEXTJOIN.'],
  },
  {
    id: 'L3-18',
    tier: 'sulit',
    topic: 'TOCOL/TOROW',
    title: 'Berapa yang tidak hadir',
    prompt: 'Nilai kosong di `Praktikan!E2:L41` artinya tidak hadir. Hitung jumlah sel kosongnya dengan TOCOL: semua sel dikurangi sel yang terisi.',
    expected: () => blanks,
    fns: { all: ['TOCOL'] },
    keys: [
      { formula: '=ROWS(TOCOL(Praktikan!E2:L41))-ROWS(TOCOL(Praktikan!E2:L41,1))' },
      { formula: '=COUNTBLANK(Praktikan!E2:L41)', note: 'Jauh lebih pendek. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['TOCOL(range) mengubah 40x8 sel jadi 320 baris.', 'TOCOL(range,1) membuang yang kosong.', 'Selisihnya adalah jumlah sel kosong.'],
  },
  {
    id: 'L3-19',
    tier: 'sulit',
    topic: 'SEQUENCE',
    title: 'Setiap urutan ke-10',
    prompt: 'Ambil NAMA asprak di urutan ke-10, 20, 30, 40, dan 50 dari `Asprak!C2:C51` dengan INDEX dan SEQUENCE, lalu gabung dengan `, `.',
    expected: () => [9, 19, 29, 39, 49].map((i) => asp[i].NAMA).join(', '),
    fns: { all: ['SEQUENCE'], anyOf: [['INDEX'], ['CHOOSEROWS']] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,INDEX(Asprak!C2:C51,SEQUENCE(5,1,10,10)))' },
      { formula: '=TEXTJOIN(", ",TRUE,CHOOSEROWS(Asprak!C2:C51,SEQUENCE(5,,10,10)))' },
    ],
    steps: ['SEQUENCE(5,1,10,10) = 10, 20, 30, 40, 50.', 'INDEX bisa menerima daftar nomor sekaligus.'],
  },
  {
    id: 'L3-20',
    tier: 'sulit',
    topic: 'FILTER',
    title: 'Tiga termahal di LAB B',
    prompt: 'Sebutkan KODE 3 PC termahal di `LAB B`, dari yang termahal, digabung dengan `, `. Pakai FILTER, SORT, TAKE, dan CHOOSECOLS.',
    expected: () => kode(labB.slice(0, 3)).join(', '),
    fns: { all: ['FILTER', 'TAKE'], anyOf: [['SORT'], ['SORTBY']] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,CHOOSECOLS(TAKE(SORT(FILTER(Inventaris!A2:H31,Inventaris!B2:B31="LAB B"),8,-1),3),1))' },
      { formula: '=TEXTJOIN(", ",TRUE,TAKE(SORTBY(FILTER(Inventaris!A2:A31,Inventaris!B2:B31="LAB B"),FILTER(Inventaris!H2:H31,Inventaris!B2:B31="LAB B"),-1),3))' },
    ],
    steps: ['FILTER seluruh kolom untuk LAB B.', 'SORT berdasarkan kolom ke-8 (HARGA), -1.', 'TAKE 3 baris, lalu CHOOSECOLS kolom 1 (KODE).'],
  },
  {
    id: 'L3-21',
    tier: 'sulit',
    topic: 'VSTACK/HSTACK',
    title: 'Termurah dan termahal',
    prompt: 'Cari KODE PC termurah dan termahal dengan XLOOKUP, jejerkan dengan HSTACK, lalu gabung dengan pemisah ` - `. Hasilnya seperti `X-01 - Y-02`.',
    expected: () => `${inv.find((r) => r.HARGA === minH)!.KODE} - ${inv.find((r) => r.HARGA === maxH)!.KODE}`,
    fns: { all: ['HSTACK'] },
    keys: [
      { formula: '=TEXTJOIN(" - ",TRUE,HSTACK(XLOOKUP(MIN(Inventaris!H2:H31),Inventaris!H2:H31,Inventaris!A2:A31),XLOOKUP(MAX(Inventaris!H2:H31),Inventaris!H2:H31,Inventaris!A2:A31)))' },
      { formula: '=XLOOKUP(MIN(Inventaris!H2:H31),Inventaris!H2:H31,Inventaris!A2:A31)&" - "&XLOOKUP(MAX(Inventaris!H2:H31),Inventaris!H2:H31,Inventaris!A2:A31)', note: 'Pakai &. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['XLOOKUP(MIN(harga), harga, kode) memberi kode termurah.', 'HSTACK menjejerkan dua hasil jadi satu baris dua kolom.'],
  },
  {
    id: 'L3-22',
    tier: 'sulit',
    topic: 'UNIQUE',
    title: 'Kelas terbaik di M1',
    prompt: 'Kelas mana yang rata-rata nilai M1-nya paling tinggi di sheet `Praktikan`? Buat daftar kelas dengan UNIQUE, hitung rata-rata tiap kelas dengan AVERAGEIF, lalu urutkan dengan SORTBY.',
    expected: () => kelasAvg[0][0],
    fns: { all: ['UNIQUE', 'SORTBY'] },
    keys: [
      { formula: '=INDEX(SORTBY(UNIQUE(Praktikan!C2:C41),AVERAGEIF(Praktikan!C2:C41,UNIQUE(Praktikan!C2:C41),Praktikan!E2:E41),-1),1)' },
      { formula: '=LET(k,UNIQUE(Praktikan!C2:C41),r,AVERAGEIF(Praktikan!C2:C41,k,Praktikan!E2:E41),XLOOKUP(MAX(r),r,k))', note: 'Versi LET (Level 4). Tidak lolos cek fungsi soal ini.' },
    ],
    steps: ['AVERAGEIF bisa diberi daftar kriteria, hasilnya daftar rata-rata.', `Rata-ratanya: ${kelasAvg.map(([k, v]) => `${k} ${Math.round(v * 100) / 100}`).join(', ')}.`],
  },
  {
    id: 'L3-23',
    tier: 'mudah',
    topic: 'CHOOSEROWS/TAKE/DROP',
    title: 'Ambil kolom ke-8 dengan CHOOSECOLS',
    prompt: 'Potong kolom ke-8 (HARGA) dari seluruh tabel `Inventaris!A2:H31` menggunakan **CHOOSECOLS**, lalu ambil baris ke-15 dengan **INDEX** (dilarang memakai OFFSET, VLOOKUP, atau XLOOKUP).',
    expected: () => inv[14].HARGA,
    fns: { all: ['CHOOSECOLS', 'INDEX'], forbid: ['OFFSET', 'VLOOKUP', 'XLOOKUP'] },
    keys: [
      { formula: '=INDEX(CHOOSECOLS(Inventaris!A2:H31,8),15)' },
      { formula: '=CHOOSEROWS(CHOOSECOLS(Inventaris!A2:H31,8),15)', note: 'Pakai CHOOSEROWS. Tidak lolos cek fungsi soal ini.' },
    ],
    steps: [
      'CHOOSECOLS(Inventaris!A2:H31, 8) mengambil hanya kolom ke-8 (HARGA) dari tabel Inventaris.',
      'INDEX(..., 15) mengambil nilai pada urutan baris ke-15.',
    ],
  },
  {
    id: 'L3-24',
    tier: 'sedang',
    topic: 'FILTER',
    title: 'Total harga LAB A yang Baik dengan FILTER',
    prompt: 'Hitung total HARGA untuk PC di ruang `LAB A` yang berstatus `Baik`. Wajib memakai **SUM** dan **FILTER** dengan dua syarat perkalian `*` (dilarang memakai SUMIF atau SUMIFS).',
    expected: () => sum(inv.filter((r) => r.RUANG === 'LAB A' && r.STATUS === 'Baik').map((r) => r.HARGA)),
    fns: { all: ['SUM', 'FILTER'], forbid: ['SUMIF', 'SUMIFS'] },
    keys: [
      { formula: '=SUM(FILTER(Inventaris!H2:H31,(Inventaris!B2:B31="LAB A")*(Inventaris!G2:G31="Baik")))' },
      { formula: '=SUM(CHOOSECOLS(FILTER(Inventaris!A2:H31,(Inventaris!B2:B31="LAB A")*(Inventaris!G2:G31="Baik")),8))' },
    ],
    steps: [
      'Saring kolom HARGA (H2:H31) dengan dua syarat DAN: (B2:B31="LAB A")*(G2:G31="Baik").',
      'Jumlahkan hasil saringannya dengan SUM.',
    ],
  },
  {
    id: 'L3-25',
    tier: 'sedang',
    topic: 'VSTACK/HSTACK',
    title: 'Gabung kode asprak dari dua sheet',
    prompt: 'Tumpuk kolom ASPRAK di `Praktikan!D2:D41` dan kolom KODE di `Presensi!B2:B85` menggunakan **VSTACK**, buang duplikatnya dengan **UNIQUE**, lalu hitung ada berapa kode unik.',
    expected: () => uniqCi([...prak.map((r) => r.ASPRAK as string), ...pres.map((r) => r.KODE as string)]).length,
    fns: { all: ['VSTACK', 'UNIQUE'], anyOf: [['COUNTA'], ['ROWS']] },
    keys: [
      { formula: '=COUNTA(UNIQUE(VSTACK(Praktikan!D2:D41,Presensi!B2:B85)))' },
      { formula: '=ROWS(UNIQUE(VSTACK(Praktikan!D2:D41,Presensi!B2:B85)))' },
    ],
    steps: [
      'VSTACK menumpuk daftar kode asprak dari kedua sheet menjadi satu kolom.',
      'UNIQUE menyisakan satu untuk setiap kode yang kembar, lalu COUNTA/ROWS menghitung jumlahnya.',
    ],
  },
  {
    id: 'L3-26',
    tier: 'sulit',
    topic: 'VSTACK/HSTACK',
    title: 'Kombinasi VSTACK, FILTER, dan CHOOSECOLS',
    prompt: 'Saring seluruh tabel `Inventaris!A2:H31` untuk ruang `LAB C` dengan **FILTER**, saring juga untuk ruang `LAB D`, tumpuk kedua hasil filter tersebut dengan **VSTACK**, pilih kolom ke-1 (KODE) saja dengan **CHOOSECOLS**, lalu gabungkan dengan `, ` memakai **TEXTJOIN**.',
    expected: () => [...inv.filter((r) => r.RUANG === 'LAB C'), ...inv.filter((r) => r.RUANG === 'LAB D')].map((r) => r.KODE).join(', '),
    fns: { all: ['VSTACK', 'FILTER', 'CHOOSECOLS', 'TEXTJOIN'] },
    keys: [
      { formula: '=TEXTJOIN(", ",TRUE,CHOOSECOLS(VSTACK(FILTER(Inventaris!A2:H31,Inventaris!B2:B31="LAB C"),FILTER(Inventaris!A2:H31,Inventaris!B2:B31="LAB D")),1))' },
      { formula: '=TEXTJOIN(", ",TRUE,VSTACK(CHOOSECOLS(FILTER(Inventaris!A2:H31,Inventaris!B2:B31="LAB C"),1),CHOOSECOLS(FILTER(Inventaris!A2:H31,Inventaris!B2:B31="LAB D"),1)))' },
    ],
    steps: [
      'Saring baris LAB C dan baris LAB D masing-masing dengan FILTER(Inventaris!A2:H31, ...).',
      'Tumpuk keduanya ke bawah dengan VSTACK.',
      'Ambil kolom ke-1 (KODE) dengan CHOOSECOLS(..., 1), lalu satukan dengan TEXTJOIN(", ", TRUE, ...).',
    ],
  },
]

// ------------------------------------------------------------------ KUIS
const quiz: QuizQ[] = [
  {
    id: 'q3-1',
    type: 'mcq',
    kind: 'error',
    q: 'Rumus `=UNIQUE(A2:A20)` di F2 malah menampilkan `#SPILL!`. Penyebab paling mungkin?',
    options: ['Ada isi di sel bawah F2 yang menghalangi hasil', 'A2:A20 tidak punya data dobel', 'UNIQUE harus diakhiri Ctrl+Shift+Enter', 'Kolom A berisi angka'],
    answer: 0,
    why: 'Hasil UNIQUE butuh tempat beberapa sel ke bawah. Kalau ada yang terisi, hasilnya tidak bisa tumpah.',
  },
  {
    id: 'q3-2',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=ROWS(FILTER(A2:A6,B2:B6>5))',
    table: { headers: ['NAMA', 'NILAI'], rows: [['Ana', 7], ['Budi', 3], ['Cici', 9], ['Dodi', 5], ['Eka', 6]] },
    accept: ['3'],
    mode: 'number',
    why: 'Yang lebih dari 5: Ana (7), Cici (9), Eka (6). Nilai 5 tidak termasuk karena syaratnya > bukan >=.',
  },
  {
    id: 'q3-3',
    type: 'mcq',
    kind: 'konsep',
    q: 'Syarat FILTER untuk "ruang LAB A **atau** LAB B" yang benar?',
    options: ['(B2:B31="LAB A")+(B2:B31="LAB B")', '(B2:B31="LAB A")*(B2:B31="LAB B")', 'OR(B2:B31="LAB A",B2:B31="LAB B")', 'B2:B31="LAB A","LAB B"'],
    answer: 0,
    why: 'Penjumlahan = atau. Perkalian = dan (tidak mungkin satu sel sekaligus LAB A dan LAB B). OR hanya memberi satu nilai, bukan per baris.',
  },
  {
    id: 'q3-4',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya? Tulis angkanya dipisah koma.',
    formula: '=SEQUENCE(4,1,5,5)',
    accept: ['5,10,15,20', '5, 10, 15, 20'],
    mode: 'text',
    why: '4 angka, mulai 5, lompat 5.',
  },
  {
    id: 'q3-5',
    type: 'mcq',
    kind: 'konsep',
    q: 'Apa arti `F2#`?',
    options: ['Seluruh hasil spill yang dimulai di F2', 'Nomor baris F2', 'Sel F2 dikunci', 'Komentar di F2'],
    answer: 0,
    why: '# menunjuk seluruh area hasil spill. Kalau hasilnya bertambah panjang, F2# ikut menyesuaikan.',
  },
  {
    id: 'q3-6',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=TAKE({10;20;30;40;50},-2)',
    accept: ['40,50', '40, 50', '40;50'],
    mode: 'text',
    why: 'Angka negatif mengambil dari bawah: 2 terakhir, yaitu 40 dan 50.',
  },
  {
    id: 'q3-7',
    type: 'mcq',
    kind: 'tebak',
    q: '`=UNIQUE({"a";"b";"a";"c"},,TRUE)` menghasilkan?',
    options: ['b dan c', 'a, b, c', 'a', 'Error'],
    answer: 0,
    why: 'Argumen ketiga TRUE hanya menyisakan yang muncul tepat satu kali. "a" muncul dua kali.',
  },
  {
    id: 'q3-8',
    type: 'mcq',
    kind: 'error',
    q: '`=FILTER(A2:A31,G2:G31="Hilang")` menghasilkan `#CALC!`. Artinya?',
    options: ['Tidak ada baris yang cocok', 'Range salah ukuran', 'Ada sel penghalang', 'Fungsi tidak dikenal'],
    answer: 0,
    why: 'FILTER yang hasilnya kosong memberi #CALC!. Tambahkan argumen ketiga, misalnya "Tidak ada".',
  },
  {
    id: 'q3-9',
    type: 'isian',
    kind: 'tebak',
    q: 'Apa hasilnya?',
    formula: '=COLUMNS(HSTACK(A1:B5,D1:D5))',
    accept: ['3'],
    mode: 'number',
    why: 'Dua kolom (A:B) dijejer dengan satu kolom (D). Total 3 kolom.',
  },
  {
    id: 'q3-10',
    type: 'mcq',
    kind: 'konsep',
    q: 'Bedanya SORT dan SORTBY?',
    options: [
      'SORTBY boleh mengurutkan berdasarkan kolom yang tidak ikut ditampilkan',
      'SORT hanya untuk angka',
      'SORTBY hanya bisa urut turun',
      'Tidak ada bedanya',
    ],
    answer: 0,
    why: 'SORT memakai nomor kolom di dalam data. SORTBY menerima range patokan terpisah, jadi lebih bebas.',
  },
  {
    id: 'q3-11',
    type: 'mcq',
    kind: 'tebak',
    q: 'Range A1:B2 berisi 1, 2 (baris 1) dan 3, 4 (baris 2). `=TOROW(A1:B2)` menghasilkan?',
    options: ['1 2 3 4 dalam satu baris', '1 3 2 4 dalam satu baris', '1 2 3 4 dalam satu kolom', 'Error'],
    answer: 0,
    why: 'TOROW membaca per baris (kiri ke kanan, lalu baris berikutnya) dan menjejerkannya dalam satu baris.',
  },
  {
    id: 'q3-12',
    type: 'mcq',
    kind: 'error',
    q: 'Rumus `=FILTER(A2:A31,AND(B2:B31="LAB A",G2:G31="Baik"))` hasilnya salah. Kenapa?',
    options: ['AND menghasilkan satu nilai saja, bukan per baris. Pakai perkalian', 'FILTER tidak boleh dua syarat', 'Teks harus huruf kecil', 'Harus pakai IF'],
    answer: 0,
    why: 'AND merangkum semua baris jadi satu TRUE/FALSE. Untuk per baris: (B2:B31="LAB A")*(G2:G31="Baik").',
  },
]

const order = { mudah: 0, sedang: 1, sulit: 2 }
questions.sort((a, b) => order[a.tier] - order[b.tier])

export const level3: Level = {
  n: 3,
  slug: 'array',
  title: 'Array dan Spill',
  short: 'FILTER, SORT, UNIQUE, CHOOSECOLS, VSTACK, TAKE, SEQUENCE',
  goal: 'Bisa menyaring, mengurutkan, memotong, dan menggabung data dengan satu rumus.',
  day: 'Selasa siang',
  concepts,
  questions,
  quiz,
}
