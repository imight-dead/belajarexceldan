import { paperName, type DocxFacts } from '../lib/docxCheck'

// Empat dokumen target untuk latihan Word. PDF-nya dibuat oleh scripts/word dan disimpan di public/word.
// Rubrik dipakai juga oleh skrip verifikasi: dokumen kunci harus lolos 100%.

export interface RubricItem {
  id: string
  label: string
  test: (f: DocxFacts) => boolean
  hint: string
}

export interface GuideRule {
  section: string
  spec: string
}

export interface WordTarget {
  id: string
  title: string
  pdf: string
  minutes: number
  level: 'Dasar' | 'Menengah' | 'Sulit'
  about: string
  skills: string[]
  guide: GuideRule[]
  rubric: RubricItem[]
}

const near = (a: number, b: number) => Math.abs(a - b) <= 0.15
const a4: RubricItem = {
  id: 'a4',
  label: 'Kertas A4',
  test: (f) => f.sections.length > 0 && f.sections.every((s) => paperName(s) === 'A4'),
  hint: 'Layout > Size > A4. Default template berantakan memakai Letter.',
}
const clean: RubricItem = {
  id: 'clean',
  label: 'Tidak ada judul palsu dan Enter berderet',
  test: (f) => f.fakeHeadings.length === 0 && f.emptyStreaks === 0,
  hint: 'Judul wajib pakai style Heading. Hapus Enter kosong berderet dan pindah halaman pakai Ctrl+Enter.',
}
const tocItem: RubricItem = {
  id: 'toc',
  label: 'Daftar isi otomatis',
  test: (f) => f.toc,
  hint: 'Hapus daftar isi manual di template, lalu pasang References > Table of Contents.',
}

