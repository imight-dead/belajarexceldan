import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

// Pembuat dokumen template berantakan (.docx) untuk latihan Word.
// Semua teks dan tabel sudah tersedia di dalamnya, namun ukuran font, jenis font,
// style Heading, penomoran, spasi antarparagraf, daftar isi, dan ukuran kertas sengaja diacak
// supaya pengguna berlatih merapikannya sesuai Panduan Ketentuan Format.

const LETTER = { width: 12240, height: 15840 } // Sengaja Letter (bukan A4) agar diperbaiki ke A4

interface MessyRunOpts {
  font?: string
  size?: number
  bold?: boolean
  italics?: boolean
  color?: string
}

const pMessy = (
  text: string,
  opts: MessyRunOpts = {},
  align?: (typeof AlignmentType)[keyof typeof AlignmentType],
) =>
  new Paragraph({
    alignment: align,
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        font: opts.font ?? 'Arial',
        size: opts.size ?? 22,
        bold: opts.bold,
        italics: opts.italics,
        color: opts.color,
      }),
    ],
  })

const blankStreak = (n = 3) => Array.from({ length: n }, () => new Paragraph(''))

const simpleTable = (head: string[], rows: string[][]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: false, // Sengaja belum Repeat Header Rows
        children: head.map(
          (h) =>
            new TableCell({
              children: [pMessy(h, { font: 'Comic Sans MS', size: 26, bold: true })],
            }),
        ),
      }),
      ...rows.map(
        (r, idx) =>
          new TableRow({
            children: r.map(
              (v) =>
                new TableCell({
                  children: [
                    pMessy(v, {
                      font: idx % 2 === 0 ? 'Courier New' : 'Times New Roman',
                      size: idx % 2 === 0 ? 18 : 24,
                    }),
                  ],
                }),
            ),
          }),
      ),
    ],
  })

