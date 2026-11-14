import { useState, type ReactNode } from 'react'
import type { Concept } from '../content/types'
import { Formula } from './Formula'
import { Markup } from './Markup'
import { MiniSheet } from './MiniSheet'
import { LookupVisual } from './visual/LookupVisual'
import { OffsetVisual } from './visual/OffsetVisual'
import { SpillVisual } from './visual/SpillVisual'
import { ReduceVisual } from './visual/ReduceVisual'
import { cx } from './ui'

const VISUAL = { lookup: LookupVisual, offset: OffsetVisual, spill: SpillVisual, reduce: ReduceVisual }

/** Satu topik materi. Dibuat untuk dibaca pelan: kolom sempit, satu ide per blok, detail dilipat. */
export function ConceptView({ c }: { c: Concept }) {
  const V = c.visual ? VISUAL[c.visual] : null
  const [first, ...more] = c.examples ?? []
  return (
    <article className="max-w-[68ch]">
      <h2 className="text-2xl leading-tight font-extrabold tracking-tight sm:text-[1.7rem]">{c.title}</h2>

      {c.intro && (
        <p className="mt-4 rounded-lg bg-mark-soft px-4 py-3 text-[16.5px] leading-relaxed">
          <span className="mr-1.5 font-bold">Intinya:</span>
          <Markup text={c.intro} />
        </p>
      )}

      <div className="mt-5 space-y-4 text-[16px] leading-[1.75]">
        {c.body.map((p, i) => (
          <p key={i}>
            <Markup text={p} />
          </p>
        ))}
      </div>

      {V && (
        <Block title="Coba sendiri">
          <V />
        </Block>
      )}

      {c.syntax && (
        <Block title="Cara menulisnya">
          <div className="space-y-5">
            {c.syntax.map((s, i) => (
              <div key={i}>
                <Formula f={s.formula} />
                <ul className="mt-3 space-y-2.5">
                  {s.args.map((a) => (
                    <li key={a.name} className="border-l-2 border-line pl-3">
                      <div className="mono text-[13px] font-semibold">
                        {a.name}
                        {a.optional && <span className="ml-2 font-sans text-xs font-normal text-muted">boleh dikosongkan</span>}
                      </div>
                      <div className="text-[15px] text-muted">
                        <Markup text={a.desc} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Block>
      )}

      {c.grid && (
        <Block title={c.syntax ? 'Daftar' : 'Ringkasan'}>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-[15px]">
              <thead className="bg-sunken text-left text-sm">
                <tr>
                  {c.grid.headers.map((h) => (
                    <th key={h} className="px-3 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.grid.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line align-top">
                    {r.map((v, j) => (
                      <td key={j} className={j === 0 ? 'mono px-3 py-2 text-[13px] font-semibold whitespace-nowrap' : 'px-3 py-2'}>
                        <Markup text={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}

      {first && (
        <Block title="Contoh">
          <ExampleCard e={first} />
          {more.length > 0 && (
            <Fold label={`Lihat ${more.length} contoh lain`}>
              <div className="space-y-3">
                {more.map((e, i) => (
                  <ExampleCard key={i} e={e} />
                ))}
              </div>
            </Fold>
          )}
        </Block>
      )}

      {(c.mistakes || c.tips) && (
        <div className="mt-8 space-y-2">
          {c.mistakes && (
            <Fold label={`Jebakan yang sering bikin salah (${c.mistakes.length})`} tone="bad">
              <ul className="space-y-2.5 text-[15px]">
                {c.mistakes.map((m, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-bad" />
                    <span>
                      <Markup text={m} />
                    </span>
                  </li>
                ))}
              </ul>
            </Fold>
          )}
          {c.tips && (
            <Fold label="Tips" tone="ok">
              <ul className="space-y-2.5 text-[15px]">
                {c.tips.map((t, i) => (
                  <li key={i}>
                    <Markup text={t} />
                  </li>
                ))}
              </ul>
            </Fold>
          )}
        </div>
      )}
    </article>
  )
}

function ExampleCard({ e }: { e: NonNullable<Concept['examples']>[number] }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      {e.table && (
        <div className="mb-3">
          <MiniSheet t={e.table} maxRows={8} />
        </div>
      )}
      <Formula f={e.formula} copy />
      <p className="mt-3 text-[15px]">
        Hasilnya: <span className="mono rounded bg-mark-soft px-1.5 py-0.5 font-semibold">{e.result}</span>
      </p>
      {e.note && (
        <p className="mt-1.5 text-[15px] text-muted">
          <Markup text={e.note} />
        </p>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h3 className="mb-3 text-base font-bold">{title}</h3>
      {children}
    </section>
  )
}

export function Fold({ label, children, tone = 'plain', defaultOpen = false }: { label: string; children: ReactNode; tone?: 'plain' | 'bad' | 'ok'; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cx('mt-3 rounded-lg border', tone === 'bad' ? 'border-bad/30' : tone === 'ok' ? 'border-ok/30' : 'border-line')}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cx('flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold', tone === 'bad' && 'text-bad', tone === 'ok' && 'text-ok')}
      >
        <span className={cx('inline-block transition-transform', open && 'rotate-90')}>›</span>
        {label}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}