export const WORD_TARGETS: WordTarget[] = [
  {
    id: 'modul',
    title: 'Modul Praktikum (Rapikan Template)',
    pdf: 'word/target-modul.pdf',
    minutes: 25,
    level: 'Dasar',
    about: 'Sesuai kisi-kisi: unduh template .docx modul yang ukuran & jenis font-nya sudah diacak-acak, lalu rapikan formatnya mengikuti Panduan Ketentuan Format dan contoh PDF.',
    skills: ['Rapikan Font & Style Normal', 'Style Heading 1 dan 2', 'Penomoran bab otomatis (1, 1.1)', 'Daftar isi otomatis', 'Bullet dan numbering', 'Caption tabel', 'Header dan nomor halaman'],
    guide: [
      { section: 'Kertas & Margin', spec: 'Ubah kertas dari Letter menjadi **A4** (`Layout > Size > A4`), Margin Normal (2,54 cm di semua sisi).' },
      { section: 'Teks Isi (Style Normal)', spec: 'Seragamkan seluruh teks isi memakai font **Calibri 11 pt**, spasi setelah paragraf (Spacing After) 6 pt. Tips cepat: tekan `Ctrl+A` lalu klik `Clear All Formatting` atau modifikasi Style **Normal**.' },
      { section: 'Sampul & Pindah Halaman', spec: 'Judul modul memakai Style **Title** (Calibri 22 pt Bold, rata tengah), subjudul memakai **Subtitle**. Hapus Enter berderet di bawah tahun `2026` lalu ganti dengan **Page Break (`Ctrl+Enter`)**.' },
      { section: 'Daftar Isi Otomatis', spec: 'Hapus daftar isi titik-titik manual di halaman 2, lalu sisipkan **References > Table of Contents (Automatic Table)** dan akhiri dengan **Page Break (`Ctrl+Enter`)**.' },
      { section: 'Judul Bab & Subbab', spec: 'Hapus angka manual di depan bab/subbab, pasang Style **Heading 1** (Calibri 15 pt Bold) untuk 3 judul bab (`Pendahuluan`, `Dasar Teori`, `Langkah Praktikum`) dan **Heading 2** (Calibri 12,5 pt Bold) untuk 6 subbab. Aktifkan **Home > Multilevel List (`1 Heading 1, 1.1 Heading 2`)**.' },
      { section: 'Daftar Poin & Langkah', spec: 'Hapus tanda `-` dan angka `1.` manual, ganti dengan tombol **Bullets** (pada Tujuan & Alat Bahan) serta **Numbering** (pada Langkah Praktikum & Tugas).' },
      { section: 'Tabel & Caption', spec: 'Rapikan font di dalam tabel menjadi Calibri 11 pt. Hapus tulisan `"Tabel 1..."` manual di atas tabel, ganti dengan **References > Insert Caption** (Label: `Tabel`).' },
      { section: 'Header & Footer', spec: 'Isi **Header** dengan teks `Modul Praktikum Sistem Operasi` (rata kanan), dan pasang **nomor halaman otomatis** di **Footer** (`Insert > Page Number > Bottom of Page`).' },
    ],
    rubric: [
      a4,
      { id: 'h1', label: 'Minimal 3 judul bab (Heading 1)', test: (f) => f.headings[1] >= 3, hint: 'Pilih judul bab, klik Heading 1 di Home > Styles.' },
      { id: 'h2', label: 'Minimal 4 subjudul (Heading 2)', test: (f) => f.headings[2] >= 4, hint: 'Subbab pakai Heading 2.' },
      {
        id: 'num',
        label: 'Nomor bab dan subbab otomatis',
        test: (f) => f.headingTexts.filter((h) => h.level <= 2).length > 0 && f.headingTexts.filter((h) => h.level <= 2).every((h) => h.numbered),
        hint: 'Klik heading pertama, Home > Multilevel List, pilih yang bertuliskan "1 Heading 1, 1.1 Heading 2". Jangan ketik angkanya sendiri.',
      },
      tocItem,
      { id: 'cover', label: 'Sampul dipisah dengan page break', test: (f) => f.pageBreaks >= 1, hint: 'Di akhir sampul tekan Ctrl+Enter.' },
      { id: 'list', label: 'Minimal 5 poin pakai bullet/numbering otomatis', test: (f) => f.listParas >= 5, hint: 'Home > Bullets atau Numbering.' },
      { id: 'tabel', label: 'Tabel dengan caption otomatis "Tabel"', test: (f) => f.tables >= 1 && (f.seq.Tabel ?? 0) >= 1, hint: 'Klik tabel, References > Insert Caption, Label: Tabel (buat dengan New Label kalau belum ada).' },
      { id: 'header', label: 'Ada teks di header', test: (f) => f.headerText, hint: 'Insert > Header, ketik judul modul.' },
      { id: 'page', label: 'Nomor halaman otomatis', test: (f) => f.footerPage, hint: 'Insert > Page Number > Bottom of Page.' },
      clean,
    ],
  },
  {
    id: 'surat',
    title: 'Surat Pengumuman (Rapikan Template)',
    pdf: 'word/target-surat.pdf',
    minutes: 20,
    level: 'Dasar',
    about: 'Template surat satu halaman yang font-nya belang-belang, kop suratnya masih di body, dan titik duanya disejajarkan pakai spasi manual. Rapikan sesuai panduan.',
    skills: ['Kop surat di header', 'Tab stop untuk merapikan titik dua', 'Numbering', 'Tabel', 'Tabel tanpa garis untuk tanda tangan'],
    guide: [
      { section: 'Kertas & Font Normal', spec: 'Ubah ukuran kertas menjadi **A4**. Seragamkan seluruh teks surat menjadi **Calibri 11 pt** (hapus Enter kosong berderet).' },
      { section: 'Kop Surat di Header', spec: 'Pindahkan 3 baris kop `LABORATORIUM INFORMATIKA...` dari isi dokumen ke dalam **Header** (`Insert > Header`), rata tengah, dan beri garis bawah ganda (`Bottom Border`).' },
      { section: 'Nomor, Lampiran, Perihal', spec: 'Hapus spasi berderet sebelum tanda titik dua (`:`), lalu gunakan tombol **Tab** dengan posisi **Tab Stop** yang sejajar.' },
      { section: 'Daftar Syarat', spec: 'Hapus angka `1.` sampai `5.` yang diketik manual, lalu ubah menjadi daftar **Numbering otomatis** (`Home > Numbering`).' },
      { section: 'Tabel & Tanda Tangan', spec: 'Rapikan font tabel jadwal. Untuk blok tanda tangan di kanan bawah, hapus spasi berderet di depannya dan masukkan ke dalam **tabel 2 kolom tanpa garis (`No Border`)**.' },
    ],
    rubric: [
      a4,
      { id: 'kop', label: 'Kop surat ditaruh di header', test: (f) => f.headerText, hint: 'Insert > Header > Blank, lalu ketik nama lembaga. Garis bawah kop: Home > Borders > Bottom Border.' },
      {
        id: 'tab',
        label: 'Titik dua dirapikan dengan Tab, bukan spasi',
        test: (f) => f.tabs >= 3 && f.spaceRuns.length === 0,
        hint: 'Ketik "Nomor", tekan Tab, lalu ": ...". Atur posisi tab lewat penggaris atau Paragraph > Tabs.',
      },
      { id: 'list', label: 'Syarat pakai numbering otomatis (minimal 4)', test: (f) => f.listParas >= 4, hint: 'Blok daftar syarat, klik Numbering.' },
      { id: 'tabel', label: 'Jadwal dibuat sebagai tabel', test: (f) => f.tables >= 1, hint: 'Insert > Table.' },
      { id: 'single', label: 'Satu halaman, satu section', test: (f) => f.sections.length === 1, hint: 'Surat ini tidak butuh section break.' },
      clean,
    ],
  },
  {
    id: 'laporan',
    title: 'Laporan Praktikum (Rapikan Template)',
    pdf: 'word/target-laporan.pdf',
    minutes: 40,
    level: 'Sulit',
    about: 'Template laporan praktikum lengkap yang font-nya diacak, belum dibagi section, dan daftar isinya masih manual. Benerin sesuai format standar kampus.',
    skills: ['Margin dan spasi', 'Section break', 'Nomor halaman romawi lalu angka', 'Daftar isi dan daftar gambar', 'Caption gambar dan tabel', 'Footnote', 'Halaman landscape', 'Hanging indent'],
    guide: [
      { section: 'Kertas, Margin & Spasi', spec: 'Kertas **A4**, Margin **Kiri 4 cm, Atas 3 cm, Kanan 3 cm, Bawah 3 cm** (`Custom Margins`). Modifikasi Style **Normal** menjadi **Times New Roman 11 pt**, **Line spacing 1,5 lines**.' },
      { section: 'Pembagian Section & Nomor Halaman', spec: 'Pisahkan Sampul, Halaman Awal (Kata Pengantar/Daftar Isi), dan Isi Laporan (BAB I dst.) dengan **Layout > Breaks > Section Breaks (Next Page)**. Halaman awal bernomor **romawi (`i, ii, iii`)**, sedangkan BAB I mulai dari **halaman `1`** (matikan `Link to Previous` di footer).' },
      { section: 'Heading, Daftar Isi & Daftar Gambar', spec: 'Terapkan **Heading 1** untuk `KATA PENGANTAR`, `BAB I`, `BAB II`, `BAB III`, `DAFTAR PUSTAKA`, dan **Heading 2** untuk subbab (`1.1`, `1.2`, `2.1`, `2.2`). Ganti daftar isi & daftar gambar manual dengan **Table of Contents** dan **Insert Table of Figures** otomatis.' },
      { section: 'Caption & Footnote', spec: 'Ganti teks caption manual pada grafik dan kedua tabel dengan **References > Insert Caption** (label `Gambar` dan `Tabel`). Sisipkan **Footnote (`Ctrl+Alt+F`)** pada kalimat penjadwalan prioritas di Bab 1.1.' },
      { section: 'Halaman Landscape & Daftar Pustaka', spec: 'Apit halaman Tabel 2 (tabel lebar 8 kolom) dengan **Section Break (Next Page)** sebelum dan sesudahnya, lalu ubah orientasi section tersebut menjadi **Landscape**. Pada Daftar Pustaka, terapkan **Hanging Indent** (`Paragraph > Special: Hanging`).' },
    ],
    rubric: [
      a4,
      {
        id: 'margin',
        label: 'Margin kiri 4, atas 3, kanan 3, bawah 3 cm',
        test: (f) => f.sections.filter((s) => !s.landscape).every((s) => near(s.margin.left, 4) && near(s.margin.top, 3) && near(s.margin.right, 3) && near(s.margin.bottom, 3)),
        hint: 'Layout > Margins > Custom Margins. Isi dalam cm.',
      },
      { id: 'spasi', label: 'Spasi baris 1,5 di style Normal', test: (f) => f.lineSpacing !== null && near(f.lineSpacing, 1.5), hint: 'Klik kanan style Normal > Modify > Format > Paragraph > Line spacing 1.5 lines.' },
      { id: 'section', label: 'Minimal 3 section', test: (f) => f.sections.length >= 3, hint: 'Layout > Breaks > Section Breaks > Next Page, di akhir sampul dan di akhir halaman awal.' },
      { id: 'roman', label: 'Halaman awal bernomor romawi (i, ii, iii)', test: (f) => f.sections.some((s) => s.pgFmt === 'lowerRoman'), hint: 'Klik footer section kedua, Page Number > Format Page Numbers > i, ii, iii.' },
      {
        id: 'restart',
        label: 'Isi laporan mulai dari halaman 1',
        test: (f) => {
          const i = f.sections.findIndex((s) => s.pgFmt === 'lowerRoman')
          return i >= 0 && f.sections.slice(i + 1).some((s) => (s.pgFmt === undefined || s.pgFmt === 'decimal') && s.pgStart === 1)
        },
        hint: 'Di section isi: Format Page Numbers > Start at: 1. Matikan "Link to Previous" di footer.',
      },
      tocItem,
      { id: 'tof', label: 'Daftar gambar otomatis', test: (f) => f.tof, hint: 'References > Insert Table of Figures, Caption label: Gambar.' },
      { id: 'caption', label: 'Caption Gambar dan Tabel otomatis', test: (f) => (f.seq.Gambar ?? 0) >= 1 && (f.seq.Tabel ?? 0) >= 1, hint: 'References > Insert Caption. Buat label Gambar dan Tabel.' },
      { id: 'footnote', label: 'Minimal 1 footnote', test: (f) => f.footnotes >= 1, hint: 'References > Insert Footnote (Ctrl+Alt+F).' },
      { id: 'landscape', label: 'Satu halaman landscape untuk tabel lebar', test: (f) => f.sections.some((s) => s.landscape), hint: 'Pasang section break sebelum dan sesudah tabel, lalu Orientation > Landscape hanya untuk section itu.' },
      { id: 'bab', label: 'Minimal 3 bab (Heading 1)', test: (f) => f.headings[1] >= 3, hint: 'BAB I, BAB II, BAB III pakai Heading 1.' },
      { id: 'pustaka', label: 'Daftar pustaka pakai hanging indent', test: (f) => f.hangingIndent >= 2, hint: 'Paragraph > Indentation > Special: Hanging 1,27 cm.' },
      clean,
    ],
  },
  {
    id: 'tatib',
    title: 'Tata Tertib dan Jadwal Lab (Rapikan Template)',
    pdf: 'word/target-tatib.pdf',
    minutes: 25,
    level: 'Menengah',
    about: 'Template tata tertib & jadwal yang ukuran hurufnya berantakan, daftar poinnya diketik manual, dan tabel jadwalnya belum mengulang baris judul di halaman kedua.',
    skills: ['Kolom', 'Daftar bertingkat (multilevel)', 'Header tabel berulang', 'Halaman X dari Y'],
    guide: [
      { section: 'Kertas, Font & Judul Bagian', spec: 'Ubah kertas menjadi **A4** dan seragamkan font isi ke **Calibri 11 pt**. Pasang Style **Heading 1** pada judul `Tata Tertib Laboratorium` dan `Jadwal Praktikum`.' },
      { section: 'Daftar Bertingkat & 2 Kolom', spec: 'Hapus nomor `1.` dan huruf `a.` yang diketik manual pada butir tata tertib, ubah menjadi **Numbering bertingkat** (tekan `Tab` pada sub-poin a, b). Lalu blok seluruh butir tata tertib tersebut dan ubah menjadi **2 kolom** (`Layout > Columns > Two`).' },
      { section: 'Pindah Halaman & Tabel Jadwal', spec: 'Hapus Enter kosong berderet sebelum bagian Jadwal Praktikum (pisahkan dengan Section Break Next Page / Page Break). Klik baris paling atas tabel jadwal (`Hari | Jam | Ruang...`), lalu aktifkan **Table Layout > Repeat Header Rows**.' },
      { section: 'Nomor Halaman X dari Y', spec: 'Di bagian Footer, sisipkan nomor halaman dengan format **`Halaman X dari Y`** menggunakan field `Page X of Y` (`Insert > Page Number > Bottom of Page > Page X of Y`).' },
    ],
    rubric: [
      a4,
      { id: 'h1', label: 'Minimal 2 judul bagian (Heading 1)', test: (f) => f.headings[1] >= 2, hint: 'Tata Tertib dan Jadwal masing-masing Heading 1.' },
      { id: 'kolom', label: 'Bagian tata tertib dibuat 2 kolom', test: (f) => f.sections.some((s) => s.cols >= 2), hint: 'Blok bagian itu, Layout > Columns > Two. Word otomatis menambah section break.' },
      { id: 'multi', label: 'Daftar bertingkat (ada sub-poin)', test: (f) => f.maxListLevel >= 1, hint: 'Di dalam daftar, tekan Tab untuk turun satu tingkat, Shift+Tab untuk naik.' },
      { id: 'repeat', label: 'Baris judul tabel berulang di halaman berikutnya', test: (f) => f.tableHeaderRepeat >= 1, hint: 'Klik baris judul tabel, Table Layout > Repeat Header Rows.' },
      { id: 'halaman', label: 'Nomor "Halaman X dari Y"', test: (f) => f.footerPage && f.numPages, hint: 'Insert > Page Number > Bottom of Page > Page X of Y, lalu ganti teksnya ke bahasa Indonesia.' },
      clean,
    ],
  },
]