// ---------------------------------------------------------------- 1. Modul Praktikum (Berantakan)
function messyModul(): Document {
  const children = [
    pMessy('MODUL PRAKTIKUM SISTEM OPERASI', { font: 'Comic Sans MS', size: 36, bold: true }, AlignmentType.LEFT),
    pMessy('Modul 1: Pengenalan Xinu', { font: 'Courier New', size: 20, italics: true }, AlignmentType.LEFT),
    pMessy('Laboratorium Informatika', { font: 'Times New Roman', size: 28 }),
    pMessy('Fakultas Informatika, Universitas Telkom', { font: 'Arial', size: 18 }),
    pMessy('2026', { font: 'Verdana', size: 32, bold: true }),
    // Sengaja pakai banyak Enter kosong, bukan Page Break (Ctrl+Enter)
    ...blankStreak(4),
    // Daftar isi diketik manual (bukan References > Table of Contents)
    pMessy('DAFTAR ISI (Hapus bagian manual ini lalu ganti dengan Table of Contents otomatis)', { font: 'Arial', size: 28, bold: true }),
    pMessy('1. Pendahuluan ........................................................ 1', { font: 'Courier New', size: 20 }),
    pMessy('2. Dasar Teori ........................................................ 2', { font: 'Courier New', size: 20 }),
    pMessy('3. Langkah Praktikum .................................................. 3', { font: 'Courier New', size: 20 }),
    ...blankStreak(4),
    // Judul bab palsu: ditebalkan & diperbesar manual tanpa Style Heading 1, nomor diketik manual
    pMessy('1. Pendahuluan', { font: 'Impact', size: 36, bold: true, color: '8B0000' }),
    pMessy(
      'Modul ini mengenalkan sistem operasi Xinu yang dipakai sepanjang praktikum. Kamu akan menyiapkan lingkungan kerja, mengenal struktur kode, dan menjalankan Xinu untuk pertama kali.',
      { font: 'Times New Roman', size: 28 },
    ),
    pMessy('1.1 Tujuan Praktikum', { font: 'Comic Sans MS', size: 30, bold: true }),
    // Poin diketik manual dengan strip "-" (bukan Bullets otomatis)
    pMessy('- Memahami fungsi dasar sebuah sistem operasi.', { font: 'Courier New', size: 18 }),
    pMessy('- Menyiapkan mesin virtual untuk menjalankan Xinu.', { font: 'Arial', size: 26 }),
    pMessy('- Menjalankan dan menghentikan Xinu dari terminal.', { font: 'Times New Roman', size: 20 }),
    pMessy('1.2 Alat dan Bahan', { font: 'Verdana', size: 28, bold: true }),
    pMessy('- Komputer dengan RAM minimal 8 GB.', { font: 'Arial', size: 24 }),
    pMessy('- VirtualBox versi 7 atau lebih baru.', { font: 'Comic Sans MS', size: 18 }),
    pMessy('- Berkas image Xinu dari asisten.', { font: 'Times New Roman', size: 26 }),
    ...blankStreak(3),
    pMessy('2. Dasar Teori', { font: 'Arial Black', size: 34, bold: true }),
    pMessy('2.1 Apa itu Xinu', { font: 'Georgia', size: 28, bold: true }),
    pMessy(
      'Xinu adalah sistem operasi kecil yang dibuat untuk pembelajaran. Kodenya pendek dan mudah dibaca, sehingga cocok untuk melihat langsung cara kerja penjadwalan proses, semaphore, dan manajemen memori.',
      { font: 'Comic Sans MS', size: 18 },
    ),
    pMessy('2.2 Struktur Direktori', { font: 'Trebuchet MS', size: 30, bold: true }),
    pMessy(
      'Kode Xinu dibagi menjadi beberapa folder. Tabel berikut merangkum folder yang paling sering dibuka selama praktikum.',
      { font: 'Courier New', size: 24 },
    ),
    // Caption diketik manual (bukan References > Insert Caption)
    pMessy('Tabel 1 Folder penting pada kode Xinu', { font: 'Arial', size: 24, bold: true }),
    simpleTable(
      ['Folder', 'Isi'],
      [
        ['system/', 'Kode inti: proses, penjadwal, semaphore'],
        ['include/', 'Berkas header dan konstanta'],
        ['device/', 'Driver perangkat seperti tty dan ethernet'],
        ['compile/', 'Makefile dan hasil kompilasi'],
      ],
    ),
    ...blankStreak(3),
    pMessy('3. Langkah Praktikum', { font: 'Impact', size: 36, bold: true }),
    pMessy('3.1 Menyiapkan Mesin Virtual', { font: 'Arial', size: 28, bold: true }),
    // Nomor langkah diketik manual (bukan Numbering otomatis)
    pMessy('1. Buka VirtualBox, lalu pilih Import Appliance.', { font: 'Times New Roman', size: 26 }),
    pMessy('2. Pilih berkas xinu-vm.ova dari folder praktikum.', { font: 'Arial', size: 18 }),
    pMessy('3. Atur RAM mesin virtual menjadi 2048 MB.', { font: 'Comic Sans MS', size: 24 }),
    pMessy('4. Klik Import dan tunggu sampai selesai.', { font: 'Courier New', size: 20 }),
    pMessy('5. Nyalakan mesin virtual dan login dengan akun praktikan.', { font: 'Verdana', size: 26 }),
    pMessy('3.2 Menjalankan Xinu', { font: 'Georgia', size: 28, bold: true }),
    pMessy('Setelah login, masuk ke folder compile lalu jalankan perintah berikut.', { font: 'Times New Roman', size: 20 }),
    pMessy('cd ~/xinu/compile', { font: 'Arial', size: 28 }),
    pMessy('make clean && make', { font: 'Arial', size: 28 }),
    pMessy('make run', { font: 'Arial', size: 28 }),
    pMessy('Kalau berhasil, terminal menampilkan tulisan Welcome to Xinu. Tekan Ctrl+A lalu X untuk keluar.', { font: 'Comic Sans MS', size: 24 }),
    pMessy('3.3 Tugas', { font: 'Verdana', size: 30, bold: true }),
    pMessy('1. Tampilkan daftar proses yang sedang berjalan dengan perintah ps.', { font: 'Courier New', size: 18 }),
    pMessy('2. Catat berapa proses yang aktif, lalu laporkan ke asisten.', { font: 'Times New Roman', size: 26 }),
  ]

  return new Document({
    sections: [
      {
        properties: { page: { size: LETTER } },
        children,
      },
    ],
  })
}

