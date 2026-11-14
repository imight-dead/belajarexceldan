import type { Cell } from '../data/ds'
import type { ExcelQuestion, Level } from '../content/types'
import { containsText, functionsIn, normalizeFormula } from './formula'
import { getCell, type XBook } from './xlsxRead'
import { ANSWER_COL, FIRST_Q_ROW, ID_COL, META_SHEET, SOAL_SHEET } from './layout'

export type Status = 'benar' | 'salah' | 'kosong' | 'tanpaCache' | 'manual' | 'fungsi' | 'struktur'

export interface Result {
  id: string
  status: Status
  got?: Cell
  expected: Cell
  formula?: string
  msg: string
}

export const STATUS_LABEL: Record<Status, string> = {
  benar: 'Benar',
  salah: 'Nilai salah',
  kosong: 'Belum dijawab',
  tanpaCache: 'Nilai belum tersimpan',
  manual: 'Diketik manual',
  fungsi: 'Fungsi tidak sesuai',
  struktur: 'Struktur belum ada',
}

export function valuesEqual(expected: Cell, got: Cell | undefined, q?: Pick<ExcelQuestion, 'compare'>): boolean {
  if (got === undefined) return false
  if (typeof expected === 'number') {
    const g = typeof got === 'number' ? got : typeof got === 'string' && got.trim() !== '' ? Number(got) : NaN
    if (Number.isNaN(g)) return false
    const tol = q?.compare?.tol ?? 1e-9 * Math.max(1, Math.abs(expected))
    return Math.abs(g - expected) <= tol
  }
  if (typeof expected === 'boolean') return got === expected || (typeof got === 'string' && got.toUpperCase() === String(expected).toUpperCase())
  const e = String(expected ?? '').trim()
  const g = typeof got === 'boolean' ? String(got).toUpperCase() : String(got ?? '').trim()
  return q?.compare?.ci ? e.toLowerCase() === g.toLowerCase() : e === g
}

/** Cek fungsi wajib/terlarang. Mengembalikan pesan bila tidak memenuhi, atau null. */
export function checkFunctions(q: ExcelQuestion, formula: string): string | null {
  const spec = q.fns
  if (!spec) return null
  const used = functionsIn(formula)
  const missing = (spec.all ?? []).filter((f) => !used.has(f))
  if (missing.length) return `Rumus belum memakai ${missing.join(', ')}.`
  if (spec.anyOf?.length && !spec.anyOf.some((g) => g.every((f) => used.has(f))))
    return `Pakai salah satu: ${spec.anyOf.map((g) => g.join(' + ')).join(' atau ')}.`
  const bad = (spec.forbid ?? []).filter((f) => used.has(f))
  if (bad.length) return `Soal ini melarang ${bad.join(', ')}. Hasilnya benar, tapi coba dengan fungsi yang diminta.`
  const lacking = (spec.contains ?? []).filter((t) => !containsText(formula, t))
  if (lacking.length) return `Rumus harus memuat ${lacking.join(', ')}.`
  return null
}

function checkStructure(q: ExcelQuestion, book: XBook): string | null {
  const s = q.structure
  if (!s) return null
  if (s.table && !book.tables.some((t) => t.name.toLowerCase() === s.table!.toLowerCase()))
    return `Belum ada Table bernama ${s.table}. Buat dengan Ctrl+T lalu ganti nama di Table Design.`
  if (s.definedName && !book.names.some((n) => n.name.toLowerCase() === s.definedName!.toLowerCase()))
    return `Belum ada nama ${s.definedName} di Name Manager (Ctrl+F3).`
  return null
}

