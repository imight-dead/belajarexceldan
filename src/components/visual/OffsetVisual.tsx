import { useState } from 'react'
import { DATA, colLetter } from '../../data/ds'
import { Formula } from '../Formula'
import { fmt } from '../MiniSheet'
import { cx } from '../ui'

// Potongan sheet Inventaris baris 1-10, kolom A-H. Titik awal bisa A1 atau C5.
const ROWS = 10
const COLS = 8
const grid = [DATA.Inventaris.headers, ...DATA.Inventaris.rows.slice(0, ROWS - 1)]
const STARTS = [
  { label: 'A1', r: 0, c: 0 },
  { label: 'C5', r: 4, c: 2 },
]

export function OffsetVisual() {
  const [start, setStart] = useState(0)
  const [down, setDown] = useState(5)
  const [right, setRight] = useState(2)
  const [h, setH] = useState(1)
  const [w, setW] = useState(1)
  const s = STARTS[start]
  const r1 = s.r + down
  const c1 = s.c + right
  const out = r1 < 0 || c1 < 0
  const addr = (r: number, c: number) => `${colLetter(c + 1)}${r + 1}`
  const range = out ? '#REF!' : h === 1 && w === 1 ? addr(r1, c1) : `${addr(r1, c1)}:${addr(r1 + h - 1, c1 + w - 1)}`
  const inRes = (r: number, c: number) => !out && r >= r1 && r < r1 + h && c >= c1 && c < c1 + w
  const args = [down, right, ...(h !== 1 || w !== 1 ? [h, w] : [])].join(',')

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          Titik awal
          <select value={start} onChange={(e) => setStart(Number(e.target.value))} className="mono rounded-md border border-line bg-bg px-2 py-1.5 text-sm text-ink">
            {STARTS.map((x, i) => (
              <option key={x.label} value={i}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <Num label="Turun" value={down} set={setDown} min={-5} max={ROWS - 1} />
        <Num label="Kanan" value={right} set={setRight} min={-3} max={COLS - 1} />
        <Num label="Tinggi" value={h} set={setH} min={1} max={5} />
        <Num label="Lebar" value={w} set={setW} min={1} max={4} />
      </div>

      <Formula f={`=OFFSET(${s.label},${args})`} className="mb-2" />
      <p className="mb-3 text-sm">
        Menunjuk ke <span className={cx('mono rounded px-1.5 py-0.5 font-semibold', out ? 'bg-bad-soft text-bad' : 'bg-mark-soft')}>{range}</span>
        {out && <span className="ml-2 text-muted">Keluar dari sheet, jadi error.</span>}
      </p>

      <div className="overflow-x-auto rounded-md border border-line">
        <table className="mono w-full border-collapse text-[11.5px]">
          <thead>
            <tr>
              <th className="w-7 border-r border-b border-line bg-sunken" />
              {Array.from({ length: COLS }, (_, c) => (
                <th key={c} className="border-r border-b border-line bg-sunken px-1.5 py-0.5 font-semibold text-muted">
                  {colLetter(c + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="border-r border-b border-line bg-sunken px-1 text-right text-muted">{r + 1}</td>
                {row.slice(0, COLS).map((v, c) => (
                  <td
                    key={c}
                    className={cx(
                      'border-r border-b border-line px-1.5 py-1 whitespace-nowrap transition-colors',
                      r === 0 && 'font-semibold',
                      inRes(r, c) && 'bg-accent text-accent-ink',
                      r === s.r && c === s.c && !inRes(r, c) && 'outline-2 -outline-offset-2 outline-dashed outline-ink',
                    )}
                  >
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">Garis putus-putus = titik awal. Kotak biru = hasil OFFSET.</p>
    </div>
  )
}

function Num({ label, value, set, min, max }: { label: string; value: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      <div className="flex items-center rounded-md border border-line bg-bg">
        <button onClick={() => set(Math.max(min, value - 1))} className="px-2.5 py-1 text-base text-ink hover:bg-sunken" aria-label={`Kurangi ${label}`}>
          −
        </button>
        <span className="mono flex-1 text-center text-sm text-ink">{value}</span>
        <button onClick={() => set(Math.min(max, value + 1))} className="px-2.5 py-1 text-base text-ink hover:bg-sunken" aria-label={`Tambah ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}