// ---------------------------------------------------------------- 2. Surat Pengumuman (Berantakan)
function messySurat(): Document {
  const children = [
    // Kop surat ditaruh di body (bukan di Header)
    pMessy('LABORATORIUM INFORMATIKA', { font: 'Comic Sans MS', size: 34, bold: true }),
    pMessy('Fakultas Informatika, Universitas Telkom', { font: 'Courier New', size: 18 }),
    pMessy('Jl. Telekomunikasi No. 1, Bandung 40257', { font: 'Times New Roman', size: 26 }),
    ...blankStreak(3),
    // Titik dua disejajarkan pakai spasi berderet (bukan Tab)
    pMessy('Nomor          : 021/IFLAB/XI/2026', { font: 'Courier New', size: 24 }),
    pMessy('Lampiran       : 1 berkas', { font: 'Arial', size: 18 }),
    pMessy('Perihal        : Pengumuman Rekrutmen Asisten Laboratorium', { font: 'Times New Roman', size: 26, bold: true }),
    ...blankStreak(2),
    pMessy('Yth. Mahasiswa Fakultas Informatika', { font: 'Verdana', size: 24 }),
    pMessy('di tempat', { font: 'Arial', size: 18 }),
    pMessy(
      'Dengan hormat, Laboratorium Informatika membuka kesempatan bagi mahasiswa untuk bergabung sebagai asisten laboratorium periode 2026/2027. Pendaftar harus memenuhi syarat berikut:',
      { font: 'Comic Sans MS', size: 26 },
    ),
    // Daftar syarat diketik manual (bukan Numbering otomatis)
    pMessy('1. Mahasiswa aktif S1 Informatika angkatan 2024 atau 2025.', { font: 'Times New Roman', size: 20 }),
    pMessy('2. IPK minimal 3,25 tanpa nilai D dan E.', { font: 'Courier New', size: 24 }),
    pMessy('3. Lulus mata kuliah Algoritma dan Pemrograman.', { font: 'Arial', size: 18 }),
    pMessy('4. Bersedia mengikuti seluruh rangkaian seleksi.', { font: 'Verdana', size: 26 }),
    pMessy('5. Mengunggah CV dan transkrip nilai sebelum batas waktu.', { font: 'Times New Roman', size: 22 }),
    ...blankStreak(2),
    pMessy('Seleksi dilaksanakan dengan jadwal sebagai berikut:', { font: 'Arial', size: 24 }),
    simpleTable(
      ['Tahap', 'Tanggal', 'Tempat'],
      [
        ['Tes MS Office dan Design', 'Sabtu, 14 November 2026', 'Lab Komputer Gedung F'],
        ['Tes Pemrograman', 'Sabtu, 21 November 2026', 'Lab Komputer Gedung F'],
        ['Wawancara', '23 sampai 25 November 2026', 'Ruang Asisten'],
      ],
    ),
    pMessy('Demikian pengumuman ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.', { font: 'Courier New', size: 20 }),
    ...blankStreak(3),
    pMessy('                                                  Bandung, 2 November 2026', { font: 'Arial', size: 24 }),
    pMessy('                                                  Koordinator Asisten', { font: 'Times New Roman', size: 24 }),
    ...blankStreak(3),
    pMessy('                                                  Nama Koordinator', { font: 'Comic Sans MS', size: 28, bold: true }),
  ]

  return new Document({
    sections: [
      {
        properties: { page: { size: LETTER } },
        children,
      },
    ],
  })
}

