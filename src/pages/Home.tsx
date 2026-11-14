import { useEffect, useState } from 'react'
import { LEVELS } from '../content/levels'
import { href } from '../lib/router'
import { weakTopics } from '../lib/report'
import { PASS, isUnlocked, useStore } from '../lib/store'
import { Callout, Card, Chip, Icon, Progress, cx } from '../components/ui'

export const TEST_DATE = new Date(2026, 10, 14, 7, 0, 0)

export function Countdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])
  const ms = TEST_DATE.getTime() - now
  if (ms <= 0) return <div className="text-3xl font-extrabold">Hari ini tesnya. Semangat!</div>
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return (
    <div className="flex items-end gap-5">
      {[
        [d, 'hari'],
        [h, 'jam'],
        [m, 'menit'],
      ].map(([v, l]) => (
        <div key={l}>
          <div className="mono text-5xl leading-none font-bold tabular-nums">{String(v).padStart(2, '0')}</div>
          <div className="mt-1 text-xs font-semibold tracking-wider text-muted uppercase">{l}</div>
        </div>
      ))}
    </div>
  )
}

export function Home() {
  const s = useStore((x) => x)
  const next = LEVELS.find((l) => isUnlocked(s, l.n) && (s.quiz[l.n]?.best ?? 0) < PASS) ?? LEVELS[0]
  const recent = [...s.history].reverse().slice(0, 8)
  const weak = weakTopics(s)

  return (
    <div className="space-y-8">
      <section className="grid-paper -mx-4 border-y border-line px-4 py-8 sm:mx-0 sm:rounded-xl sm:border sm:px-8">
        <div className="max-w-xl rounded-lg bg-bg/85 p-1 backdrop-blur-[1px]">
          <p className="text-sm font-semibold text-muted">Tes MS Office &amp; Design · Sabtu, 14 November 2026</p>
          <h1 className="mt-1 mb-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Lima hari, dari nol sampai <span className="bg-mark px-1 text-[#18202a]">siap tes</span>.
          </h1>
          <Countdown />
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={href('level', next.n)} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:opacity-90">
              {s.history.length ? 'Lanjutkan' : 'Mulai'}: Level {next.n} {next.title}
            </a>
            <a href={href('rencana')} className="inline-flex items-center rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold hover:bg-sunken">
              Lihat rencana
            </a>
          </div>
        </div>
      </section>

      <Callout title="Wajib Excel 365, Excel 2024, atau Excel for the web">
        Fungsi dynamic array (FILTER, SORT, UNIQUE, VSTACK, CHOOSECOLS, TAKE, dan lainnya) serta LAMBDA, MAP, BYROW, REDUCE, SCAN hanya ada di versi
        itu. Excel 2016/2019 akan menampilkan #NAME?. Belum punya? Pakai Excel for the web gratis lewat akun Microsoft kampus di office.com.
      </Callout>

      <section>
        <h2 className="mb-3 text-lg font-bold">Peta level</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVELS.map((l) => {
            const open = isUnlocked(s, l.n)
            const best = s.quiz[l.n]?.best
            const done = l.questions.filter((q) => s.excel[q.id]?.status === 'benar').length
            const pct = l.questions.length ? (done / l.questions.length) * 100 : 0
            return (
              <a key={l.n} href={href('level', l.n)} className={cx('group block', !open && 'opacity-60')}>
                <Card className="h-full p-4 transition-colors group-hover:border-muted">
                  <div className="flex items-start gap-3">
                    <span className="mono flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-sm font-bold">L{l.n}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{l.title}</span>
                        {!open && <Icon name="lock" className="size-3.5 text-muted" />}
                      </div>
                      <div className="text-sm text-muted">{l.short}</div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <Chip>{l.day}</Chip>
                        <Chip tone={best !== undefined && best >= PASS ? 'ok' : 'plain'}>Kuis {best !== undefined ? `${best}%` : 'belum'}</Chip>
                        {l.questions.length > 0 && (
                          <Chip>
                            Excel {done}/{l.questions.length}
                          </Chip>
                        )}
                      </div>
                      {l.questions.length > 0 && <Progress value={pct} className="mt-2.5" />}
                    </div>
                  </div>
                </Card>
              </a>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          Level terbuka berurutan setelah kuis level sebelumnya minimal {PASS}%. Untuk review bebas, aktifkan <b>Buka semua level</b> di menu.
        </p>
      </section>

      {weak.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Bab yang masih lemah</h2>
          <Card>
            <ul className="divide-y divide-line text-sm">
              {weak.slice(0, 5).map((t) => (
                <li key={t.level + t.topic} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-muted">L{t.level}</span>
                  <span className="flex-1 font-semibold">{t.topic}</span>
                  <span className="mono text-bad">{t.pct}%</span>
                  <a href={href('level', t.level, 'latihan', t.todo[0])} className="text-xs font-semibold text-accent hover:underline">
                    ulang
                  </a>
                </li>
              ))}
            </ul>
          </Card>
          <a href={href('rapor')} className="mt-2 inline-block text-sm font-semibold text-accent hover:underline">
            Lihat rapor lengkap
          </a>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">Riwayat skor</h2>
        {recent.length ? (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted uppercase">
                <tr>
                  <th className="px-4 py-2 font-semibold">Waktu</th>
                  <th className="px-4 py-2 font-semibold">Level</th>
                  <th className="px-4 py-2 font-semibold">Jenis</th>
                  <th className="px-4 py-2 text-right font-semibold">Skor</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((h, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-4 py-2 whitespace-nowrap text-muted">
                      {new Date(h.at).toLocaleString('id-ID', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2">L{h.level}</td>
                    <td className="px-4 py-2">{h.kind === 'kuis' ? 'Kuis' : h.level === 5 ? 'Pemeriksa Word' : h.kind === 'excel' ? 'Workbook' : 'Tempel manual'}</td>
                    <td className="mono px-4 py-2 text-right">
                      {h.score}/{h.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <p className="text-sm text-muted">Belum ada. Skor kuis dan hasil unggahan workbook akan muncul di sini.</p>
        )}
      </section>
    </div>
  )
}
