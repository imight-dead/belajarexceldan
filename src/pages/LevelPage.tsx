import { levelByN } from '../content/levels'
import type { Level } from '../content/types'
import { href } from '../lib/router'
import { update, useStore } from '../lib/store'
import { ConceptView } from '../components/ConceptView'
import { Chip, Icon, cx } from '../components/ui'

export function LevelPage({ n, focus }: { n: number; focus?: string }) {
  const level = levelByN(n)
  const read = useStore((x) => x.read)
  if (!level) return <p>Level tidak ditemukan.</p>

  const doneCount = level.concepts.filter((c) => read[`${level.n}:${c.id}`]).length

  return (
    <div>
      <header className="mb-8 border-b border-line pb-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-semibold">Level {level.n}</span>
          <span>·</span>
          <span>{level.day}</span>
          <Chip tone={doneCount === level.concepts.length ? 'ok' : 'plain'}>
            {doneCount}/{level.concepts.length} topik dibaca
          </Chip>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{level.title}</h1>
        {level.goal && <p className="mt-2 max-w-2xl text-muted">{level.goal}</p>}
      </header>

      <Lessons level={level} focus={focus} />
    </div>
  )
}

/** Materi dibaca satu topik per layar supaya tidak terasa menumpuk. */
function Lessons({ level, focus }: { level: Level; focus?: string }) {
  const read = useStore((s) => s.read)
  const list = level.concepts
  const idx = Math.max(0, list.findIndex((c) => c.id === focus))
  const c = list[idx]
  const key = (id: string) => `${level.n}:${id}`
  const doneCount = list.filter((x) => read[key(x.id)]).length
  const prev = list[idx - 1]
  const next = list[idx + 1]
  const nextLevel = levelByN(level.n + 1)

  const go = (id: string) => {
    location.hash = href('level', level.n, 'materi', id)
    window.scrollTo({ top: 0 })
  }
  const markAndNext = () => {
    update((s) => ({ ...s, read: { ...s.read, [key(c.id)]: true } }))
    if (next) {
      go(next.id)
    } else if (nextLevel) {
      location.hash = href('level', nextLevel.n)
      window.scrollTo({ top: 0 })
    } else {
      location.hash = href()
      window.scrollTo({ top: 0 })
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-10">
      <aside className="no-print mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-20">
          <div className="mb-2 flex items-baseline justify-between text-xs text-muted">
            <span className="font-bold tracking-wider uppercase">Daftar topik</span>
            <span>
              {doneCount}/{list.length} paham
            </span>
          </div>
          {/* HP: dropdown, desktop: daftar */}
          <select value={c.id} onChange={(e) => go(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm lg:hidden" aria-label="Pilih topik">
            {list.map((x, i) => (
              <option key={x.id} value={x.id}>
                {i + 1}. {x.title}
                {read[key(x.id)] ? ' ✓' : ''}
              </option>
            ))}
          </select>
          <ol className="hidden space-y-0.5 lg:block">
            {list.map((x, i) => {
              const active = x.id === c.id
              return (
                <li key={x.id}>
                  <a
                    href={href('level', level.n, 'materi', x.id)}
                    onClick={() => window.scrollTo({ top: 0 })}
                    className={cx('flex items-start gap-2.5 rounded-md px-2 py-1.5 text-sm leading-snug', active ? 'bg-sunken font-semibold' : 'text-muted hover:text-ink')}
                  >
                    <span
                      className={cx(
                        'mt-px grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                        read[key(x.id)] ? 'bg-ok text-white' : active ? 'bg-ink text-bg' : 'bg-sunken text-muted',
                      )}
                    >
                      {read[key(x.id)] ? <Icon name="check" className="size-3" /> : i + 1}
                    </span>
                    <span>{x.title}</span>
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-3 text-sm text-muted">
          Topik {idx + 1} dari {list.length}
        </div>
        <ConceptView key={c.id} c={c} />

        <div className="no-print mt-12 flex max-w-[68ch] flex-wrap items-center gap-3 border-t border-line pt-6">
          {prev ? (
            <button onClick={() => go(prev.id)} className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-sunken">
              ‹ Sebelumnya
            </button>
          ) : (
            <span />
          )}
          <button onClick={markAndNext} className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90">
            {next ? 'Sudah paham, lanjut ›' : nextLevel ? `Lanjut ke Level ${nextLevel.n} ›` : 'Selesai semua materi ›'}
          </button>
        </div>
        {next && (
          <p className="mt-2 max-w-[68ch] text-right text-xs text-muted">
            Berikutnya: {next.title}
          </p>
        )}
      </div>
    </div>
  )
}
