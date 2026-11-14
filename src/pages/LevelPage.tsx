import { levelByN } from '../content/levels'
import type { Level } from '../content/types'
import { href } from '../lib/router'
import { PASS, isUnlocked, update, useStore } from '../lib/store'
import { ConceptView } from '../components/ConceptView'
import { ExcelPractice } from '../components/ExcelPractice'
import { WordPractice } from '../components/WordPractice'
import { DesignPractice } from '../components/DesignPractice'
import { Quiz } from '../components/Quiz'
import { Chip, Icon, cx } from '../components/ui'

export function LevelPage({ n, tab = 'materi', focus }: { n: number; tab?: string; focus?: string }) {
  const level = levelByN(n)
  const s = useStore((x) => x)
  if (!level) return <p>Level tidak ditemukan.</p>
  const open = isUnlocked(s, n)
  const kind = level.practice ?? 'excel'

  const tabs = [
    { id: 'materi', label: 'Materi', count: level.concepts.length },
    { id: 'latihan', label: kind === 'excel' ? 'Latihan Excel' : kind === 'word' ? 'Latihan Word' : 'Latihan desain', count: null },
    { id: 'kuis', label: 'Kuis', count: level.quiz.length },
  ]

  return (
    <div>
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-semibold">Level {level.n}</span>
          <span>·</span>
          <span>{level.day}</span>
          {s.quiz[n] && <Chip tone={s.quiz[n].best >= PASS ? 'ok' : 'plain'}>Kuis terbaik {s.quiz[n].best}%</Chip>}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{level.title}</h1>
        {level.goal && <p className="mt-2 max-w-2xl text-muted">{level.goal}</p>}
      </header>

      {!open ? (
        <div className="rounded-lg border border-line bg-surface p-6">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <Icon name="lock" /> Terkunci
          </div>
          <p className="text-sm text-muted">
            Selesaikan kuis Level {n - 1} dengan skor minimal {PASS}% untuk membuka level ini. Atau aktifkan <b>Buka semua level</b> di menu untuk mode review.
          </p>
          <a href={href('level', n - 1, 'kuis')} className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
            Ke kuis Level {n - 1}
          </a>
        </div>
      ) : (
        <>
          <nav className="no-print sticky top-[53px] z-10 -mx-4 mb-8 flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-line bg-bg/95 px-4 backdrop-blur lg:top-0 lg:mx-0 lg:px-0" role="tablist">
            {tabs.map((t) => (
              <a
                key={t.id}
                href={href('level', n, t.id)}
                role="tab"
                aria-selected={tab === t.id}
                className={cx(
                  '-mb-px flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap',
                  tab === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {t.label}
                {t.count !== null && <span className="rounded bg-sunken px-1.5 text-[11px] text-muted">{t.count}</span>}
              </a>
            ))}
          </nav>

          {tab === 'materi' && <Lessons level={level} focus={focus} />}
          {tab === 'latihan' && kind === 'excel' && <ExcelPractice level={level} focus={focus} />}
          {tab === 'latihan' && kind === 'word' && <WordPractice focus={focus} />}
          {tab === 'latihan' && kind === 'design' && <DesignPractice focus={focus} />}
          {tab === 'kuis' && <Quiz key={n} level={level} />}
        </>
      )}
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
  const go = (id: string) => {
    location.hash = href('level', level.n, 'materi', id)
    window.scrollTo({ top: 0 })
  }
  const markAndNext = () => {
    update((s) => ({ ...s, read: { ...s.read, [key(c.id)]: true } }))
    if (next) go(next.id)
    else location.hash = href('level', level.n, 'latihan')
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
        <ConceptView key={c.id} c={c} level={level.n} />

        <div className="no-print mt-12 flex max-w-[68ch] flex-wrap items-center gap-3 border-t border-line pt-6">
          {prev ? (
            <button onClick={() => go(prev.id)} className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-sunken">
              ‹ Sebelumnya
            </button>
          ) : (
            <span />
          )}
          <button onClick={markAndNext} className="ml-auto rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90">
            {next ? 'Sudah paham, lanjut ›' : 'Sudah paham, ke latihan ›'}
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
