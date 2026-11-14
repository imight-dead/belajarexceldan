import type { ExcelQuestion } from '../content/types'

// Tata letak sheet Soal. Dipakai penulis workbook dan penilai, jadi harus satu sumber.
export const SOAL_SHEET = 'Soal'
export const ANSWER_COL = 'E'
export const ID_COL = 'B'
export const FIRST_Q_ROW = 6
export const META_SHEET = '_meta'

/** Hapus markup ringan supaya teks soal rapi di Excel. */
export function plain(s: string): string {
  return s.replace(/\{\{(.*?)\}\}/g, '$1').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1')
}

export function fnLabel(q: ExcelQuestion): string {
  const f = q.fns
  if (!f) return ''
  const parts: string[] = []
  if (f.all?.length) parts.push(f.all.join(' + '))
  if (f.anyOf?.length) parts.push(f.anyOf.map((g) => g.join('+')).join(' atau '))
  if (f.forbid?.length) parts.push('tanpa ' + f.forbid.join('/'))
  if (f.contains?.length) parts.push('memakai ' + f.contains.join(', '))
  return parts.join('; ')
}
