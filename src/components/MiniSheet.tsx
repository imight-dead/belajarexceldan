import { colLetter, type Cell } from '../data/ds'
import type { MiniTable } from '../content/types'
import { cx } from './ui'

export function fmt(v: Cell | undefined): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6)
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return v
}

/** Potongan sheet dengan huruf kolom dan nomor baris, seperti di Excel. */
export function MiniSheet({
  t,
  cellClass,
  maxRows = 12,
}: {
  t: MiniTable
  cellClass?: (r: number, c: number) => string | undefined
  maxRows?: number
}) {
  const c0 = t.startCol ?? 1
  const r0 = t.startRow ?? 2
  const showHeader = r0 >= 2
  const rows = t.rows.slice(0, maxRows)
  return (
    <div className="overflow-x-auto rounded-md border border-line">
      {t.sheet && <div className="border-b border-line bg-sunken px-2 py-1 text-xs font-semibold text-muted">Sheet {t.sheet}</div>}
      <table className="mono w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className="w-8 border-r border-b border-line bg-sunken" />
            {t.headers.map((_, j) => (
              <th key={j} className={cx('border-r border-b border-line bg-sunken px-2 py-0.5 font-normal text-muted', t.highlight?.cols?.includes(j) && 'text-ink')}>
                {colLetter(c0 + j)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {showHeader && (
            <tr>
              <td className="border-r border-b border-line bg-sunken px-1.5 text-right text-muted">1</td>
              {t.headers.map((h, j) => (
                <td key={j} className="border-r border-b border-line px-2 py-0.5 font-semibold whitespace-nowrap">
                  {h}
                </td>
              ))}
            </tr>
          )}
          {r0 > 2 && (
            <tr>
              <td className="border-r border-b border-line bg-sunken px-1.5 text-right text-muted">⋮</td>
              <td colSpan={t.headers.length} className="border-b border-line" />
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className={cx(t.highlight?.rows?.includes(i) && 'bg-mark-soft')}>
              <td className="border-r border-b border-line bg-sunken px-1.5 text-right text-muted">{r0 + i}</td>
              {r.map((v, j) => (
                <td
                  key={j}
                  className={cx(
                    'border-r border-b border-line px-2 py-0.5 whitespace-nowrap',
                    typeof v === 'number' && 'text-right',
                    t.highlight?.cols?.includes(j) && 'bg-mark-soft/60',
                    cellClass?.(i, j),
                  )}
                >
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {t.rows.length > maxRows && <div className="px-2 py-1 text-xs text-muted">... {t.rows.length - maxRows} baris lagi</div>}
    </div>
  )
}
