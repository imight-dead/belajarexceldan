import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVELS } from '../content/levels'
import { BRIEFS } from '../content/level6'
import { WORD_TARGETS } from '../content/wordTargets'
import type { ExcelQuestion, Level, QuizQ } from '../content/types'
import { TIER_LABEL } from '../content/types'
import { gradeBook, STATUS_LABEL, type Result } from '../lib/grader'
import { readDocx } from '../lib/docxCheck'
import { downloadMessyDocx } from '../lib/docxMessy'
import { readXlsx } from '../lib/xlsxRead'
import { href } from '../lib/router'
import { update, useStore } from '../lib/store'
import { checkQuiz } from '../components/Quiz'
import { Formula } from '../components/Formula'
import { Markup } from '../components/Markup'
import { MiniSheet } from '../components/MiniSheet'
import { Button, Callout, Card, Chip, Icon, cx } from '../components/ui'

// Simulasi tes: satu sesi berwaktu dengan empat bagian. Soal dipilih acak dari semua level
// dengan seed, jadi sesi yang sama selalu memakai soal yang sama walaupun halaman dimuat ulang.

const KEY = 'iflab-prep:sim'
const MINUTES = 120
const WEIGHT = { excel: 40, kuis: 20, word: 20, desain: 20 }

interface Session {
  seed: number
  start: number
  /** hasil tiap bagian dalam persen, diisi saat bagian itu dikumpulkan */
  parts: Partial<Record<keyof typeof WEIGHT, number>>
  excel?: Record<string, Result['status']>
  quiz?: Record<string, string | number>
  finished?: boolean
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function pick<T>(arr: T[], n: number, r: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

/** Komposisi soal Excel: makin tinggi levelnya makin banyak, sesuai bobot kisi-kisi. */
const PLAN: [number, ExcelQuestion['tier'][], number][] = [
  [0, ['sedang', 'sulit'], 1],
  [1, ['sedang', 'sulit'], 2],
  [2, ['sedang', 'sulit'], 2],
  [3, ['sedang', 'sulit'], 3],
  [4, ['mudah', 'sedang', 'sulit'], 4],
]

function build(seed: number) {
  const r = rng(seed)
  const questions = PLAN.flatMap(([n, tiers, k]) => pick(LEVELS[n].questions.filter((q) => tiers.includes(q.tier)), k, r))
  const quiz = pick(LEVELS.flatMap((l) => l.quiz.filter((q) => q.type === 'mcq' || q.mode !== 'formula')), 15, r)
  const word = WORD_TARGETS[Math.floor(r() * 3)] // tiga target pertama muat dalam waktu simulasi
  const brief = BRIEFS[Math.floor(r() * BRIEFS.length)]
  const level: Level = { n: 9, slug: 'simulasi', title: 'Simulasi Tes', short: '', goal: '', day: '', concepts: [], questions, quiz: [] }
  return { level, quiz, word, brief }
}

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function save(s: Session | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    /* abaikan */
  }
}

export function Simulasi() {
  const [ses, setSes] = useState<Session | null>(load)
  const history = useStore((s) => s.sim)
  const set = (s: Session | null) => (save(s), setSes(s))

  if (!ses)
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight">Simulasi tes</h1>
        <p className="mt-2 mb-6 text-[16px] leading-relaxed text-muted">Latihan sekali jalan dengan waktu {MINUTES} menit, seperti hari tes. Soal diambil acak dari semua level. Kerjakan tanpa membuka kunci jawaban.</p>
        <Card className="mb-6 p-5">
          <h2 className="mb-3 font-bold">Isinya</h2>
          <ul className="space-y-2 text-[15px]">
            <li>
              <b>Excel (bobot {WEIGHT.excel}%)</b>: 12 soal dari Level 0 sampai 4 dalam satu workbook.
            </li>
            <li>
              <b>Kuis teori ({WEIGHT.kuis}%)</b>: 15 soal pilihan ganda dan isian.
            </li>
            <li>
              <b>Word ({WEIGHT.word}%)</b>: rapikan satu dokumen template berantakan (.docx) sesuai panduan dan PDF contoh hasil.
            </li>
            <li>
              <b>Desain ({WEIGHT.desain}%)</b>: satu brief, dinilai dengan ceklis.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted">Waktu tetap berjalan walaupun halaman ditutup. Bagian boleh dikerjakan dalam urutan apa pun.</p>
        </Card>
        <Button variant="primary" onClick={() => set({ seed: Date.now() % 1e9, start: Date.now(), parts: {} })}>
          Mulai simulasi
        </Button>
        {history.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-2 text-sm font-bold tracking-wider text-muted uppercase">Simulasi sebelumnya</h2>
            <Card>
              <ul className="divide-y divide-line text-sm">
                {[...history].reverse().map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 px-4 py-2">
                    <span className="text-muted">{new Date(h.at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span className="mono ml-auto font-semibold">{h.score}</span>
                    <span className="flex gap-1">
                      {Object.entries(h.parts).map(([k, [a]]) => (
                        <Chip key={k}>
                          {k} {a}%
                        </Chip>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}
      </div>
    )
  return <Running ses={ses} set={set} />
}

function Running({ ses, set }: { ses: Session; set: (s: Session | null) => void }) {
  const { level, quiz, word, brief } = useMemo(() => build(ses.seed), [ses.seed])
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, ses.start + MINUTES * 60000 - now)
  const timeUp = left === 0
  const done = Object.keys(ses.parts).length
  const total = (Object.keys(WEIGHT) as (keyof typeof WEIGHT)[]).reduce((a, k) => a + ((ses.parts[k] ?? 0) * WEIGHT[k]) / 100, 0)
  const patch = (p: Partial<Session>) => set({ ...ses, ...p, parts: { ...ses.parts, ...p.parts } })

  function finish() {
    update((s) => ({
      ...s,
      sim: [
        ...s.sim,
        {
          at: Date.now(),
          score: Math.round(total),
          total: 100,
          parts: Object.fromEntries(Object.entries(ses.parts).map(([k, v]) => [k, [v ?? 0, 100] as [number, number]])),
        },
      ].slice(-30),
    }))
    patch({ finished: true })
  }

  return (
    <div className="max-w-3xl">
      <div className="no-print sticky top-[53px] z-10 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur lg:top-0 lg:mx-0 lg:px-0">
        <span className={cx('mono rounded-md px-2.5 py-1 text-lg font-bold tabular-nums', timeUp ? 'bg-bad-soft text-bad' : left < 15 * 60000 ? 'bg-warn-soft text-warn' : 'bg-sunken')}>
          {String(Math.floor(left / 3600000))}:{String(Math.floor(left / 60000) % 60).padStart(2, '0')}:{String(Math.floor(left / 1000) % 60).padStart(2, '0')}
        </span>
        <span className="text-sm text-muted">{done}/4 bagian dikumpulkan</span>
        <span className="mono ml-auto font-bold">{Math.round(total)} / 100</span>
      </div>
      {timeUp && !ses.finished && <Callout tone="bad" title="Waktu habis">Kumpulkan bagian yang sudah ada, lalu tekan Selesai.</Callout>}

      {ses.finished ? (
        <Card className="mb-6 p-5">
          <h2 className="text-xl font-bold">Hasil simulasi: {Math.round(total)} / 100</h2>
          <ul className="mt-3 space-y-1 text-[15px]">
            {(Object.keys(WEIGHT) as (keyof typeof WEIGHT)[]).map((k) => (
              <li key={k}>
                <b className="capitalize">{k}</b>: {ses.parts[k] ?? 0}% (bobot {WEIGHT[k]}%)
              </li>
            ))}
          </ul>
          <ExcelWeak ses={ses} level={level} />
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => set(null)}>
              Tutup sesi
            </Button>
            <a href={href('rapor')} className="rounded-md border border-line bg-surface px-3.5 py-2 text-sm font-semibold">
              Lihat rapor bab
            </a>
          </div>
        </Card>
      ) : null}

      <Part title="1. Excel" weight={WEIGHT.excel} score={ses.parts.excel}>
        <ExcelPart level={level} disabled={!!ses.finished} onGraded={(pct, map) => patch({ parts: { excel: pct }, excel: map })} saved={ses.excel} />
      </Part>
      <Part title="2. Kuis teori" weight={WEIGHT.kuis} score={ses.parts.kuis}>
        <QuizPart quiz={quiz} saved={ses.quiz} disabled={ses.parts.kuis !== undefined || !!ses.finished} onSubmit={(pct, ans) => patch({ parts: { kuis: pct }, quiz: ans })} />
      </Part>
      <Part title={`3. Word: ${word.title}`} weight={WEIGHT.word} score={ses.parts.word}>
        <p className="mb-3 text-[15px]">{word.about}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant="mark" onClick={() => downloadMessyDocx(word.id, word.title)}>
            <Icon name="download" /> Unduh Template Berantakan (.docx)
          </Button>
          <a href={word.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 text-sm font-semibold">
            <Icon name="download" /> Buka PDF Contoh Hasil
          </a>
        </div>
        <div className="mb-4 rounded-md border border-line bg-sunken/60 p-3 text-sm">
          <div className="mb-1.5 font-bold">Panduan Ketentuan Format:</div>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            {word.guide.map((g) => (
              <li key={g.section}>
                <b className="text-ink">{g.section}:</b> <Markup text={g.spec} />
              </li>
            ))}
          </ul>
        </div>
        <FilePick
          accept=".docx"
          label="Unggah .docx hasil perbaikan"
          disabled={!!ses.finished}
          onFile={async (f) => {
            const fx = await readDocx(new Uint8Array(await f.arrayBuffer()))
            patch({ parts: { word: Math.round((word.rubric.filter((r) => r.test(fx)).length / word.rubric.length) * 100) } })
          }}
        />
      </Part>
      <Part title={`4. Desain: ${brief.title}`} weight={WEIGHT.desain} score={ses.parts.desain}>
        <p className="text-[15px]">
          <b>Kanvas:</b> {brief.canvas}
        </p>
        <ul className="mt-2 mb-2 list-disc pl-5 text-[15px]">
          {brief.must.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="mb-4 text-[15px]">
          <b>Batasan:</b> {brief.constraint}
        </p>
        <Checklist items={brief.rubric} disabled={ses.parts.desain !== undefined || !!ses.finished} onSubmit={(pct) => patch({ parts: { desain: pct } })} />
      </Part>

      {!ses.finished && (
        <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
          <Button variant="primary" onClick={finish}>
            Selesai dan simpan hasil
          </Button>
          <Button variant="quiet" onClick={() => set(null)}>
            Batalkan sesi
          </Button>
        </div>
      )}
    </div>
  )
}

function Part({ title, weight, score, children }: { title: string; weight: number; score?: number; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-lg border border-line bg-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="text-sm text-muted">bobot {weight}%</span>
        {score !== undefined && (
          <Chip tone={score >= 80 ? 'ok' : score >= 50 ? 'mark' : 'bad'} className="ml-auto">
            {score}%
          </Chip>
        )}
      </div>
      {children}
    </section>
  )
}

function FilePick({ accept, label, onFile, disabled }: { accept: string; label: string; onFile: (f: File) => Promise<void>; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div>
      <Button onClick={() => ref.current?.click()} disabled={disabled || busy}>
        <Icon name="upload" /> {busy ? 'Membaca...' : label}
      </Button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setErr('')
          setBusy(true)
          try {
            await onFile(f)
          } catch (x) {
            setErr((x as Error).message)
          } finally {
            setBusy(false)
          }
        }}
      />
      {err && (
        <div className="mt-2">
          <Callout tone="bad">{err}</Callout>
        </div>
      )}
    </div>
  )
}

function ExcelPart({ level, onGraded, saved, disabled }: { level: Level; onGraded: (pct: number, map: Record<string, Result['status']>) => void; saved?: Record<string, Result['status']>; disabled: boolean }) {
  const [warn, setWarn] = useState<string[]>([])
  async function download() {
    const { buildWorkbook } = await import('../lib/xlsxWrite')
    const buf = await buildWorkbook(level)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    a.download = 'IFLAB-Simulasi.xlsx'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }
  return (
    <div>
      <p className="mb-3 text-[15px]">Unduh workbook, kerjakan 12 soal di Excel, simpan, lalu unggah. Boleh diunggah berkali-kali, yang dipakai unggahan terakhir.</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="mark" onClick={download}>
          <Icon name="download" /> Unduh workbook simulasi
        </Button>
        <FilePick
          accept=".xlsx"
          label="Unggah .xlsx"
          disabled={disabled}
          onFile={async (f) => {
            const rep = gradeBook(level, await readXlsx(await f.arrayBuffer()))
            setWarn(rep.warnings)
            const pct = Math.round((rep.results.filter((r) => r.status === 'benar').length / level.questions.length) * 100)
            onGraded(pct, Object.fromEntries(rep.results.map((r) => [r.id, r.status])))
          }}
        />
      </div>
      {warn.map((w, i) => (
        <div key={i} className="mb-2">
          <Callout tone="warn">{w}</Callout>
        </div>
      ))}
      <ol className="space-y-1 text-sm">
        {level.questions.map((q, i) => (
          <li key={q.id} className="flex gap-2">
            <span className="mono w-6 text-right text-muted">{i + 1}</span>
            <span className="flex-1">
              {q.title} <span className="text-muted">· {TIER_LABEL[q.tier]}</span>
            </span>
            {saved?.[q.id] && <Chip tone={saved[q.id] === 'benar' ? 'ok' : saved[q.id] === 'kosong' ? 'plain' : 'bad'}>{STATUS_LABEL[saved[q.id]]}</Chip>}
          </li>
        ))}
      </ol>
    </div>
  )
}

function ExcelWeak({ ses, level }: { ses: Session; level: Level }) {
  if (!ses.excel) return null
  const wrong = level.questions.filter((q) => ses.excel![q.id] !== 'benar')
  if (!wrong.length) return <p className="mt-3 text-sm text-ok">Semua soal Excel benar.</p>
  const topics = [...new Set(wrong.map((q) => q.topic))]
  return (
    <div className="mt-4 text-[15px]">
      <b>Bab Excel yang perlu diulang:</b> {topics.join(', ')}.
      <ul className="mt-2 space-y-1 text-sm">
        {wrong.map((q) => {
          const lv = LEVELS.find((l) => l.questions.includes(q))!
          return (
            <li key={q.id}>
              <a href={href('level', lv.n, 'latihan', q.id)} className="text-accent hover:underline">
                {q.id} {q.title}
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function QuizPart({ quiz, saved, disabled, onSubmit }: { quiz: QuizQ[]; saved?: Record<string, string | number>; disabled: boolean; onSubmit: (pct: number, ans: Record<string, string | number>) => void }) {
  const [ans, setAns] = useState<Record<string, string | number>>(saved ?? {})
  const shown = disabled && saved
  return (
    <div className="space-y-4">
      {quiz.map((q, i) => {
        const ok = shown ? checkQuiz(q, ans[q.id]) : null
        return (
          <div key={q.id} className={cx('rounded-md border p-3', ok === true ? 'border-ok' : ok === false ? 'border-bad' : 'border-line')}>
            <p className="mb-2 text-[15px]">
              <span className="mono mr-2 text-muted">{i + 1}.</span>
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
                  <label key={k} className={cx('flex items-start gap-2 rounded-md border px-3 py-1.5 text-sm', ans[q.id] === k ? 'border-accent' : 'border-line', shown && k === q.answer && 'bg-ok-soft')}>
                    <input type="radio" name={'sim-' + q.id} checked={ans[q.id] === k} disabled={disabled} onChange={() => setAns({ ...ans, [q.id]: k })} className="mt-1 accent-[var(--accent)]" />
                    <Markup text={o} />
                  </label>
                ))}
              </div>
            ) : (
              <input value={ans[q.id] ?? ''} disabled={disabled} onChange={(e) => setAns({ ...ans, [q.id]: e.target.value })} className="mono w-full max-w-sm rounded-md border border-line bg-bg px-3 py-1.5 text-sm" />
            )}
            {shown && (
              <p className="mt-2 text-sm text-muted">
                <Markup text={q.why} />
              </p>
            )}
          </div>
        )
      })}
      {!disabled && (
        <Button variant="primary" onClick={() => onSubmit(Math.round((quiz.filter((q) => checkQuiz(q, ans[q.id])).length / quiz.length) * 100), ans)}>
          Kumpulkan kuis
        </Button>
      )}
    </div>
  )
}

function Checklist({ items, disabled, onSubmit }: { items: string[]; disabled: boolean; onSubmit: (pct: number) => void }) {
  const [c, setC] = useState<Record<number, boolean>>({})
  return (
    <div>
      <p className="mb-2 text-sm text-muted">Kerjakan di Canva, Figma, atau alat lain. Setelah selesai, centang yang benar-benar terpenuhi.</p>
      <ul className="mb-3 space-y-1.5">
        {items.map((r, i) => (
          <li key={r}>
            <label className="flex items-start gap-2 text-[15px]">
              <input type="checkbox" checked={!!c[i]} disabled={disabled} onChange={(e) => setC({ ...c, [i]: e.target.checked })} className="mt-1 size-4 accent-[var(--accent)]" />
              {r}
            </label>
          </li>
        ))}
      </ul>
      {!disabled && (
        <Button variant="primary" onClick={() => onSubmit(Math.round((Object.values(c).filter(Boolean).length / items.length) * 100))}>
          Kumpulkan penilaian desain
        </Button>
      )}
    </div>
  )
}
