import raw from './datasets.json'

export type Cell = string | number | boolean | null
export interface Sheet {
  headers: string[]
  rows: Cell[][]
}
export type SheetName = keyof typeof raw
export type DS = Record<SheetName, Sheet>

export const DATA = raw as unknown as DS

/** Urutan sheet data di workbook latihan. Data mulai baris 2, header baris 1. */
export const SHEET_ORDER: SheetName[] = [
  'Asprak', 'Aslab', 'Kelas', 'Modul', 'Presensi', 'PresensiKotor', 'AsprakKotor', 'Praktikan', 'Inventaris', 'Grade', 'Bobot',
]

export const SHEET_NOTES: Record<SheetName, string> = {
  Asprak: '50 asisten praktikum (dari Link Penting).',
  Aslab: 'Kode dan nama aslab di BAP.',
  Kelas: 'Daftar kelas. Kolom HARI, JAM, RUANG sintetis.',
  Modul: 'Materi modul 1 sampai 16.',
  Presensi: 'Presensi asprak versi bersih: kelas terisi semua. "V" = nilai modul sudah diinput.',
  PresensiKotor: 'Versi asli: KELAS hanya di baris pertama tiap kelas, REF berisi alamat sel sebagai teks.',
  AsprakKotor: 'Versi kotor: spasi berlebih, huruf campur, NIM berupa teks, ada baris dobel.',
  Praktikan: '40 praktikan fiktif dengan nilai modul 1-8 (kosong = tidak hadir).',
  Inventaris: '30 PC lab fiktif.',
  Grade: 'Batas bawah nilai untuk tiap huruf mutu (urut naik).',
  Bobot: 'Tabel horizontal bobot komponen nilai.',
}

/** Ambil kolom berdasarkan nama header. */
export function col(sheet: SheetName, header: string): Cell[] {
  const s = DATA[sheet]
  const i = s.headers.indexOf(header)
  if (i < 0) throw new Error(`Kolom ${header} tidak ada di ${sheet}`)
  return s.rows.map((r) => r[i])
}

/** Ambil baris pertama yang kolom `key` = value. */
export function row(sheet: SheetName, key: string, value: Cell): Record<string, Cell> {
  const s = DATA[sheet]
  const i = s.headers.indexOf(key)
  const r = s.rows.find((x) => x[i] === value)
  if (!r) throw new Error(`${key}=${value} tidak ada di ${sheet}`)
  return Object.fromEntries(s.headers.map((h, j) => [h, r[j]]))
}

export function rows(sheet: SheetName): Record<string, Cell>[] {
  const s = DATA[sheet]
  return s.rows.map((r) => Object.fromEntries(s.headers.map((h, j) => [h, r[j]])))
}

export const num = (v: Cell) => (typeof v === 'number' ? v : NaN)
export const nums = (vs: Cell[]) => vs.filter((v): v is number => typeof v === 'number')
export const sum = (vs: Cell[]) => nums(vs).reduce((a, b) => a + b, 0)
export const avg = (vs: Cell[]) => {
  const n = nums(vs)
  return n.length ? sum(n) / n.length : NaN
}
/** ROUND ala Excel (half away from zero). */
export const round = (x: number, d = 0) => {
  const f = 10 ** d
  return (Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9)) / f
}

export function colLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
