import { useState } from 'react'
import { LEVELS } from '../content/levels'
import type { QuizQ } from '../content/types'
import { href } from '../lib/router'
import { markRight, markWrong, update, useStore, type ReviewItem } from '../lib/store'
import { Formula } from '../components/Formula'
import { Markup } from '../components/Markup'
import { MiniSheet } from '../components/MiniSheet'
import { checkQuiz } from '../components/Quiz'
import { Button, Callout, Card, Chip, cx } from '../components/ui'

const quizById = new Map<string, QuizQ>(LEVELS.flatMap((l) => l.quiz.map((q) => [q.id, q] as const)))

export function Review() {
  const review = useStore((s) => s.review)
  const items = Object.values(review).sort((a, b) => a.due - b.due)
  const now = Date.now()
  const due = items.filter((i) => i.due <= now)
  const later = items.filter((i) => i.due > now)

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Ulang soal salah</h1>
      <p className="mt-2 mb-6 max-w-2xl text-muted">
        Soal yang pernah salah masuk sini. Jawab benar dan soal itu muncul lagi besok, lalu 2 hari kemudian, lalu 4 hari. Benar 4 kali berturut-turut, soal dianggap hafal. Salah lagi, mulai dari awal.
      </p>
      {!items.length && <Callout tone="ok">Belum ada soal yang perlu diulang. Kerjakan kuis atau workbook dulu.</Callout>}
      {due.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold tracking-wider text-muted uppercase">Jatuh tempo ({due.length})</h2>
          {due.map((it) => (
            <ReviewCard key={it.id} it={it} />
          ))}
        </section>
      )}
      {later.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-bold tracking-wider text-muted uppercase">Nanti ({later.length})</h2>
          <Card>
            <ul className="divide-y divide-line text-sm">
              {later.map((it) => (
                <li key={it.id} className="flex items-center gap-3 px-4 py-2">
                  <Chip>L{it.level}</Chip>
                  <span className="flex-1 truncate">{it.label}</span>
                  <span className="text-xs text-muted">{new Date(it.due).toLocaleDateString('id-ID', { weekday: 'long' })}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  )
}

function ReviewCard({ it }: { it: ReviewItem }) {
  const [kind, id] = it.id.split(':')
  const [a, setA] = useState<string | number>('')
  const [res, setRes] = useState<boolean | null>(null)

  if (kind === 'excel')
    return (
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Chip>L{it.level}</Chip>
        <span className="flex-1 font-semibold">{it.label}</span>
        <span className="text-xs text-muted">kotak {it.box}</span>
        <a href={href('level', it.level, 'latihan', id)} className="text-sm font-semibold text-accent hover:underline">
          Kerjakan ulang di workbook
        </a>
      </Card>
    )

  const q = quizById.get(id)
  if (!q) return null
  const finish = () => {
    const ok = checkQuiz(q, a)
    setRes(ok)
    update((s) => (ok ? markRight(s, it.id) : markWrong(s, { id: it.id, level: it.level, label: it.label })))
  }
  return (
    <Card className={cx('p-4', res === true && 'border-ok', res === false && 'border-bad')}>
      <div className="mb-2 flex items-center gap-2">
        <Chip>L{it.level}</Chip>
        <span className="text-xs text-muted">kotak {it.box}</span>
      </div>
      <p className="mb-2">
        <Markup text={q.q} />
      </p>
      {q.table && (
        <div className="mb-2 max-w-md">
          <MiniSheet t={q.table} />
        </div>
      )}
      {q.formula && <Formula f={q.formula} className="mb-2" />}
      {q.type === 'mcq' ? (
        <div className="grid gap-1.5">
          {q.options.map((o, k) => (
            <label key={k} className={cx('flex items-start gap-2 rounded-md border px-3 py-1.5 text-sm', a === k ? 'border-accent' : 'border-line')}>
              <input type="radio" name={it.id} checked={a === k} disabled={res !== null} onChange={() => setA(k)} className="mt-1 accent-[var(--accent)]" />
              <Markup text={o} />
            </label>
          ))}
        </div>
      ) : (
        <input value={a} disabled={res !== null} onChange={(e) => setA(e.target.value)} className="mono w-full max-w-sm rounded-md border border-line bg-bg px-3 py-1.5 text-sm" />
      )}
      {res === null ? (
        <Button variant="primary" className="mt-3" onClick={finish} disabled={a === ''}>
          Periksa
        </Button>
      ) : (
        <div className="mt-3 rounded-md bg-sunken px-3 py-2 text-sm">
          <b>{res ? 'Benar.' : 'Masih salah.'}</b> <Markup text={q.why} />
        </div>
      )}
    </Card>
  )
}
