import { useState } from 'react'
import { DATA, type Cell } from '../../data/ds'
import { Formula } from '../Formula'
import { fmt } from '../MiniSheet'
import { cx } from '../ui'

// Data sumber: Inventaris baris 8 sampai 19 (LAB B dan LAB C), kolom KODE, RUANG, RAM, HARGA.
const SRC: Cell[][] = DATA.Inventaris.rows.slice(6, 18).map((r) => [r[0], r[1], r[3], r[7]])
const HEAD = ['KODE', 'RUANG', 'RAM', 'HARGA']

type Mode = 'filter' | 'sort' | 'unique' | 'choosecols' | 'take'
const MODES: { id: Mode; label: string; formula: string; note: string; run: () => Cell[][] }[] = [
  {
    id: 'filter',
    label: 'FILTER',
    formula: '=FILTER(A2:D13,C2:C13=32)',
    note: 'Ambil semua baris yang RAM-nya 32.',
    run: () => SRC.filter((r) => r[2] === 32),
  },
  {
    id: 'sort',
    label: 'SORT',
    formula: '=SORT(A2:D13,4,-1)',
    note: 'Urutkan berdasarkan kolom ke-4 (HARGA), dari besar ke kecil.',
    run: () => [...SRC].sort((a, b) => (b[3] as number) - (a[3] as number)),
  },
  {
    id: 'unique',
    label: 'UNIQUE',
    formula: '=UNIQUE(B2:B13)',
    note: 'Daftar ruang tanpa dobel.',
    run: () => [...new Set(SRC.map((r) => r[1]))].map((v) => [v]),
  },
  {
    id: 'choosecols',
    label: 'CHOOSECOLS',
    formula: '=CHOOSECOLS(A2:D13,1,4)',
    note: 'Ambil kolom ke-1 dan ke-4 saja.',
    run: () => SRC.map((r) => [r[0], r[3]]),
  },
  {
    id: 'take',
    label: 'TAKE',
    formula: '=TAKE(SORT(A2:D13,4,-1),3)',
    note: 'Urutkan dulu, lalu ambil 3 baris teratas: 3 PC termahal.',
    run: () => [...SRC].sort((a, b) => (b[3] as number) - (a[3] as number)).slice(0, 3),
  },
]

export function SpillVisual() {
  const [mode, setMode] = useState<Mode>('filter')
  const [block, setBlock] = useState(false)
  const m = MODES.find((x) => x.id === mode)!
  const out = m.run()
  const outW = Math.max(...out.map((r) => r.length))
  const outH = out.length
  // sel penghalang: baris ke-2 hasil, kolom pertama hasil
  const blockAt = { r: 1, c: 0 }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {MODES.map((x) => (
          <button
            key={x.id}
            onClick={() => setMode(x.id)}
            className={cx('mono rounded-md px-2.5 py-1 text-xs font-semibold', mode === x.id ? 'bg-ink text-bg' : 'border border-line hover:bg-sunken')}
          >
            {x.label}
          </button>
        ))}
      </div>
      <Formula f={m.formula} className="mb-1" />
      <p className="mb-4 text-sm text-muted">{m.note} Rumusnya ditulis di sel <b className="mono text-ink">F2</b> saja.</p>

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div>
          <div className="mb-1 text-xs font-semibold text-muted">Data sumber A1:D13</div>
          <Sheet head={HEAD} rows={SRC} />
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted">Hasil di kolom F dan sebelahnya</div>
          <div className="overflow-x-auto rounded-md border border-line">
            <table className="mono border-collapse text-[11.5px]">
              <tbody>
                {Array.from({ length: Math.max(outH, 3) }, (_, r) => (
                  <tr key={r}>
                    <td className="border-r border-b border-line bg-sunken px-1 text-right text-muted">{r + 2}</td>
                    {Array.from({ length: Math.max(outW, 2) }, (_, c) => {
                      const inSpill = r < outH && c < outW
                      const isAnchor = r === 0 && c === 0
                      const isBlock = block && r === blockAt.r && c === blockAt.c
                      let text = ''
                      if (block) text = isAnchor ? '#SPILL!' : isBlock ? 'catatan' : ''
                      else if (inSpill) text = fmt(out[r][c])
                      return (
                        <td
                          key={c}
                          className={cx(
                            'min-w-16 border-r border-b border-line px-1.5 py-1 whitespace-nowrap',
                            !block && inSpill && 'bg-accent/10',
                            !block && isAnchor && 'bg-accent/25 font-bold',
                            block && isAnchor && 'font-bold text-bad',
                            block && inSpill && !isAnchor && !isBlock && 'outline-1 -outline-offset-1 outline-dashed outline-bad/60',
                            isBlock && 'bg-bad-soft',
                          )}
                        >
                          {text}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            Taruh tulisan di sel F3 (menghalangi jalur hasil)
          </label>
          <p className="mt-2 text-sm text-muted">
            {block
              ? 'Hasil tidak punya tempat untuk tumpah, jadi muncul #SPILL!. Hapus isi F3 dan hasilnya kembali.'
              : `Hasilnya ${outH} baris x ${outW} kolom, otomatis tumpah dari F2. Untuk memakai seluruh hasil di rumus lain, tulis F2# (dengan tanda pagar).`}
          </p>
        </div>
      </div>
    </div>
  )
}

function Sheet({ head, rows }: { head: string[]; rows: Cell[][] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      <table className="mono border-collapse text-[11.5px]">
        <thead>
          <tr>
            <th className="border-r border-b border-line bg-sunken px-1" />
            {head.map((h, i) => (
              <th key={h} className="border-r border-b border-line bg-sunken px-1.5 py-0.5 text-left font-semibold">
                {'ABCD'[i]} · {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border-r border-b border-line bg-sunken px-1 text-right text-muted">{i + 2}</td>
              {r.map((v, j) => (
                <td key={j} className="border-r border-b border-line px-1.5 py-0.5 whitespace-nowrap">
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
