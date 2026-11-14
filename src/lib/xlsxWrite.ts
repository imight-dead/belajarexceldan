import ExcelJS from 'exceljs'
import { DATA, SHEET_NOTES, SHEET_ORDER, colLetter, type SheetName } from '../data/ds'
import type { Level } from '../content/types'
import { TIER_LABEL } from '../content/types'
import { FIRST_Q_ROW, META_SHEET, SOAL_SHEET, fnLabel, plain } from './layout'

export { FIRST_Q_ROW } from './layout'

const YELLOW = 'FFFFE58A'
const thin = { style: 'thin' as const, color: { argb: 'FFB8B8B8' } }

export async function buildWorkbook(level: Level): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Lembar Kerja Aslab'
  wb.created = new Date(2026, 10, 9)

  const ws = wb.addWorksheet(SOAL_SHEET, { views: [{ state: 'frozen', ySplit: FIRST_Q_ROW - 1 }] })
  ws.columns = [
    { width: 5 }, { width: 8 }, { width: 11 }, { width: 92 }, { width: 30 }, { width: 30 },
  ]
  ws.getCell('A1').value = `Level ${level.n} · ${level.title}`
  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A2').value =
    'Tulis RUMUS (bukan nilai ketikan) di sel kuning kolom E. Simpan dengan Ctrl+S di Excel 365 / Excel for the web, lalu unggah file ini ke website.'
  ws.getCell('A3').value =
    'Kalau Excel kamu memakai pemisah titik koma (;), ganti koma di rumus contoh dengan ;. Jangan ubah isi kolom B (ID soal) karena dipakai untuk menilai.'
  ws.getCell('A4').value = 'Semua data ada di sheet lain. Header di baris 1, data mulai baris 2.'
  for (const a of ['A2', 'A3', 'A4']) ws.getCell(a).font = { color: { argb: 'FF555555' }, size: 10 }

  const head = ws.getRow(FIRST_Q_ROW - 1)
  head.values = ['No', 'ID', 'Tingkat', 'Soal', 'Jawaban (rumus)', 'Fungsi wajib']
  head.font = { bold: true }
  head.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7EBF0' } }
    c.border = { bottom: thin }
  })

  level.questions.forEach((q, i) => {
    const r = ws.getRow(FIRST_Q_ROW + i)
    r.values = [i + 1, q.id, TIER_LABEL[q.tier], plain(`${q.title}. ${q.prompt}`), null, fnLabel(q)]
    r.alignment = { vertical: 'top', wrapText: true }
    const ans = r.getCell(5)
    ans.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
    ans.border = { top: thin, bottom: thin, left: thin, right: thin }
    r.getCell(6).font = { color: { argb: 'FF666666' }, size: 10 }
    const lines = Math.ceil(plain(q.prompt).length / 95) + 1
    r.height = Math.max(30, lines * 14)
  })

  for (const name of SHEET_ORDER) addDataSheet(wb, name)

  const meta = wb.addWorksheet(META_SHEET, { state: 'veryHidden' })
  meta.getCell('A1').value = 'lembar-kerja-aslab'
  meta.getCell('B1').value = level.n
  meta.getCell('A2').value = 'versi'
  meta.getCell('B2').value = 1

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer
}

function addDataSheet(wb: ExcelJS.Workbook, name: SheetName) {
  const s = DATA[name]
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.addRow(s.headers)
  for (const r of s.rows) ws.addRow(r.map((v) => (v === '' ? null : v)))
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7EBF0' } }
  s.headers.forEach((h, i) => {
    const values = s.rows.map((r) => String(r[i] ?? ''))
    const w = Math.min(46, Math.max(h.length + 2, ...values.map((v) => v.length + 2)))
    const c = ws.getColumn(i + 1)
    c.width = w
    if (h === 'NIM' && name !== 'AsprakKotor') c.numFmt = '0'
    if (h === 'HARGA') c.numFmt = '#,##0'
  })
  // catatan di kanan tabel, dua kolom setelah data, supaya tidak ikut terbaca sebagai data
  const noteCol = colLetter(s.headers.length + 2)
  ws.getCell(`${noteCol}1`).value = SHEET_NOTES[name]
  ws.getCell(`${noteCol}1`).font = { italic: true, color: { argb: 'FF777777' } }
}