export function gradeOne(q: ExcelQuestion, cell: { v: Cell | undefined; f?: string } | undefined, book?: XBook): Result {
  const expected = q.expected()
  const base = { id: q.id, expected }
  const formula = cell?.f ? normalizeFormula(cell.f) : undefined
  if (!cell || (cell.f === undefined && (cell.v === null || cell.v === undefined || cell.v === '')))
    return { ...base, status: 'kosong', msg: 'Sel jawaban masih kosong.' }
  if (cell.f !== undefined && cell.v === undefined)
    return {
      ...base,
      status: 'tanpaCache',
      formula,
      msg: 'Ada rumus tapi nilainya belum tersimpan. Buka file di Excel, tekan Ctrl+S, lalu unggah lagi.',
    }
  const ok = valuesEqual(expected, cell.v, q)
  if (cell.f === undefined)
    return ok
      ? { ...base, status: 'manual', got: cell.v, msg: 'Nilainya benar tapi diketik manual. Soal ini harus dijawab dengan rumus.' }
      : { ...base, status: 'salah', got: cell.v, msg: 'Nilai diketik manual dan tidak sesuai kunci.' }
  if (!ok) return { ...base, status: 'salah', got: cell.v, formula, msg: 'Hasil rumus belum sama dengan kunci.' }
  const fnMsg = checkFunctions(q, cell.f)
  if (fnMsg) return { ...base, status: 'fungsi', got: cell.v, formula, msg: fnMsg }
  const stMsg = book ? checkStructure(q, book) : null
  if (stMsg) return { ...base, status: 'struktur', got: cell.v, formula, msg: stMsg }
  return { ...base, status: 'benar', got: cell.v, formula, msg: 'Mantap.' }
}

export interface BookReport {
  results: Result[]
  warnings: string[]
  level?: number
}

export function gradeBook(level: Level, book: XBook): BookReport {
  const warnings: string[] = []
  const soal = book.sheets.get(SOAL_SHEET)
  if (!soal) return { results: [], warnings: [`Sheet "${SOAL_SHEET}" tidak ditemukan. Pastikan kamu mengunggah workbook dari website ini.`] }

  const metaLevel = getCell(book, META_SHEET, 'B1')?.v
  if (typeof metaLevel === 'number' && metaLevel !== level.n)
    warnings.push(`File ini workbook Level ${metaLevel}, bukan Level ${level.n}. Penilaian tetap dicoba, tapi kemungkinan besar tidak cocok.`)

  // Cari baris tiap soal lewat ID di kolom B, jadi aman kalau ada baris yang disisipkan.
  const rowOf = new Map<string, number>()
  for (const [addr, c] of soal) {
    const m = /^([A-Z]+)(\d+)$/.exec(addr)
    if (m && m[1] === ID_COL && typeof c.v === 'string') rowOf.set(c.v.trim(), Number(m[2]))
  }
  const results = level.questions.map((q, i) => {
    const r = rowOf.get(q.id) ?? FIRST_Q_ROW + i
    return gradeOne(q, soal.get(`${ANSWER_COL}${r}`), book)
  })
  const answered = results.filter((r) => r.status !== 'kosong')
  if (answered.length && answered.every((r) => r.status === 'tanpaCache'))
    warnings.push(
      'Semua rumus terbaca tapi tidak ada nilai hasilnya. Biasanya ini terjadi kalau file dibuat atau diubah oleh aplikasi selain Excel. Buka di Excel 365 / Excel for the web, simpan, lalu unggah lagi.',
    )
  if (!answered.length) warnings.push('Belum ada sel jawaban yang terisi. Isi rumus di kolom E sheet Soal.')
  return { results, warnings, level: typeof metaLevel === 'number' ? metaLevel : undefined }
}

/** Mode cadangan: pengguna menempel nilai hasil secara manual. Fungsi tidak bisa dicek. */
export function gradeManual(q: ExcelQuestion, input: string): Result {
  const expected = q.expected()
  const t = input.trim()
  let got: Cell = t
  if (typeof expected === 'number') {
    // terima format Indonesia: 1.234.567,5 atau 0,4
    const n = /,/.test(t) ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t.replace(/\s/g, ''))
    got = Number.isNaN(n) ? t : n
  } else if (typeof expected === 'boolean') got = /^(true|benar)$/i.test(t) ? true : /^(false|salah)$/i.test(t) ? false : t
  if (!t) return { id: q.id, status: 'kosong', expected, msg: 'Belum diisi.' }
  return valuesEqual(expected, got, q)
    ? { id: q.id, status: 'benar', expected, got, msg: 'Nilai cocok. Mode manual tidak bisa mengecek fungsi yang kamu pakai.' }
    : { id: q.id, status: 'salah', expected, got, msg: 'Nilai belum cocok.' }
}
