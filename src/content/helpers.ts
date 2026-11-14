import { DATA, type Cell } from '../data/ds'

/** PROPER versi Excel: huruf pertama setelah karakter non-huruf jadi kapital. */
export function proper(s: string): string {
  let out = ''
  let prevLetter = false
  for (const ch of s.toLowerCase()) {
    const isLetter = /\p{L}/u.test(ch)
    out += isLetter && !prevLetter ? ch.toUpperCase() : ch
    prevLetter = isLetter
  }
  return out
}

/** TRIM versi Excel: buang spasi depan/belakang dan rapatkan spasi ganda di tengah. */
export const xtrim = (s: string) => s.replace(/ +/g, ' ').replace(/^ | $/g, '')

/** Huruf mutu dari tabel Grade (batas bawah, urut naik): cari batas terbesar yang <= nilai. */
export function gradeOf(x: number): string {
  let g = ''
  for (const [batas, huruf] of DATA.Grade.rows as [number, string][]) if (x >= batas) g = huruf
  return g
}

export function gradeIndex(x: number): number {
  let idx = 0
  ;(DATA.Grade.rows as [number, string][]).forEach(([batas], i) => {
    if (x >= batas) idx = i + 1
  })
  return idx
}

export const isNum = (v: Cell): v is number => typeof v === 'number'
