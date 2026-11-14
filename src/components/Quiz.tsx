import { useMemo, useState } from 'react'
import type { Level, QuizQ } from '../content/types'
import { canonFormula } from '../lib/formula'
import { PASS, markRight, markWrong, update, useStore } from '../lib/store'
import { Formula } from './Formula'
import { Markup } from './Markup'
import { MiniSheet } from './MiniSheet'
import { Button, Callout, Chip, cx } from './ui'

const KIND = { konsep: 'Konsep', tebak: 'Tebak hasil', error: 'Cari kesalahan' }

export function checkQuiz(q: QuizQ, a: string | number | undefined): boolean {
  if (a === undefined || a === '') return false
  if (q.type === 'mcq') return a === q.answer
  const v = String(a)
  if (q.mode === 'number') return q.accept.some((x) => Number(x) === Number(v.replace(',', '.').trim()))
  if (q.mode === 'formula') return q.accept.some((x) => canonFormula(x) === canonFormula(v))
  const norm = (t: string) => t.trim().toLowerCase().replace(/\s*([,;])\s*/g, '$1').replace(/\s+/g, ' ')
  return q.accept.some((x) => norm(x) === norm(v))
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Quiz({ level }: { level: Level }) {
  const best = useStore((s) => s.quiz[level.n])
  const [seed, setSeed] = useState(() => Date.now() % 10000)
  const [ans, setAns] = useState<Record<string, string | number>>({})
  const [checked, setChecked] = useState(false)

  // urutan opsi pilihan ganda diacak tiap percobaan supaya tidak hafal posisi
  const order = useMemo(() => Object.fromEntries(level.quiz.map((q, i) => [q.id, q.type === 'mcq' ? shuffle(q.options.map((_, k) => k), seed + i) : []])), [level, seed])
  const score = level.quiz.filter((q) => checkQuiz(q, ans[q.id])).length
  const pct = Math.round((score / level.quiz.length) * 100)
  const answered = level.quiz.filter((q) => ans[q.id] !== undefined && ans[q.id] !== '').length

  function submit() {
    setChecked(true)
    update((s) => {
      let next = s
      for (const q of level.quiz) {
        const ok = checkQuiz(q, ans[q.id])
        next = ok ? markRight(next, `quiz:${q.id}`) : markWrong(next, { id: `quiz:${q.id}`, level: level.n, label: q.q.slice(0, 80) })
      }
      const prev = next.quiz[level.n]
      return {
        ...next,
        quiz: { ...next.quiz, [level.n]: { best: Math.max(prev?.best ?? 0, pct), last: pct, attempts: (prev?.attempts ?? 0) + 1 } },
        history: [...next.history, { at: Date.now(), kind: 'kuis' as const, level: level.n, score, total: level.quiz.length }].slice(-200),
      }
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span>
          {level.quiz.length} soal. Lulus kalau skor minimal <b>{PASS}%</b>, dan level berikutnya terbuka.
        </span>
        {best && <Chip tone={best.best >= PASS ? 'ok' : 'plain'}>Skor terbaik {best.best}%</Chip>}
      </div>

      {checked && (
        <div className="mb-5">
          <Callout tone={pct >= PASS ? 'ok' : 'bad'} title={`Skor ${score}/${level.quiz.length} (${pct}%)`}>
            {pct >= PASS ? 'Lulus. Level berikutnya sudah terbuka.' : `Belum ${PASS}%. Baca pembahasan di tiap soal, lalu coba lagi. Soal yang salah masuk daftar Ulang.`}
          </Callout>
        </div>
      )}

      <ol className="space-y-4">
        {level.quiz.map((q, i) => {
          const ok = checkQuiz(q, ans[q.id])
          return (
            <li key={q.id} className={cx('rounded-lg border bg-surface p-4', checked ? (ok ? 'border-ok' : 'border-bad') : 'border-line')}>
              <div className="mb-2 flex items-center gap-2">
                <span className="mono text-xs text-muted">{i + 1}.</span>
                <Chip>{KIND[q.kind]}</Chip>
                {checked && <Chip tone={ok ? 'ok' : 'bad'}>{ok ? 'Benar' : 'Salah'}</Chip>}
              </div>
              <p className="mb-2 text-[15px]">
                <Markup text={q.q} />
              </p>
              {q.table && (
                <div className="mb-2 max-w-md">
                  <MiniSheet t={q.table} />
                </div>
              )}
              {q.formula && <Formula f={q.formula} className="mb-3" />}
              {q.type === 'mcq' ? (
                <div className="grid gap-1.5">
                  {order[q.id].map((k) => {
                    const picked = ans[q.id] === k
                    return (
                      <label
                        key={k}
                        className={cx(
                          'flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 text-sm',
                          picked ? 'border-accent bg-accent/5' : 'border-line hover:bg-sunken',
                          checked && k === q.answer && 'border-ok bg-ok-soft',
                          checked && picked && k !== q.answer && 'border-bad bg-bad-soft',
                        )}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={picked}
                          disabled={checked}
                          onChange={() => setAns((a) => ({ ...a, [q.id]: k }))}
                          className="mt-1 accent-[var(--accent)]"
                        />
                        <span>
                          <Markup text={q.options[k]} />
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <input
                  value={(ans[q.id] as string) ?? ''}
                  disabled={checked}
                  onChange={(e) => setAns((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder={q.placeholder ?? 'Jawabanmu'}
                  className="mono w-full max-w-sm rounded-md border border-line bg-bg px-3 py-1.5 text-sm"
                />
              )}
              {checked && (
                <div className="mt-3 rounded-md bg-sunken px-3 py-2 text-sm">
                  {q.type === 'isian' && !ok && (
                    <div className="mb-1">
                      Jawaban: <span className="mono font-semibold">{q.accept[0]}</span>
                    </div>
                  )}
                  <Markup text={q.why} />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!checked ? (
          <>
            <Button variant="primary" onClick={submit}>
              Periksa jawaban
            </Button>
            <span className="text-sm text-muted">
              {answered}/{level.quiz.length} terjawab
            </span>
          </>
        ) : (
          <Button
            onClick={() => {
              setAns({})
              setChecked(false)
              setSeed((s) => s + 7)
              window.scrollTo({ top: 0 })
            }}
          >
            Coba lagi
          </Button>
        )}
      </div>
    </div>
  )
}
