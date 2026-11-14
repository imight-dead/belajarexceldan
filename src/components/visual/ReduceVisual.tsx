import { useEffect, useState } from 'react'
import type { Cell } from '../../data/ds'
import { Formula } from '../Formula'
import { fmt } from '../MiniSheet'
import { Button, Icon, cx } from '../ui'

// Peraga REDUCE dan SCAN: a = akumulator (hasil sementara), x = elemen yang sedang diproses.

type Acc = Cell | Cell[]
interface Mode {
  id: string
  label: string
  formula: string
  note: string
  input: Cell[]
  init: Acc
  fn: (a: Acc, x: Cell) => Acc
  /** cara membaca langkah untuk manusia */
  say: (a: Acc, x: Cell, next: Acc) => string
  scan: boolean
}

const show = (a: Acc) => (Array.isArray(a) ? `{${a.map((v) => fmt(v) || '""').join('; ')}}` : fmt(a) === '' ? '""' : fmt(a))

const MODES: Mode[] = [
  {
    id: 'reduce',
    label: 'REDUCE jumlah',
    formula: '=REDUCE(0,A2:A6,LAMBDA(a,x,a+x))',
    note: 'REDUCE berjalan dari atas ke bawah dan hanya menyisakan satu hasil akhir.',
    input: [5, 3, 8, 2, 6],
    init: 0,
    fn: (a, x) => (a as number) + (x as number),
    say: (a, x, n) => `a = ${show(a)}, x = ${show(x)}. Hitung a+x = ${show(n)}. Ini jadi a yang baru.`,
    scan: false,
  },
  {
    id: 'scan',
    label: 'SCAN jumlah berjalan',
    formula: '=SCAN(0,A2:A6,LAMBDA(a,x,a+x))',
    note: 'Sama seperti REDUCE, tapi setiap hasil sementara ditulis ke sel. Jadinya total berjalan.',
    input: [5, 3, 8, 2, 6],
    init: 0,
    fn: (a, x) => (a as number) + (x as number),
    say: (a, x, n) => `a = ${show(a)}, x = ${show(x)}. a+x = ${show(n)}, ditulis ke sel hasil.`,
    scan: true,
  },
  {
    id: 'fill',
    label: 'SCAN isi ke bawah',
    formula: '=SCAN("",A2:A7,LAMBDA(a,x,IF(x="",a,x)))',
    note: 'Kalau selnya kosong, pakai nilai sebelumnya (a). Kalau terisi, pakai isinya (x). Cocok untuk kolom KELAS di PresensiKotor.',
    input: ['IF-49-01', '', '', 'IF-49-02', '', 'IF-49-03'],
    init: '',
    fn: (a, x) => (x === '' ? a : x),
    say: (a, x, n) => (x === '' ? `x kosong, jadi pakai a = ${show(a)}.` : `x terisi ${show(x)}, jadi itu hasilnya.`) + ` Hasil: ${show(n)}.`,
    scan: true,
  },
  {
    id: 'stack',
    label: 'REDUCE + VSTACK',
    formula: '=REDUCE("KODE",A2:A7,LAMBDA(a,x,IF(RIGHT(x,1)="R",VSTACK(a,x),a)))',
    note: 'a bisa berupa daftar. Setiap x yang memenuhi syarat ditumpuk ke bawah dengan VSTACK. Ini seperti membuat FILTER sendiri.',
    input: ['A-01 B', 'B-04 R', 'B-05 B', 'B-06 R', 'C-06 R', 'D-01 B'],
    init: 'KODE',
    fn: (a, x) => (String(x).endsWith('R') ? [...(Array.isArray(a) ? a : [a]), x] : a),
    say: (_a, x, n) => (String(x).endsWith('R') ? `${show(x)} berakhiran R, jadi ditumpuk ke a.` : `${show(x)} bukan R, a tidak berubah.`) + ` a sekarang ${show(n)}.`,
    scan: false,
  },
]

export function ReduceVisual() {
  const [mi, setMi] = useState(0)
  const [i, setI] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const m = MODES[mi]

  const steps: { a: Acc; x: Cell; next: Acc }[] = []
  let acc = m.init
  for (const x of m.input) {
    const next = m.fn(acc, x)
    steps.push({ a: acc, x, next })
    acc = next
  }
  const done = i >= steps.length - 1

  useEffect(() => {
    if (!playing) return
    if (done) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setI((v) => v + 1), 900)
    return () => clearTimeout(t)
  }, [playing, i, done])

  const pick = (k: number) => {
    setMi(k)
    setI(-1)
    setPlaying(false)
  }
  const cur = steps[i]

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {MODES.map((x, k) => (
          <button key={x.id} onClick={() => pick(k)} className={cx('rounded-md px-2.5 py-1 text-xs font-semibold', mi === k ? 'bg-ink text-bg' : 'border border-line hover:bg-sunken')}>
            {x.label}
          </button>
        ))}
      </div>
      <Formula f={m.formula} className="mb-1" />
      <p className="mb-4 text-sm text-muted">{m.note}</p>

      <div className="flex flex-wrap items-start gap-4">
        <table className="mono border-collapse text-[12px]">
          <thead>
            <tr>
              <th className="border-r border-b border-line bg-sunken px-1" />
              <th className="border-r border-b border-line bg-sunken px-2 py-0.5 text-left">A · data</th>
              {m.scan && <th className="border-r border-b border-line bg-sunken px-2 py-0.5 text-left">B · hasil SCAN</th>}
            </tr>
          </thead>
          <tbody>
            {m.input.map((v, k) => (
              <tr key={k}>
                <td className="border-r border-b border-line bg-sunken px-1 text-right text-muted">{k + 2}</td>
                <td className={cx('min-w-20 border-r border-b border-line px-2 py-1 transition-colors', k === i && 'bg-accent text-accent-ink', k < i && 'text-muted')}>{fmt(v)}</td>
                {m.scan && <td className={cx('min-w-24 border-r border-b border-line px-2 py-1', k === i && 'bg-mark font-bold text-[#18202a]')}>{k <= i ? fmt(steps[k].next as Cell) : ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="min-w-56 flex-1">
          <div className="mb-2 rounded-md bg-sunken px-3 py-2 text-sm">
            <div className="text-xs font-semibold text-muted">a (hasil sementara)</div>
            <div className="mono text-base font-bold">{show(cur ? cur.next : m.init)}</div>
          </div>
          <ol className="space-y-1 text-sm" aria-live="polite">
            {i < 0 && <li className="text-muted">Awalnya a = {show(m.init)}. Tekan Langkah.</li>}
            {steps.slice(0, i + 1).map((s, k) => (
              <li key={k} className={cx('flex gap-2', k === i ? 'text-ink' : 'text-muted')}>
                <span className="mono w-4 shrink-0 text-right text-xs leading-6">{k + 1}</span>
                <span>{m.say(s.a, s.x, s.next)}</span>
              </li>
            ))}
            {done && <li className="mt-2 font-semibold">{m.scan ? 'SCAN mengembalikan semua hasil sementara (kolom B).' : `REDUCE mengembalikan a terakhir: ${show(acc)}.`}</li>}
          </ol>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        <Button onClick={() => setI((v) => Math.min(v + 1, steps.length - 1))} disabled={done}>
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
  )
}