// ---------------------------------------------------------------- 3. Laporan Praktikum (Berantakan)
function makeChartPngBytes(): Uint8Array {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas')
    c.width = 480
    c.height = 240
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 480, 240)
      ctx.strokeStyle = '#5a5a5a'
      ctx.beginPath()
      ctx.moveTo(30, 10)
      ctx.lineTo(30, 220)
      ctx.lineTo(460, 220)
      ctx.stroke()
      const bars = [120, 170, 90, 200, 150]
      const colors = ['#2346a0', '#2346a0', '#2346a0', '#c87814', '#2346a0']
      bars.forEach((b, i) => {
        ctx.fillStyle = colors[i]
        ctx.fillRect(60 + i * 82, 220 - b, 50, b)
      })
      const b64 = c.toDataURL('image/png').split(',')[1]
      const bin = atob(b64)
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      return arr
    }
  }
  // Fallback PNG 1x1 putih valid
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222, 0, 0, 0, 12, 73, 68, 65, 84, 8, 215, 99, 248, 255, 255, 63, 0, 5, 254, 2, 254, 220, 204, 89, 231, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
  ])
}

function messyLaporan(): Document {
  const children = [
    pMessy('LAPORAN PRAKTIKUM SISTEM OPERASI', { font: 'Comic Sans MS', size: 36, bold: true }),
    pMessy('Modul 3: Eksplorasi Penjadwalan Proses Xinu', { font: 'Arial', size: 26, italics: true }),
    pMessy('Disusun oleh:', { font: 'Courier New', size: 20 }),
    pMessy('Nama Praktikan', { font: 'Verdana', size: 28, bold: true }),
    pMessy('NIM 1030125XXXXX', { font: 'Arial', size: 22 }),
    ...blankStreak(3),
    pMessy('Program Studi S1 Informatika', { font: 'Times New Roman', size: 26 }),
    pMessy('Fakultas Informatika', { font: 'Comic Sans MS', size: 22 }),
    pMessy('Universitas Telkom', { font: 'Arial', size: 28 }),
    pMessy('2026', { font: 'Impact', size: 32 }),
    ...blankStreak(4),
    pMessy('KATA PENGANTAR', { font: 'Arial Black', size: 32, bold: true }),
    pMessy(
      'Puji syukur penulis panjatkan karena laporan praktikum ini dapat diselesaikan tepat waktu. Laporan ini berisi hasil percobaan penjadwalan proses pada sistem operasi Xinu yang dilakukan pada Modul 3.',
      { font: 'Comic Sans MS', size: 20 },
    ),
    pMessy(
      'Penulis berterima kasih kepada asisten praktikum yang telah membimbing selama praktikum berlangsung. Kritik dan saran sangat penulis harapkan untuk perbaikan laporan berikutnya.',
      { font: 'Courier New', size: 24 },
    ),
    pMessy('Bandung, November 2026', { font: 'Arial', size: 22 }),
    ...blankStreak(3),
    pMessy('DAFTAR ISI (Ganti dengan Table of Contents otomatis)', { font: 'Arial', size: 28, bold: true }),
    pMessy('KATA PENGANTAR ................................................. i', { font: 'Courier New', size: 20 }),
    pMessy('BAB I PENDAHULUAN .............................................. 1', { font: 'Courier New', size: 20 }),
    pMessy('BAB II HASIL PRAKTIKUM ......................................... 2', { font: 'Courier New', size: 20 }),
    pMessy('BAB III KESIMPULAN ............................................. 4', { font: 'Courier New', size: 20 }),
    ...blankStreak(3),
    pMessy('DAFTAR GAMBAR (Ganti dengan Insert Table of Figures otomatis)', { font: 'Arial', size: 28, bold: true }),
    pMessy('Gambar 1 Waktu eksekusi lima proses ............................ 2', { font: 'Courier New', size: 20 }),
    ...blankStreak(4),
    pMessy('BAB I PENDAHULUAN', { font: 'Impact', size: 34, bold: true }),
    pMessy('1.1 Latar Belakang', { font: 'Comic Sans MS', size: 28, bold: true }),
    pMessy(
      'Penjadwal proses menentukan proses mana yang mendapat giliran memakai CPU. Xinu memakai penjadwalan berbasis prioritas [sisipkan Footnote di sini: Proses dengan angka prioritas lebih besar mendapat giliran lebih dulu], sehingga proses dengan prioritas lebih tinggi selalu didahulukan.',
      { font: 'Arial', size: 26 },
    ),
    pMessy('1.2 Tujuan', { font: 'Verdana', size: 28, bold: true }),
    pMessy('- Mengamati urutan eksekusi proses dengan prioritas berbeda.', { font: 'Courier New', size: 18 }),
    pMessy('- Mengukur waktu tunggu setiap proses.', { font: 'Times New Roman', size: 26 }),
    ...blankStreak(3),
    pMessy('BAB II HASIL PRAKTIKUM', { font: 'Arial Black', size: 34, bold: true }),
    pMessy('2.1 Waktu Eksekusi', { font: 'Georgia', size: 28, bold: true }),
    pMessy(
      'Lima proses dijalankan dengan prioritas berbeda. Grafik berikut menunjukkan waktu eksekusi masing-masing proses dalam milidetik.',
      { font: 'Comic Sans MS', size: 20 },
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ type: 'png', data: makeChartPngBytes(), transformation: { width: 400, height: 200 } })],
    }),
    pMessy('Gambar 1 Waktu eksekusi lima proses (Ganti dengan Insert Caption label Gambar)', { font: 'Arial', size: 20, bold: true }),
    pMessy('2.2 Ringkasan', { font: 'Verdana', size: 28, bold: true }),
    pMessy(
      'Proses keempat memiliki waktu eksekusi paling lama karena prioritasnya paling rendah dan sering didahului proses lain.',
      { font: 'Courier New', size: 24 },
    ),
    pMessy('Tabel 1 Ringkasan hasil percobaan (Ganti dengan Insert Caption label Tabel)', { font: 'Arial', size: 20, bold: true }),
    simpleTable(
      ['Proses', 'Prioritas', 'Waktu (ms)'],
      [
        ['P1', '20', '120'],
        ['P2', '20', '170'],
        ['P3', '30', '90'],
        ['P4', '10', '200'],
        ['P5', '20', '150'],
      ],
    ),
    ...blankStreak(3),
    pMessy('Tabel 2 Data lengkap setiap percobaan (Pisahkan halaman ini jadi Section Landscape & beri Insert Caption)', { font: 'Arial', size: 22, bold: true }),
    simpleTable(
      ['Proses', 'Prioritas', 'Mulai', 'Selesai', 'Tunggu', 'Eksekusi', 'Context switch', 'Status'],
      [
        ['P1', '20', '0', '120', '0', '120', '3', 'Selesai'],
        ['P2', '20', '120', '290', '120', '170', '4', 'Selesai'],
        ['P3', '30', '0', '90', '0', '90', '1', 'Selesai'],
        ['P4', '10', '290', '490', '290', '200', '6', 'Selesai'],
        ['P5', '20', '90', '240', '90', '150', '3', 'Selesai'],
      ],
    ),
    ...blankStreak(3),
    pMessy('BAB III KESIMPULAN', { font: 'Impact', size: 34, bold: true }),
    pMessy(
      'Proses dengan prioritas lebih tinggi selalu selesai lebih dulu. Proses berprioritas rendah mengalami waktu tunggu paling lama, sehingga perlu mekanisme aging agar tidak kelaparan.',
      { font: 'Arial', size: 26 },
    ),
    pMessy('DAFTAR PUSTAKA', { font: 'Comic Sans MS', size: 32, bold: true }),
    pMessy('Comer, D. (2015). Operating System Design: The Xinu Approach (2nd ed.). CRC Press.', { font: 'Courier New', size: 18 }),
    pMessy('Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). Operating System Concepts (10th ed.). Wiley.', { font: 'Arial', size: 24 }),
    pMessy('Tanenbaum, A. S., & Bos, H. (2015). Modern Operating Systems (4th ed.). Pearson.', { font: 'Verdana', size: 20 }),
  ]

  return new Document({
    sections: [
      {
        properties: { page: { size: LETTER } },
        children,
      },
    ],
  })
}

