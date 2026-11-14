import { useEffect, useState } from 'react'
import { LEVELS } from '../content/levels'
import { href } from '../lib/router'
import { useStore } from '../lib/store'
import { Callout, Card, Chip, Progress } from '../components/ui'

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
  const next =
    LEVELS.find((l) => l.concepts.some((c) => !s.read[`${l.n}:${c.id}`])) ??
    LEVELS[0]
  const hasReadAny = Object.values(s.read).some(Boolean)

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
              {hasReadAny ? 'Lanjutkan' : 'Mulai'}: Level {next.n} {next.title}
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
        <h2 className="mb-3 text-lg font-bold">Peta level materi</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVELS.map((l) => {
            const done = l.concepts.filter((c) => s.read[`${l.n}:${c.id}`]).length
            const total = l.concepts.length
            const pct = total ? (done / total) * 100 : 0
            return (
              <a key={l.n} href={href('level', l.n)} className="group block">
                <Card className="h-full p-4 transition-colors group-hover:border-muted">
                  <div className="flex items-start gap-3">
                    <span className="mono flex size-9 shrink-0 items-center justify-center rounded-md bg-sunken text-sm font-bold">L{l.n}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{l.title}</span>
                      </div>
                      <div className="text-sm text-muted">{l.short}</div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                        <Chip>{l.day}</Chip>
                        <Chip tone={done === total && total > 0 ? 'ok' : 'plain'}>
                          Materi {done}/{total}
                        </Chip>
                      </div>
                      {total > 0 && <Progress value={pct} className="mt-2.5" />}
                    </div>
                  </div>
                </Card>
              </a>
            )
          })}
        </div>
      </section>
    </div>
  )
}
