import { useEffect, useRef, useState } from 'react'
import type { ExcelQuestion, Level, Tier } from '../content/types'
import { TIER_LABEL } from '../content/types'
import { STATUS_LABEL, gradeBook, gradeManual, type BookReport, type Result, type Status } from '../lib/grader'
import { readXlsx } from '../lib/xlsxRead'
import { ANSWER_COL, FIRST_Q_ROW, SOAL_SHEET, fnLabel } from '../lib/layout'
import { markRight, markWrong, update, useStore } from '../lib/store'
import { Formula } from './Formula'
import { Markup } from './Markup'
import { fmt } from './MiniSheet'
import { Button, Callout, Card, Chip, Icon, cx } from './ui'

const TONE: Record<Status, 'ok' | 'bad' | 'warn' | 'plain'> = {
  benar: 'ok',
  salah: 'bad',
  kosong: 'plain',
  tanpaCache: 'warn',
  manual: 'warn',
  fungsi: 'warn',
  struktur: 'warn',
}

function recordResults(level: Level, results: Result[], kind: 'excel' | 'manual') {
  update((s) => {
    let next = { ...s, excel: { ...s.excel } }
    for (const r of results) {
      if (r.status === 'kosong' || r.status === 'tanpaCache') continue
      next.excel[r.id] = { status: r.status, at: Date.now() }
      const q = level.questions.find((x) => x.id === r.id)!
      next = r.status === 'benar' ? markRight(next, `excel:${r.id}`) : markWrong(next, { id: `excel:${r.id}`, level: level.n, label: `${r.id} ${q.title}` })
    }
    const counted = results.filter((r) => r.status !== 'kosong' && r.status !== 'tanpaCache')
    if (counted.length)
      next.history = [
        ...next.history,
        { at: Date.now(), kind, level: level.n, score: counted.filter((r) => r.status === 'benar').length, total: level.questions.length },
      ].slice(-200)
    return next
  })
}

