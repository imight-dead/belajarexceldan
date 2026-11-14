// Tahap 3 verifikasi:
//  a) setiap rumus kunci, dihitung oleh Excel asli, harus sama dengan kunci hasil kode
//  b) rumus kunci pertama harus lolos cek fungsi soal itu
//  c) file "filled" (disimpan Excel) dinilai dengan status yang tepat
//  d) file yang rumusnya ditulis library tanpa dibuka Excel -> status tanpaCache
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ExcelJS from 'exceljs'
import { LEVELS } from '../../src/content/levels'
import { gradeBook, gradeOne, valuesEqual } from '../../src/lib/grader'
import { readXlsx } from '../../src/lib/xlsxRead'
import { FIRST_Q_ROW } from '../../src/lib/xlsxWrite'

const out = join(process.cwd(), 'verify-out')
let fail = 0
const bad = (m: string) => { fail++; console.log('  GAGAL ' + m) }

for (const level of LEVELS.filter((l) => l.questions.length)) {
  console.log(`\n== Level ${level.n} ==`)
  const excel: { id: string; evals: { formula: string; value: unknown; text: string; error: boolean }[] }[] =
    JSON.parse(readFileSync(join(out, `level${level.n}.excel.json`), 'utf8').replace(/^﻿/, ''))
  const evalsOf = new Map(excel.map((e) => [e.id, Array.isArray(e.evals) ? e.evals : [e.evals]]))
  let keyCount = 0
  for (const q of level.questions) {
    const exp = q.expected()
    for (const [i, ev] of evalsOf.get(q.id)!.entries()) {
      keyCount++
      if (ev.error || !valuesEqual(exp, ev.value as never, q)) bad(`${q.id} kunci #${i + 1} ${ev.formula} -> Excel: ${ev.text} | kunci kode: ${exp}`)
      const r = gradeOne(q, { f: ev.formula.slice(1), v: exp })
      if (r.status !== 'benar') {
        const note = q.keys[i].note ?? ''
        if (i === 0 || !/cek fungsi|minta/i.test(note)) bad(`${q.id} kunci #${i + 1} tidak lolos cek fungsi: ${r.msg}`)
      }
    }
  }
  console.log(`  ${keyCount} rumus kunci dicek terhadap Excel`)

  // c) file filled
  const items: { id: string; fill: string }[] = JSON.parse(readFileSync(join(out, `level${level.n}.keys.json`), 'utf8'))
  const book = await readXlsx(readFileSync(join(out, `level${level.n}.filled.xlsx`)))
  const rep = gradeBook(level, book)
  const want: Record<string, string[]> = { key: ['benar'], manual: ['manual'], wrong: ['salah'], empty: ['kosong'], alt: ['benar', 'fungsi'] }
  for (const [i, r] of rep.results.entries()) {
    const fill = items[i].fill
    if (!want[fill].includes(r.status)) bad(`${r.id} diisi "${fill}" tapi dinilai ${r.status} (${r.msg}) got=${String(r.got)} f=${r.formula}`)
  }
  const tally = rep.results.reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {})
  console.log('  penilaian file filled:', JSON.stringify(tally), rep.warnings.length ? 'peringatan: ' + rep.warnings.join(' | ') : '')

  // d) rumus ditulis library tanpa dihitung Excel
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(readFileSync(join(out, `level${level.n}.xlsx`)))
  const ws = wb.getWorksheet('Soal')!
  level.questions.forEach((q, i) => (ws.getCell(`E${FIRST_Q_ROW + i}`).value = { formula: q.keys[0].formula.slice(1) } as never))
  const raw = await readXlsx(new Uint8Array(await wb.xlsx.writeBuffer()))
  const rep2 = gradeBook(level, raw)
  if (!rep2.results.every((r) => r.status === 'tanpaCache')) bad('file tanpa cache tidak terdeteksi semua')
  else console.log('  file tanpa cached value: semua terdeteksi tanpaCache, peringatan muncul =', rep2.warnings.length > 0)
}
console.log(fail ? `\n${fail} masalah` : '\nSemua lolos')
process.exit(fail ? 1 : 0)
