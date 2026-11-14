// Membuat dokumen target latihan Word (versi rapi) dan satu versi berantakan untuk menguji pemeriksa.
// Hasil: verify-out/word/*.raw.docx. Lalu word.ps1 membuka di Word asli, memperbarui daftar isi,
// menyimpan .docx, dan mengekspor PDF ke public/word.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { crc32, deflateSync } from 'node:zlib'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  FootnoteReferenceRun,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  NumberFormat,
  Packer,
  PageBreak,
  PageNumber,
  PageOrientation,
  Paragraph,
  SectionType,
  SequentialIdentifier,
  ShadingType,
  Tab,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ISectionOptions,
} from 'docx'

const out = join(process.cwd(), 'verify-out', 'word')
mkdirSync(out, { recursive: true })
const CM = 567
const A4 = { width: 11906, height: 16838 }

// ---------------------------------------------------------------- util
const P = (text: string, o: Partial<ConstructorParameters<typeof Paragraph>[0] & object> = {}) => new Paragraph({ children: [new TextRun(text)], ...o })
const H1 = (text: string, numbered = false) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, ...(numbered ? { numbering: { reference: 'bab', level: 0 } } : {}) })
const H2 = (text: string, numbered = false) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, ...(numbered ? { numbering: { reference: 'bab', level: 1 } } : {}) })
const bullets = (items: string[], level = 0) => items.map((t) => new Paragraph({ text: t, numbering: { reference: 'bullet', level } }))
const steps = (items: string[], instance: number) => items.map((t) => new Paragraph({ text: t, numbering: { reference: 'langkah', level: 0, instance } }))
const caption = (label: string, text: string) =>
  new Paragraph({ style: 'Caption', alignment: AlignmentType.CENTER, children: [new TextRun(`${label} `), new SequentialIdentifier(label), new TextRun(` ${text}`)] })
const cell = (text: string, head = false, w?: number) =>
  new TableCell({
    width: w ? { size: w, type: WidthType.DXA } : undefined,
    shading: head ? { type: ShadingType.CLEAR, fill: 'E7EBF0', color: 'auto' } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: head })] })],
  })
const table = (head: string[], rows: string[][], repeat = false) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ tableHeader: repeat, children: head.map((h) => cell(h, true)) }), ...rows.map((r) => new TableRow({ children: r.map((v) => cell(v)) }))],
  })
const pageFooter = (total = false) =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: total ? [new TextRun({ children: ['Halaman ', PageNumber.CURRENT, ' dari ', PageNumber.TOTAL_PAGES] })] : [new TextRun({ children: [PageNumber.CURRENT] })],
      }),
    ],
  })

const numbering = {
  config: [
    {
      reference: 'bab',
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 432, hanging: 432 } } } },
        { level: 1, format: LevelFormat.DECIMAL, text: '%1.%2', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 576, hanging: 576 } } } },
      ],
    },
    {
      reference: 'bullet',
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ],
    },
    {
      reference: 'langkah',
      levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.LOWER_LETTER, text: '%2.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ],
    },
  ],
}

const styles = (font = 'Calibri', line?: number) => ({
  default: {
    document: { run: { font, size: 22 }, paragraph: { spacing: { after: 120, ...(line ? { line } : {}) } } },
    heading1: { run: { font, size: 30, bold: true, color: '1F3864' }, paragraph: { spacing: { before: 360, after: 160 } } },
    heading2: { run: { font, size: 25, bold: true, color: '2F5496' }, paragraph: { spacing: { before: 240, after: 120 } } },
    title: { run: { font, size: 44, bold: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 240 } } },
  },
  paragraphStyles: [
    { id: 'Subtitle', name: 'Subtitle', basedOn: 'Normal', run: { size: 30, color: '444444' }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 1200 } } },
    { id: 'Caption', name: 'caption', basedOn: 'Normal', run: { size: 20, italics: true, color: '333333' }, paragraph: { spacing: { before: 120, after: 200 } } },
    { id: 'Kode', name: 'Kode Program', basedOn: 'Normal', run: { font: 'Consolas', size: 19 }, paragraph: { spacing: { after: 0, line: 240 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2', color: 'auto' } } },
    { id: 'TOCHeading', name: 'TOC Heading', basedOn: 'Normal', run: { size: 28, bold: true }, paragraph: { alignment: AlignmentType.CENTER, spacing: { after: 240 } } },
  ],
})
const center = (t: string) => P(t, { alignment: AlignmentType.CENTER })

