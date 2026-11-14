// Uji pemeriksa .docx:
//  a) setiap dokumen target (disimpan Word asli) lolos 100% rubriknya dan tidak ada peringatan kebersihan
//  b) dokumen berantakan (dibuat di Word tanpa style) gagal di sebagian besar rubrik Modul dan memunculkan peringatan
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { WORD_TARGETS } from '../../src/content/wordTargets'
import { hygiene, readDocx } from '../../src/lib/docxCheck'

const dir = join(process.cwd(), 'verify-out', 'word')
let fail = 0
const bad = (m: string) => {
  fail++
  console.log('  GAGAL ' + m)
}

for (const t of WORD_TARGETS) {
  const f = await readDocx(readFileSync(join(dir, `${t.id}.docx`)))
  const res = t.rubric.map((r) => ({ r, ok: r.test(f) }))
  const pass = res.filter((x) => x.ok).length
  console.log(`${t.id}: ${pass}/${res.length} rubrik`)
  for (const x of res) if (!x.ok) bad(`${t.id} / ${x.r.label}`)
  const h = hygiene(f)
  if (h.length) bad(`${t.id} punya peringatan: ${h.map((x) => x.msg + (x.detail ? ' ' + JSON.stringify(x.detail) : '')).join(' | ')}`)
  if (process.argv.includes('-v')) console.log(JSON.stringify({ ...f, headingTexts: f.headingTexts.length }, null, 1))
}

const messy = await readDocx(readFileSync(join(dir, 'berantakan.docx')))
const modul = WORD_TARGETS.find((t) => t.id === 'modul')!
const passed = modul.rubric.filter((r) => r.test(messy)).length
const warns = hygiene(messy)
console.log(`berantakan: ${passed}/${modul.rubric.length} rubrik Modul, ${warns.length} peringatan`)
for (const w of warns) console.log(`  - ${w.msg}`)
if (passed > 3) bad('dokumen berantakan terlalu banyak lolos rubrik')
if (messy.fakeHeadings.length < 4) bad(`judul palsu hanya terdeteksi ${messy.fakeHeadings.length}`)
if (!messy.emptyStreaks) bad('Enter berderet tidak terdeteksi')
if (!messy.manualList.length) bad('daftar manual tidak terdeteksi')
if (!messy.spaceRuns.length) bad('spasi berderet tidak terdeteksi')

console.log(fail ? `\n${fail} masalah` : '\nSemua lolos')
process.exit(fail ? 1 : 0)
