import { useEffect, useMemo, useState } from 'react'
import { DATA, colLetter, type Cell } from '../../data/ds'
import { Formula } from '../Formula'
import { fmt } from '../MiniSheet'
import { Button, Icon, cx } from '../ui'

// Simulasi khusus contoh yang disiapkan (bukan engine formula): menunjukkan langkah cari lalu ambil.

type Mode = 'xlookup' | 'index-match' | 'vlookup' | 'approx'
const FIRST = 38 // baris sheet pertama yang ditampilkan
const SAMPLE = DATA.Asprak.rows.slice(FIRST - 2, FIRST + 6) // 8 baris
const HEAD = DATA.Asprak.headers // NO NIM NAMA KODE
const GRADE = DATA.Grade.rows

interface Step {
  row: number | null
  phase: 'scan' | 'skip' | 'found' | 'return' | 'notfound' | 'candidate' | 'stop'
  msg: string
}

const last = FIRST + SAMPLE.length - 1
const rng = (c: number) => `${colLetter(c + 1)}${FIRST}:${colLetter(c + 1)}${last}`

function build(mode: Mode, value: string, ret: number, nilai: number) {
  const steps: Step[] = []
  let lookCols: number[] = []
  let retCol = ret
  let formula = ''
  let rows: Cell[][] = SAMPLE
  let head = HEAD
  let firstRow = FIRST

  if (mode === 'approx') {
    rows = GRADE
    head = DATA.Grade.headers
    firstRow = 2
    lookCols = [0]
    retCol = 1
    formula = `=VLOOKUP(${nilai},Grade!A2:B8,2,TRUE)`
    let cand: number | null = null
    let stopped = false
    GRADE.forEach(([batas], i) => {
      if (stopped) return
      if ((batas as number) <= nilai) {
        cand = i
        steps.push({ row: i, phase: 'candidate', msg: `Baris ${i + 2}: batas ${batas} <= ${nilai}, jadi kandidat sementara.` })
      } else {
        stopped = true
        steps.push({ row: i, phase: 'stop', msg: `Baris ${i + 2}: batas ${batas} > ${nilai}. Berhenti, pakai kandidat terakhir.` })
      }
    })
    const c = cand as number | null
    if (c !== null) steps.push({ row: c, phase: 'return', msg: `Ambil kolom ke-2 di baris ${c + 2}: ${GRADE[c][1]}.` })
    return { steps, lookCols, retCol, formula, rows, head, firstRow, result: c !== null ? GRADE[c][1] : '#N/A' }
  }

  let keyCol = 3
  if (mode === 'vlookup') {
    keyCol = 1
    formula = `=VLOOKUP(${value},B${FIRST}:D${last},${ret},FALSE)`
    retCol = keyCol + ret - 1
  } else if (mode === 'xlookup') {
    formula = `=XLOOKUP("${value}",${rng(3)},${rng(ret)},"Tidak ada")`
  } else {
    formula = `=INDEX(${rng(ret)},MATCH("${value}",${rng(3)},0))`
  }
  lookCols = [keyCol]

  let found = -1
  for (let i = 0; i < rows.length; i++) {
    const v = String(rows[i][keyCol])
    if (v === value) {
      found = i
      steps.push({ row: i, phase: 'found', msg: `Baris ${FIRST + i}: ${v} = ${value}. Ketemu di urutan ke-${i + 1}.` })
      break
    }
    steps.push({ row: i, phase: 'skip', msg: `Baris ${FIRST + i}: ${v} bukan ${value}, lanjut.` })
  }
  if (found < 0) {
    steps.push({
      row: null,
      phase: 'notfound',
      msg: mode === 'xlookup' ? 'Tidak ketemu sampai bawah. Argumen if_not_found dipakai: "Tidak ada".' : 'Tidak ketemu sampai bawah. Hasilnya #N/A.',
    })
    return { steps, lookCols, retCol, formula, rows, head, firstRow, result: mode === 'xlookup' ? 'Tidak ada' : '#N/A' }
  }
  const how =
    mode === 'vlookup'
      ? `VLOOKUP mengambil kolom ke-${ret} dari kolom B, yaitu kolom ${colLetter(retCol + 1)}.`
      : mode === 'index-match'
        ? `MATCH menghasilkan ${found + 1}. INDEX mengambil isi ke-${found + 1} dari ${rng(ret)}.`
        : `XLOOKUP mengambil isi ${rng(ret)} di posisi yang sama (ke-${found + 1}).`
  steps.push({ row: found, phase: 'return', msg: `${how} Hasil: ${fmt(rows[found][retCol])}.` })
  return { steps, lookCols, retCol, formula, rows, head, firstRow, result: rows[found][retCol] }
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'xlookup', label: 'XLOOKUP' },
  { id: 'index-match', label: 'INDEX-MATCH' },
  { id: 'vlookup', label: 'VLOOKUP' },
  { id: 'approx', label: 'Approximate' },
]