// ---------------------------------------------------------------- 1. Modul praktikum
function modul(): Document {
  const children = [
    new Paragraph({ text: 'MODUL PRAKTIKUM SISTEM OPERASI', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: 'Modul 1: Pengenalan Xinu', style: 'Subtitle' }),
    center('Laboratorium Informatika'),
    center('Fakultas Informatika, Universitas Telkom'),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('2026'), new PageBreak()] }),
    new TableOfContents('Daftar Isi', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({ children: [new PageBreak()] }),
    H1('Pendahuluan', true),
    P('Modul ini mengenalkan sistem operasi Xinu yang dipakai sepanjang praktikum. Kamu akan menyiapkan lingkungan kerja, mengenal struktur kode, dan menjalankan Xinu untuk pertama kali.'),
    H2('Tujuan Praktikum', true),
    ...bullets(['Memahami fungsi dasar sebuah sistem operasi.', 'Menyiapkan mesin virtual untuk menjalankan Xinu.', 'Menjalankan dan menghentikan Xinu dari terminal.']),
    H2('Alat dan Bahan', true),
    ...bullets(['Komputer dengan RAM minimal 8 GB.', 'VirtualBox versi 7 atau lebih baru.', 'Berkas image Xinu dari asisten.']),
    H1('Dasar Teori', true),
    H2('Apa itu Xinu', true),
    P('Xinu adalah sistem operasi kecil yang dibuat untuk pembelajaran. Kodenya pendek dan mudah dibaca, sehingga cocok untuk melihat langsung cara kerja penjadwalan proses, semaphore, dan manajemen memori.'),
    H2('Struktur Direktori', true),
    P('Kode Xinu dibagi menjadi beberapa folder. Tabel berikut merangkum folder yang paling sering dibuka selama praktikum.'),
    caption('Tabel', 'Folder penting pada kode Xinu'),
    table(['Folder', 'Isi'], [
      ['system/', 'Kode inti: proses, penjadwal, semaphore'],
      ['include/', 'Berkas header dan konstanta'],
      ['device/', 'Driver perangkat seperti tty dan ethernet'],
      ['compile/', 'Makefile dan hasil kompilasi'],
    ]),
    H1('Langkah Praktikum', true),
    H2('Menyiapkan Mesin Virtual', true),
    ...steps(['Buka VirtualBox, lalu pilih Import Appliance.', 'Pilih berkas xinu-vm.ova dari folder praktikum.', 'Atur RAM mesin virtual menjadi 2048 MB.', 'Klik Import dan tunggu sampai selesai.', 'Nyalakan mesin virtual dan login dengan akun praktikan.'], 1),
    H2('Menjalankan Xinu', true),
    P('Setelah login, masuk ke folder compile lalu jalankan perintah berikut.'),
    new Paragraph({ style: 'Kode', text: 'cd ~/xinu/compile' }),
    new Paragraph({ style: 'Kode', text: 'make clean && make' }),
    new Paragraph({ style: 'Kode', text: 'make run' }),
    P('Kalau berhasil, terminal menampilkan tulisan Welcome to Xinu. Tekan Ctrl+A lalu X untuk keluar.', { spacing: { before: 200 } }),
    H2('Tugas', true),
    ...steps(['Tampilkan daftar proses yang sedang berjalan dengan perintah ps.', 'Catat berapa proses yang aktif, lalu laporkan ke asisten.'], 2),
  ]
  return new Document({
    styles: styles(),
    numbering,
    features: { updateFields: true },
    sections: [
      {
        properties: { page: { size: A4, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Modul Praktikum Sistem Operasi', color: '666666', size: 18 })] })] }) },
        footers: { default: pageFooter() },
        children,
      },
    ],
  })
}

// ---------------------------------------------------------------- 2. Surat
function surat(): Document {
  const tabRow = (label: string, val: string) => new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 1500 }], spacing: { after: 0 }, children: [new TextRun(label), new TextRun({ children: [new Tab(), `: ${val}`] })] })
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const nb = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder }
  return new Document({
    styles: styles(),
    numbering,
    sections: [
      {
        properties: { page: { size: A4, margin: { top: 1134, right: 1418, bottom: 1134, left: 1701 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'LABORATORIUM INFORMATIKA', bold: true, size: 30 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: 'Fakultas Informatika, Universitas Telkom', size: 20 })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { bottom: { style: BorderStyle.DOUBLE, size: 6, color: '000000', space: 4 } },
                children: [new TextRun({ text: 'Jl. Telekomunikasi No. 1, Bandung 40257', size: 20 })],
              }),
            ],
          }),
        },
        children: [
          tabRow('Nomor', '021/IFLAB/XI/2026'),
          tabRow('Lampiran', '1 berkas'),
          new Paragraph({ tabStops: [{ type: TabStopType.LEFT, position: 1500 }], spacing: { after: 360 }, children: [new TextRun('Perihal'), new TextRun({ children: [new Tab(), ': Pengumuman Rekrutmen Asisten Laboratorium'] })] }),
          P('Yth. Mahasiswa Fakultas Informatika', { spacing: { after: 0 } }),
          P('di tempat', { spacing: { after: 240 } }),
          P('Dengan hormat, Laboratorium Informatika membuka kesempatan bagi mahasiswa untuk bergabung sebagai asisten laboratorium periode 2026/2027. Pendaftar harus memenuhi syarat berikut:', { alignment: AlignmentType.JUSTIFIED }),
          ...steps(['Mahasiswa aktif S1 Informatika angkatan 2024 atau 2025.', 'IPK minimal 3,25 tanpa nilai D dan E.', 'Lulus mata kuliah Algoritma dan Pemrograman.', 'Bersedia mengikuti seluruh rangkaian seleksi.', 'Mengunggah CV dan transkrip nilai sebelum batas waktu.'], 1),
          P('Seleksi dilaksanakan dengan jadwal sebagai berikut:', { spacing: { before: 200 } }),
          table(['Tahap', 'Tanggal', 'Tempat'], [
            ['Tes MS Office dan Design', 'Sabtu, 14 November 2026', 'Lab Komputer Gedung F'],
            ['Tes Pemrograman', 'Sabtu, 21 November 2026', 'Lab Komputer Gedung F'],
            ['Wawancara', '23 sampai 25 November 2026', 'Ruang Asisten'],
          ]),
          P('Demikian pengumuman ini kami sampaikan. Atas perhatiannya kami ucapkan terima kasih.', { spacing: { before: 240, after: 360 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: nb,
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: nb, children: [new Paragraph('')] }),
                  new TableCell({
                    borders: nb,
                    children: [
                      P('Bandung, 2 November 2026', { spacing: { after: 0 } }),
                      P('Koordinator Asisten', { spacing: { after: 960 } }),
                      new Paragraph({ children: [new TextRun({ text: 'Nama Koordinator', bold: true, underline: {} })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  })
}

// ---------------------------------------------------------------- 3. Laporan
function chartPng(): Buffer {
  const w = 480
  const h = 240
  const px = Buffer.alloc((w * 3 + 1) * h, 255)
  const bars = [120, 170, 90, 200, 150]
  const colors = [[35, 70, 160], [35, 70, 160], [35, 70, 160], [200, 120, 20], [35, 70, 160]]
  for (let y = 0; y < h; y++) {
    px[y * (w * 3 + 1)] = 0
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3
      let c = [255, 255, 255]
      if (y === h - 20 || x === 30) c = [90, 90, 90]
      bars.forEach((b, i) => {
        const x0 = 60 + i * 82
        if (x >= x0 && x < x0 + 50 && y < h - 20 && y >= h - 20 - b) c = colors[i]
      })
      px[o] = c[0]
      px[o + 1] = c[1]
      px[o + 2] = c[2]
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const td = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(td) >>> 0)
    return Buffer.concat([len, td, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(px)), chunk('IEND', Buffer.alloc(0))])
}

function laporan(): Document {
  const margin = { top: 3 * CM, right: 3 * CM, bottom: 3 * CM, left: 4 * CM }
  const portrait = { size: A4, margin }
  const justify = (t: string, extra: object = {}) => P(t, { alignment: AlignmentType.JUSTIFIED, ...extra })
  const sections: ISectionOptions[] = [
    {
      properties: { page: portrait },
      children: [
        new Paragraph({ text: 'LAPORAN PRAKTIKUM SISTEM OPERASI', heading: HeadingLevel.TITLE }),
        new Paragraph({ text: 'Modul 3: Eksplorasi Penjadwalan Proses Xinu', style: 'Subtitle' }),
        center('Disusun oleh:'),
        center('Nama Praktikan'),
        center('NIM 1030125XXXXX'),
        P('', { spacing: { before: 2400 } }),
        center('Program Studi S1 Informatika'),
        center('Fakultas Informatika'),
        center('Universitas Telkom'),
        center('2026'),
      ],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: { ...portrait, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: pageFooter() },
      children: [
        H1('KATA PENGANTAR'),
        justify('Puji syukur penulis panjatkan karena laporan praktikum ini dapat diselesaikan tepat waktu. Laporan ini berisi hasil percobaan penjadwalan proses pada sistem operasi Xinu yang dilakukan pada Modul 3.'),
        justify('Penulis berterima kasih kepada asisten praktikum yang telah membimbing selama praktikum berlangsung. Kritik dan saran sangat penulis harapkan untuk perbaikan laporan berikutnya.'),
        P('Bandung, November 2026', { alignment: AlignmentType.RIGHT, spacing: { before: 480 } }),
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ text: 'DAFTAR ISI', style: 'TOCHeading' }),
        new TableOfContents('Daftar Isi', { hyperlink: true, headingStyleRange: '1-2' }),
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ text: 'DAFTAR GAMBAR', style: 'TOCHeading' }),
        new TableOfContents('Daftar Gambar', { hyperlink: true, captionLabelIncludingNumbers: 'Gambar' }),
      ],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: { ...portrait, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: pageFooter() },
      children: [
        H1('BAB I PENDAHULUAN'),
        H2('1.1 Latar Belakang'),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun('Penjadwal proses menentukan proses mana yang mendapat giliran memakai CPU. Xinu memakai penjadwalan berbasis prioritas'),
            new FootnoteReferenceRun(1),
            new TextRun(', sehingga proses dengan prioritas lebih tinggi selalu didahulukan.'),
          ],
        }),
        H2('1.2 Tujuan'),
        ...bullets(['Mengamati urutan eksekusi proses dengan prioritas berbeda.', 'Mengukur waktu tunggu setiap proses.']),
        H1('BAB II HASIL PRAKTIKUM'),
        H2('2.1 Waktu Eksekusi'),
        justify('Lima proses dijalankan dengan prioritas berbeda. Grafik berikut menunjukkan waktu eksekusi masing-masing proses dalam milidetik.'),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: 'png', data: chartPng(), transformation: { width: 400, height: 200 } })] }),
        caption('Gambar', 'Waktu eksekusi lima proses'),
        H2('2.2 Ringkasan'),
        justify('Proses keempat memiliki waktu eksekusi paling lama karena prioritasnya paling rendah dan sering didahului proses lain.'),
        caption('Tabel', 'Ringkasan hasil percobaan'),
        table(['Proses', 'Prioritas', 'Waktu (ms)'], [['P1', '20', '120'], ['P2', '20', '170'], ['P3', '30', '90'], ['P4', '10', '200'], ['P5', '20', '150']]),
      ],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: { size: { ...A4, orientation: PageOrientation.LANDSCAPE }, margin } },
      footers: { default: pageFooter() },
      children: [
        caption('Tabel', 'Data lengkap setiap percobaan'),
        table(
          ['Proses', 'Prioritas', 'Mulai', 'Selesai', 'Tunggu', 'Eksekusi', 'Context switch', 'Status'],
          [
            ['P1', '20', '0', '120', '0', '120', '3', 'Selesai'],
            ['P2', '20', '120', '290', '120', '170', '4', 'Selesai'],
            ['P3', '30', '0', '90', '0', '90', '1', 'Selesai'],
            ['P4', '10', '290', '490', '290', '200', '6', 'Selesai'],
            ['P5', '20', '90', '240', '90', '150', '3', 'Selesai'],
          ],
        ),
      ],
    },
    {
      properties: { type: SectionType.NEXT_PAGE, page: portrait },
      footers: { default: pageFooter() },
      children: [
        H1('BAB III KESIMPULAN'),
        justify('Proses dengan prioritas lebih tinggi selalu selesai lebih dulu. Proses berprioritas rendah mengalami waktu tunggu paling lama, sehingga perlu mekanisme aging agar tidak kelaparan.'),
        H1('DAFTAR PUSTAKA'),
        ...[
          'Comer, D. (2015). Operating System Design: The Xinu Approach (2nd ed.). CRC Press.',
          'Silberschatz, A., Galvin, P. B., & Gagne, G. (2018). Operating System Concepts (10th ed.). Wiley.',
          'Tanenbaum, A. S., & Bos, H. (2015). Modern Operating Systems (4th ed.). Pearson.',
        ].map((t) => P(t, { indent: { left: 720, hanging: 720 } })),
      ],
    },
  ]
  return new Document({
    styles: styles('Times New Roman', 360),
    numbering,
    features: { updateFields: true },
    footnotes: { 1: { children: [P('Proses dengan angka prioritas lebih besar mendapat giliran lebih dulu.')] } },
    sections,
  })
}

