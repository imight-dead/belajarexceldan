import { LEVELS } from '../content/levels'
import { WORD_TARGETS } from '../content/wordTargets'
import { BRIEFS } from '../content/level6'
import { href } from '../lib/router'
import { PASS, useStore } from '../lib/store'
import { topicStats } from '../lib/report'
import { Callout, Card, Progress, cx } from '../components/ui'

/** Rapor: ringkasan per level dan per bab, supaya tahu harus mengulang yang mana. */
export function Rapor() {
  const s = useStore((x) => x)
  const stats = topicStats(s)
  const weak = stats.filter((t) => t.pct < 70)

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Rapor belajar</h1>
      <p className="mt-2 mb-8 text-[16px] text-muted">Dihitung dari workbook, kuis, latihan Word, dan latihan desain yang sudah kamu kerjakan.</p>

      <h2 className="mb-3 text-lg font-bold">Bab yang perlu diulang</h2>
      {!stats.length ? (
        <Callout tone="mark">Belum ada data. Kerjakan dan unggah workbook salah satu level dulu.</Callout>
      ) : !weak.length ? (
        <Callout tone="ok">Semua bab yang sudah dikerjakan akurasinya di atas 70%. Mantap.</Callout>
      ) : (
        <div className="space-y-2">
          {weak.map((t) => (
            <Card key={t.level + t.topic} className="p-4">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-sm text-muted">Level {t.level}</span>
                <span className="flex-1 font-semibold">{t.topic}</span>
                <span className="mono text-sm">
                  {t.right}/{t.total} benar
                </span>
              </div>
              <Progress value={t.pct} className="mb-2" />
              <div className="flex flex-wrap gap-1.5 text-xs">
                {t.todo.map((id) => (
                  <a key={id} href={href('level', t.level, 'latihan', id)} className="mono rounded bg-sunken px-2 py-0.5 font-semibold hover:bg-accent hover:text-accent-ink">
                    {id}
                  </a>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-3 text-lg font-bold">Per level</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-sunken text-left">
            <tr>
              <th className="px-4 py-2 font-semibold">Level</th>
              <th className="px-4 py-2 font-semibold">Materi</th>
              <th className="px-4 py-2 font-semibold">Latihan</th>
              <th className="px-4 py-2 font-semibold">Kuis</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => {
              const read = l.concepts.filter((c) => s.read[`${l.n}:${c.id}`]).length
              const right = l.questions.filter((q) => s.excel[q.id]?.status === 'benar').length
              const prac =
                l.practice === 'word'
                  ? `${WORD_TARGETS.filter((t) => s.word[t.id] === 100).length}/${WORD_TARGETS.length} target 100%`
                  : l.practice === 'design'
                    ? `${BRIEFS.filter((b) => s.design[b.id] !== undefined).length}/${BRIEFS.length} brief`
                    : `${right}/${l.questions.length} benar`
              const q = s.quiz[l.n]?.best
              return (
                <tr key={l.n} className="border-t border-line">
                  <td className="px-4 py-2">
                    <a href={href('level', l.n)} className="font-semibold hover:underline">
                      {l.n}. {l.title}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {read}/{l.concepts.length}
                  </td>
                  <td className="px-4 py-2 text-muted">{prac}</td>
                  <td className={cx('px-4 py-2 font-semibold', q === undefined ? 'text-muted' : q >= PASS ? 'text-ok' : 'text-bad')}>{q === undefined ? 'belum' : `${q}%`}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {stats.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-bold">Semua bab Excel</h2>
          <Card>
            <ul className="divide-y divide-line text-sm">
              {stats.map((t) => (
                <li key={t.level + t.topic} className="flex items-center gap-3 px-4 py-2">
                  <span className="w-14 text-muted">L{t.level}</span>
                  <span className="flex-1">{t.topic}</span>
                  <span className={cx('mono font-semibold', t.pct >= 70 ? 'text-ok' : 'text-bad')}>{t.pct}%</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