export function ExcelPractice({ level, focus }: { level: Level; focus?: string }) {
  const [report, setReport] = useState<BookReport | null>(null)
  const [results, setResults] = useState<Record<string, Result>>({})
  const [busy, setBusy] = useState<'' | 'unduh' | 'baca'>('')
  const [error, setError] = useState('')
  const [manual, setManual] = useState(false)
  const [onlyWrong, setOnlyWrong] = useState(false)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const saved = useStore((s) => s.excel)

  useEffect(() => {
    if (!focus) return
    const el = document.getElementById('q-' + focus)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focus])

  async function download() {
    setBusy('unduh')
    try {
      const { buildWorkbook } = await import('../lib/xlsxWrite')
      const buf = await buildWorkbook(level)
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `IFLAB-Level${level.n}-${level.title.replace(/[^A-Za-z]+/g, '')}.xlsx`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    } catch (e) {
      setError('Gagal membuat workbook: ' + (e as Error).message)
    } finally {
      setBusy('')
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return
    setError('')
    setBusy('baca')
    try {
      const book = await readXlsx(await f.arrayBuffer())
      const rep = gradeBook(level, book)
      setReport(rep)
      setResults(Object.fromEntries(rep.results.map((r) => [r.id, r])))
      recordResults(level, rep.results, 'excel')
    } catch (e) {
      setError(/zip|central directory|end of data/i.test((e as Error).message) ? 'File tidak bisa dibaca. Pastikan formatnya .xlsx (bukan .xls, .csv, atau .numbers).' : (e as Error).message)
    } finally {
      setBusy('')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function checkManual(q: ExcelQuestion, v: string) {
    const r = gradeManual(q, v)
    setResults((x) => ({ ...x, [q.id]: r }))
    recordResults(level, [r], 'manual')
  }

  const list = Object.values(results)
  const benar = list.filter((r) => r.status === 'benar').length
  const tiers: Tier[] = ['mudah', 'sedang', 'sulit']

  return (
    <div>
      <Card className="p-5">
        <ol className="grid gap-5 md:grid-cols-3">
          <li>
            <StepNo n={1} />
            <div className="font-semibold">Unduh workbook</div>
            <p className="mb-3 text-sm text-muted">Berisi sheet Soal (sel jawaban kuning) dan semua sheet data. Tanpa kunci.</p>
            <Button variant="mark" onClick={download} disabled={busy === 'unduh'}>
              <Icon name="download" /> {busy === 'unduh' ? 'Menyiapkan...' : `Level ${level.n} (.xlsx)`}
            </Button>
          </li>
          <li>
            <StepNo n={2} />
            <div className="font-semibold">Kerjakan di Excel 365</div>
            <p className="text-sm text-muted">
              Tulis rumus di kolom <span className="mono">{ANSWER_COL}</span> sheet {SOAL_SHEET}, lalu <b>Ctrl+S</b>. Excel for the web juga bisa: unggah ke OneDrive, kerjakan, lalu File &gt; Save As &gt; Download a Copy.
            </p>
          </li>
          <li>
            <StepNo n={3} />
            <div className="font-semibold">Unggah untuk dinilai</div>
            <label
              onDragOver={(e) => (e.preventDefault(), setDrag(true))}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDrag(false)
                onFile(e.dataTransfer.files[0])
              }}
              className={cx(
                'mt-2 flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed px-3 py-4 text-center text-sm',
                drag ? 'border-accent bg-accent/5' : 'border-line hover:border-muted',
              )}
            >
              <Icon name="upload" className="size-5 text-muted" />
              <span>{busy === 'baca' ? 'Membaca...' : 'Pilih atau seret file .xlsx'}</span>
              <input ref={fileRef} type="file" accept=".xlsx" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} className="accent-[var(--accent)]" />
            Mode tempel manual (kalau unggah file tidak memungkinkan)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} className="accent-[var(--accent)]" />
            Hanya tampilkan yang belum benar
          </label>
        </div>
      </Card>

      {error && (
        <div className="mt-4">
          <Callout tone="bad">{error}</Callout>
        </div>
      )}
      {report && (
        <div className="mt-4 space-y-2">
          {report.warnings.map((w, i) => (
            <Callout key={i} tone="warn">
              {w}
            </Callout>
          ))}
          <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
            <div>
              <div className="text-xs font-semibold text-muted uppercase">Skor</div>
              <div className="text-2xl font-bold">
                {benar}
                <span className="text-base text-muted">/{level.questions.length}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => {
                const c = list.filter((r) => r.status === s).length
                return c ? (
                  <Chip key={s} tone={TONE[s]}>
                    {STATUS_LABEL[s]}: {c}
                  </Chip>
                ) : null
              })}
            </div>
          </Card>
        </div>
      )}
      {manual && (
        <div className="mt-4">
          <Callout tone="mark">
            Mode manual hanya membandingkan nilai. Website tidak bisa memastikan kamu memakai fungsi yang diminta, jadi jujur sama diri sendiri ya. Angka boleh ditulis gaya Indonesia (0,5 atau 1.250.000).
          </Callout>
        </div>
      )}

      {tiers.map((t) => {
        const qs = level.questions
          .map((q, i) => ({ q, i }))
          .filter(({ q }) => q.tier === t)
          .filter(({ q }) => !onlyWrong || (results[q.id]?.status ?? saved[q.id]?.status) !== 'benar')
        if (!qs.length) return null
        return (
          <section key={t} className="mt-8">
            <h3 className="mb-3 text-sm font-bold tracking-wider text-muted uppercase">{TIER_LABEL[t]}</h3>
            <div className="space-y-3">
              {qs.map(({ q, i }) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  row={FIRST_Q_ROW + i}
                  result={results[q.id]}
                  lastStatus={saved[q.id]?.status}
                  manual={manual}
                  onManual={(v) => checkManual(q, v)}
                  focused={focus === q.id}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function StepNo({ n }: { n: number }) {
  return <div className="mono mb-1 inline-flex size-6 items-center justify-center rounded bg-ink text-xs font-bold text-bg">{n}</div>
}

function QuestionCard({
  q,
  row,
  result,
  lastStatus,
  manual,
  onManual,
  focused,
}: {
  q: ExcelQuestion
  row: number
  result?: Result
  lastStatus?: Status
  manual: boolean
  onManual: (v: string) => void
  focused: boolean
}) {
  const revealed = useStore((s) => !!s.revealed[q.id])
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const attempted = !!lastStatus || (result && result.status !== 'kosong' && result.status !== 'tanpaCache')
  const canSee = revealed || attempted
  const status = result?.status ?? lastStatus

  return (
    <article id={'q-' + q.id} className={cx('scroll-mt-20 rounded-lg border bg-surface', focused ? 'border-accent' : 'border-line')}>
      <div className="p-4">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="mono text-xs font-semibold text-muted">{q.id}</span>
          <h4 className="font-bold">{q.title}</h4>
          <span className="mono ml-auto rounded bg-mark px-1.5 text-xs font-semibold text-[#18202a]" title="Sel jawaban di workbook">
            {SOAL_SHEET}!{ANSWER_COL}
            {row}
          </span>
          {status && (
            <Chip tone={TONE[status]}>
              {!result && 'terakhir: '}
              {STATUS_LABEL[status]}
            </Chip>
          )}
        </div>
        <p className="text-[15px]">
          <Markup text={q.prompt} />
        </p>
        {fnLabel(q) && <p className="mt-1.5 text-xs text-muted">Fungsi wajib: {fnLabel(q)}</p>}

        {result && result.status !== 'benar' && (
          <div className="mt-3 rounded-md bg-sunken px-3 py-2 text-sm">
            <div>{result.msg}</div>
            {result.got !== undefined && (
              <div className="mt-1 text-muted">
                Nilai kamu: <span className="mono text-ink">{fmt(result.got)}</span>
              </div>
            )}
            {result.formula && <Formula f={result.formula} className="mt-1.5" />}
          </div>
        )}
        {result?.status === 'benar' && result.formula && <Formula f={result.formula} className="mt-3" />}

        {manual && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              onManual(input)
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tempel nilai hasil dari Excel"
              className="mono min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-1.5 text-sm"
            />
            <Button type="submit">Cek</Button>
          </form>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {canSee ? (
            <Button variant="quiet" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? 'Tutup pembahasan' : 'Lihat kunci dan pembahasan'}
            </Button>
          ) : (
            <>
              {q.hint && <span className="text-sm text-muted">Petunjuk: {q.hint}</span>}
              <Button
                variant="quiet"
                onClick={() => {
                  update((s) => ({ ...s, revealed: { ...s.revealed, [q.id]: true } }))
                  setOpen(true)
                }}
              >
                <Icon name="flag" /> Menyerah, tampilkan kunci
              </Button>
            </>
          )}
        </div>
      </div>

      {open && canSee && (
        <div className="border-t border-line bg-bg/60 p-4">
          <div className="mb-2 text-sm">
            Nilai kunci: <span className="mono rounded bg-mark-soft px-1.5 font-semibold">{fmt(q.expected())}</span>
          </div>
          <div className="space-y-2">
            {q.keys.map((k, i) => (
              <div key={i}>
                <div className="mb-0.5 text-xs font-semibold text-muted">Cara {i + 1}</div>
                <Formula f={k.formula} copy />
                {k.note && <p className="mt-1 text-xs text-muted">{k.note}</p>}
              </div>
            ))}
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            {q.steps.map((s, i) => (
              <li key={i}>
                <Markup text={s} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </article>
  )
}