// ---------------------------------------------------------------- 4. Tata tertib
function tatib(): Document {
  const rules: [string, string[]][] = [
    ['Sebelum praktikum', ['Datang paling lambat 10 menit sebelum mulai.', 'Simpan tas di loker yang disediakan.']],
    ['Pakaian', ['Kemeja berkerah dan sepatu tertutup.', 'Kartu mahasiswa dipakai selama di lab.']],
    ['Selama praktikum', ['Dilarang makan dan minum di dekat komputer.', 'Ponsel dalam mode senyap.', 'Tidak memasang perangkat lunak tanpa izin asisten.']],
    ['Penggunaan komputer', ['Login memakai akun praktikan masing-masing.', 'Simpan pekerjaan di folder D:\\Praktikum.']],
    ['Setelah praktikum', ['Logout dan matikan monitor.', 'Rapikan kursi dan kabel.']],
    ['Sanksi', ['Terlambat lebih dari 15 menit tidak boleh mengikuti praktikum.', 'Pelanggaran berulang dilaporkan ke koordinator.']],
  ]
  const list = rules.flatMap(([h, subs]) => [new Paragraph({ text: h, numbering: { reference: 'langkah', level: 0, instance: 1 } }), ...subs.map((s) => new Paragraph({ text: s, numbering: { reference: 'langkah', level: 1, instance: 1 } }))])
  const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  const jam = ['06.30-09.30', '09.30-12.30', '12.30-15.30', '15.30-18.30']
  const rows: string[][] = []
  let k = 1
  for (const d of hari) for (const j of jam) for (const r of ['LAB A', 'LAB B']) rows.push([d, j, r, `IF-49-${String(((k++ - 1) % 12) + 1).padStart(2, '0')}`, `Modul ${(k % 8) + 1}`])
  const footer = { default: pageFooter(true) }
  return new Document({
    styles: styles(),
    numbering,
    sections: [
      {
        properties: { page: { size: A4 } },
        footers: footer,
        children: [H1('Tata Tertib Laboratorium'), P('Seluruh praktikan wajib membaca dan menaati tata tertib berikut selama berada di laboratorium.')],
      },
      { properties: { type: SectionType.CONTINUOUS, page: { size: A4 }, column: { count: 2, space: 708 } }, footers: footer, children: list },
      {
        properties: { type: SectionType.NEXT_PAGE, page: { size: A4 } },
        footers: footer,
        children: [H1('Jadwal Praktikum'), P('Jadwal berlaku mulai minggu ketiga perkuliahan. Perubahan jadwal diumumkan oleh asisten.'), table(['Hari', 'Jam', 'Ruang', 'Kelas', 'Materi'], rows, true)],
      },
    ],
  })
}

const docs: Record<string, Document> = { modul: modul(), surat: surat(), laporan: laporan(), tatib: tatib() }
for (const [name, d] of Object.entries(docs)) {
  writeFileSync(join(out, `${name}.raw.docx`), await Packer.toBuffer(d))
  console.log(`${name}.raw.docx`)
}