export function LookupVisual() {
  const [mode, setMode] = useState<Mode>('xlookup')
  const [kode, setKode] = useState(String(SAMPLE[5][3]))
  const [nim, setNim] = useState(String(SAMPLE[3][1]))
  const [retX, setRetX] = useState(2) // kolom C NAMA (0-based)
  const [retV, setRetV] = useState(2) // kolom ke-2 dari B = NAMA
  const [nilai, setNilai] = useState(67)
  const [i, setI] = useState(-1)
  const [playing, setPlaying] = useState(false)

  const sim = useMemo(
    () => build(mode, mode === 'vlookup' ? nim : kode, mode === 'vlookup' ? retV : retX, nilai),
    [mode, kode, nim, retX, retV, nilai],
  )
  useEffect(() => {
    setI(-1)
    setPlaying(false)
  }, [sim])
  useEffect(() => {
    if (!playing) return
    if (i >= sim.steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setI((x) => x + 1), 650)
    return () => clearTimeout(t)
  }, [playing, i, sim.steps.length])

  const cur = i >= 0 ? sim.steps[i] : null
  const done = i === sim.steps.length - 1
  const visited = new Map<number, Step['phase']>()
  sim.steps.slice(0, i + 1).forEach((s) => s.row !== null && visited.set(s.row, s.phase))

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cx('rounded-md px-3 py-1.5 text-sm font-semibold', mode === m.id ? 'bg-ink text-bg' : 'bg-sunken text-muted hover:text-ink')}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-3 text-sm">
        {mode === 'approx' ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">Nilai dicari: {nilai}</span>
            <input type="range" min={0} max={100} value={nilai} onChange={(e) => setNilai(Number(e.target.value))} className="w-56 accent-[var(--accent)]" />
          </label>
        ) : mode === 'vlookup' ? (
          <>
            <Select label="NIM dicari" value={nim} onChange={setNim} options={[...SAMPLE.map((r) => String(r[1])), '999']} />
            <Select label="col_index_num" value={String(retV)} onChange={(v) => setRetV(Number(v))} options={['2', '3']} labels={['2 (NAMA)', '3 (KODE)']} />
          </>
        ) : (
          <>
            <Select label="KODE dicari" value={kode} onChange={setKode} options={[...SAMPLE.map((r) => String(r[3])), 'ZZZ']} />
            <Select label="Ambil kolom" value={String(retX)} onChange={(v) => setRetX(Number(v))} options={['0', '1', '2']} labels={['A (NO)', 'B (NIM)', 'C (NAMA)']} />
          </>
        )}
        <div className="ml-auto flex gap-1.5">
          <Button onClick={() => setI((x) => Math.min(x + 1, sim.steps.length - 1))} disabled={done}>
            <Icon name="step" /> Langkah
          </Button>
          <Button variant="primary" onClick={() => (done ? (setI(-1), setPlaying(true)) : setPlaying(true))} disabled={playing}>
            <Icon name="play" /> Putar
          </Button>
          <Button variant="quiet" onClick={() => (setI(-1), setPlaying(false))} aria-label="Ulang">
            <Icon name="reset" />
          </Button>
        </div>
      </div>

      <Formula f={sim.formula} className="mb-3" />

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="mono w-full border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="w-8 border-r border-b border-line bg-sunken" />
              {sim.head.map((h, j) => (
                <th
                  key={j}
                  className={cx(
                    'border-r border-b border-line px-2 py-1 text-left font-semibold',
                    sim.lookCols.includes(j) ? 'bg-accent text-accent-ink' : j === sim.retCol ? 'bg-mark text-[#18202a]' : 'bg-sunken',
                    mode === 'vlookup' && j === 0 && 'opacity-40',
                  )}
                >
                  {colLetter(j + 1)} · {h}
                  {sim.lookCols.includes(j) && <span className="ml-1 font-normal opacity-80">cari</span>}
                  {j === sim.retCol && !sim.lookCols.includes(j) && <span className="ml-1 font-normal opacity-80">ambil</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sim.rows.map((r, ri) => {
              const ph = visited.get(ri)
              const isCur = cur?.row === ri
              return (
                <tr key={ri} className={cx(isCur && 'outline-2 -outline-offset-2 outline-accent')}>
                  <td className="border-r border-b border-line bg-sunken px-1.5 text-right text-muted">{sim.firstRow + ri}</td>
                  {r.map((v, j) => {
                    const isLook = sim.lookCols.includes(j)
                    const isRet = j === sim.retCol && ph === 'return' && cur?.phase === 'return'
                    return (
                      <td
                        key={j}
                        className={cx(
                          'border-r border-b border-line px-2 py-1 whitespace-nowrap transition-colors',
                          mode === 'vlookup' && j === 0 && 'opacity-40',
                          isLook && ph === 'skip' && 'text-muted line-through decoration-1',
                          isLook && ph === 'stop' && 'text-bad',
                          isLook && (ph === 'found' || ph === 'candidate' || ph === 'return') && 'bg-accent/15 font-bold',
                          isRet && 'bg-mark font-bold text-[#18202a]',
                        )}
                      >
                        {fmt(v)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ol className="mt-3 space-y-1 text-sm" aria-live="polite">
        {i < 0 && <li className="text-muted">Tekan Langkah atau Putar untuk mulai.</li>}
        {sim.steps.slice(0, i + 1).map((s, k) => (
          <li key={k} className={cx('flex gap-2', k === i ? 'text-ink' : 'text-muted')}>
            <span className="mono w-5 shrink-0 text-right text-xs leading-6">{k + 1}</span>
            <span>{s.msg}</span>
          </li>
        ))}
        {done && (
          <li className="mt-2 font-semibold">
            Hasil: <span className="mono rounded bg-mark px-1.5 text-[#18202a]">{fmt(sim.result as Cell)}</span>
          </li>
        )}
      </ol>
      {mode === 'vlookup' && <p className="mt-3 text-xs text-muted">Kolom A (NO) di luar table_array, jadi VLOOKUP tidak mungkin mengambilnya. Itu yang dimaksud "tidak bisa ke kiri".</p>}
      {mode === 'approx' && <p className="mt-3 text-xs text-muted">Excel aslinya memakai pencarian biner, bukan satu per satu. Hasilnya sama selama kolom BATAS urut naik.</p>}
    </div>
  )
}

function Select({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: string[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mono rounded-md border border-line bg-surface px-2 py-1.5 text-sm">
        {options.map((o, k) => (
          <option key={o} value={o}>
            {labels?.[k] ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}
