// Tahap 1 verifikasi: tulis workbook tiap level + daftar rumus kunci untuk diuji di Excel asli.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEVELS } from '../../src/content/levels'
import { buildWorkbook, FIRST_Q_ROW } from '../../src/lib/xlsxWrite'

const out = join(process.cwd(), 'verify-out')
mkdirSync(out, { recursive: true })

for (const level of LEVELS.filter((l) => l.questions.length)) {
  const buf = await buildWorkbook(level)
  writeFileSync(join(out, `level${level.n}.xlsx`), Buffer.from(buf))
  // rencana pengisian file "filled": sebagian benar, sebagian sengaja salah, untuk menguji penilai
  const plan = ['key', 'manual', 'wrong', 'empty', 'alt']
  const items = level.questions.map((q, i) => ({
    id: q.id,
    row: FIRST_Q_ROW + i,
    keys: q.keys.map((k) => k.formula),
    expected: q.expected(),
    setup: q.setup ?? null,
    fill: i < plan.length ? plan[i] : 'key',
  }))
  writeFileSync(join(out, `level${level.n}.keys.json`), JSON.stringify(items, null, 1))
  console.log(`level${level.n}.xlsx: ${items.length} soal`)
}
