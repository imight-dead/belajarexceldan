import type { Cell } from '../data/ds'

export type Tier = 'mudah' | 'sedang' | 'sulit'
export const TIER_LABEL: Record<Tier, string> = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit setara tes' }

/**
 * Satu soal Excel. Teks boleh memakai markup ringan:
 * `kode` -> font mono, **tebal**, {{=RUMUS}} -> rumus dengan highlight.
 */
export interface ExcelQuestion {
  id: string
  tier: Tier
  /** Bab untuk laporan "bab yang lemah". */
  topic: string
  title: string
  prompt: string
  /** Kunci dihitung dengan kode dari dataset, bukan diketik. */
  expected: () => Cell
  compare?: { tol?: number; ci?: boolean }
  fns?: {
    /** Semua fungsi ini wajib muncul di rumus. */
    all?: string[]
    /** Minimal salah satu kelompok terpenuhi semua. */
    anyOf?: string[][]
    /** Fungsi ini tidak boleh dipakai. */
    forbid?: string[]
    /** Potongan teks yang wajib ada di rumus (mis. nama Table). */
    contains?: string[]
  }
  /** Cek struktur workbook selain rumus. */
  structure?: { definedName?: string; table?: string }
  /** Persiapan yang harus dilakukan pengguna di Excel sebelum mengetik rumus (dipakai juga oleh skrip verifikasi). */
  setup?: { table?: { name: string; sheet: string; range: string }; name?: { name: string; ref: string } }
  /** Rumus kunci, minimal 2 cara bila ada. Semuanya diverifikasi di Excel oleh scripts/verify-excel. */
  keys: { formula: string; note?: string }[]
  steps: string[]
  hint?: string
}

export interface MiniTable {
  /** Nama sheet (opsional) untuk label. */
  sheet?: string
  /** Kolom pertama data, default A. Nomor baris pertama data, default 2. */
  startCol?: number
  startRow?: number
  headers: string[]
  rows: Cell[][]
  highlight?: { rows?: number[]; cols?: number[] }
}

export type QuizQ =
  | {
      id: string
      type: 'mcq'
      kind: 'konsep' | 'tebak' | 'error'
      q: string
      formula?: string
      table?: MiniTable
      options: string[]
      answer: number
      why: string
    }
  | {
      id: string
      type: 'isian'
      kind: 'konsep' | 'tebak' | 'error'
      q: string
      formula?: string
      table?: MiniTable
      /** Jawaban yang diterima. Dibandingkan setelah normalisasi. */
      accept: string[]
      /** formula: abaikan spasi, huruf besar/kecil, tanda = di depan, ; diganti , */
      mode: 'text' | 'number' | 'formula'
      placeholder?: string
      why: string
    }

export interface SyntaxSpec {
  formula: string
  args: { name: string; desc: string; optional?: boolean }[]
}

export interface Example {
  formula: string
  result: string
  note: string
  table?: MiniTable
}

export interface Concept {
  id: string
  title: string
  /** Ringkasan satu-dua kalimat, tampil paling atas sebagai "Intinya". */
  intro?: string
  body: string[]
  syntax?: SyntaxSpec[]
  examples?: Example[]
  /** Tabel bebas, mis. daftar shortcut. */
  grid?: { headers: string[]; rows: string[][] }
  mistakes?: string[]
  tips?: string[]
  /** Id soal latihan yang relevan. */
  practice?: string[]
  /** Nama komponen visualisator yang disisipkan. */
  visual?: 'lookup' | 'offset' | 'spill' | 'reduce'
}

export interface Level {
  n: number
  slug: string
  title: string
  short: string
  goal: string
  /** Hari belajar di rencana 5 hari. */
  day: string
  concepts: Concept[]
  questions: ExcelQuestion[]
  quiz: QuizQ[]
  /** Level yang belum dibuat isinya. */
  pending?: boolean
  /** Level non-Excel: tab latihan diganti pemeriksa .docx atau brief desain. */
  practice?: 'excel' | 'word' | 'design'
}