// ---------------------------------------------------------------- 4. Tata Tertib & Jadwal Lab (Berantakan)
function messyTatib(): Document {
  const rules: [string, string[]][] = [
    ['1. Sebelum praktikum', ['a. Datang paling lambat 10 menit sebelum mulai.', 'b. Simpan tas di loker yang disediakan.']],
    ['2. Pakaian', ['a. Kemeja berkerah dan sepatu tertutup.', 'b. Kartu mahasiswa dipakai selama di lab.']],
    ['3. Selama praktikum', ['a. Dilarang makan dan minum di dekat komputer.', 'b. Ponsel dalam mode senyap.', 'c. Tidak memasang perangkat lunak tanpa izin asisten.']],
    ['4. Penggunaan komputer', ['a. Login memakai akun praktikan masing-masing.', 'b. Simpan pekerjaan di folder D:\\Praktikum.']],
    ['5. Setelah praktikum', ['a. Logout dan matikan monitor.', 'b. Rapikan kursi dan kabel.']],
    ['6. Sanksi', ['a. Terlambat lebih dari 15 menit tidak boleh mengikuti praktikum.', 'b. Pelanggaran berulang dilaporkan ke koordinator.']],
  ]
  const listParas = rules.flatMap(([h, subs]) => [
    pMessy(h, { font: 'Comic Sans MS', size: 26, bold: true }),
    ...subs.map((s) => pMessy('    ' + s, { font: 'Courier New', size: 18 })),
  ])

  const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  const jam = ['06.30-09.30', '09.30-12.30', '12.30-15.30', '15.30-18.30']
  const rows: string[][] = []
  let k = 1
  for (const d of hari)
    for (const j of jam)
      for (const r of ['LAB A', 'LAB B'])
        rows.push([d, j, r, `IF-49-${String(((k++ - 1) % 12) + 1).padStart(2, '0')}`, `Modul ${(k % 8) + 1}`])

  return new Document({
    sections: [
      {
        properties: { page: { size: LETTER } },
        children: [
          pMessy('Tata Tertib Laboratorium', { font: 'Impact', size: 36, bold: true }),
          pMessy('Seluruh praktikan wajib membaca dan menaati tata tertib berikut selama berada di laboratorium.', {
            font: 'Times New Roman',
            size: 26,
          }),
          ...listParas,
          ...blankStreak(4),
          pMessy('Jadwal Praktikum', { font: 'Arial Black', size: 34, bold: true }),
          pMessy('Jadwal berlaku mulai minggu ketiga perkuliahan. Perubahan jadwal diumumkan oleh asisten.', {
            font: 'Comic Sans MS',
            size: 18,
          }),
          simpleTable(['Hari', 'Jam', 'Ruang', 'Kelas', 'Materi'], rows),
        ],
      },
    ],
  })
}

export async function buildMessyDocx(targetId: string): Promise<Uint8Array> {
  const map: Record<string, () => Document> = {
    modul: messyModul,
    surat: messySurat,
    laporan: messyLaporan,
    tatib: messyTatib,
  }
  const fn = map[targetId] ?? messyModul
  const blob = await Packer.toBlob(fn())
  return new Uint8Array(await blob.arrayBuffer())
}

export async function downloadMessyDocx(targetId: string, title: string) {
  const bytes = await buildMessyDocx(targetId)
  const blob = new Blob([bytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Template-Berantakan-${title.replace(/\s+/g, '-')}.docx`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}
