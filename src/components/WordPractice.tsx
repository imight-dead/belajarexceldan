import { useRef, useState } from 'react'
import { WORD_TARGETS, type WordTarget } from '../content/wordTargets'
import { hygiene, paperName, readDocx, type DocxFacts } from '../lib/docxCheck'
import { downloadMessyDocx } from '../lib/docxMessy'
import { href } from '../lib/router'
import { update, useStore } from '../lib/store'
import { Markup } from './Markup'
import { Timer } from './Timer'
import { Button, Callout, Card, Chip, Icon, cx } from './ui'

export function WordPractice({ focus }: { focus?: string }) {
  const best = useStore((s) => s.word)
  const t = WORD_TARGETS.find((x) => x.id === focus)
  if (t) return <TargetView t={t} best={best[t.id]} />

  return (
    <div className="max-w-3xl">
      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ['Unduh template berantakan', 'Ambil file .docx yang font & formatnya sudah diacak-acak, plus lihat PDF contoh hasil akhirnya.'],
          ['Benerin sesuai panduan', 'Rapikan ukuran font, pasang Style Heading, Multilevel List, Page Break, dan Daftar Isi otomatis di Word.'],
          ['Unggah .docx hasil perbaikan', 'Website memeriksa apakah semua format di panduan sudah diterapkan dengan benar dan memberi skor rubrik.'],
        ].map(([a, b], i) => (
          <li key={a} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-1 flex items-center gap-2 font-bold">
              <span className="grid size-6 place-items-center rounded-full bg-ink text-xs text-bg">{i + 1}</span>
              {a}
            </div>
            <p className="text-sm text-muted">{b}</p>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        {WORD_TARGETS.map((x) => (
          <a key={x.id} href={href('level', 5, 'latihan', x.id)} className="block rounded-lg border border-line bg-surface p-4 hover:border-ink">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">{x.title}</h3>
              <Chip tone={x.level === 'Sulit' ? 'bad' : x.level === 'Menengah' ? 'warn' : 'plain'}>{x.level}</Chip>
              <span className="text-sm text-muted">± {x.minutes} menit</span>
              {best[x.id] !== undefined && (
                <Chip tone={best[x.id] === 100 ? 'ok' : 'mark'} className="ml-auto">
                  Terbaik {best[x.id]}%
                </Chip>
              )}
            </div>
            <p className="mt-1 text-[15px] text-muted">{x.about}</p>
          </a>
        ))}
      </div>

      <FreeCheck />
    </div>
  )
}

function TargetView({ t, best }: { t: WordTarget; best?: number }) {
  const [facts, setFacts] = useState<DocxFacts | null>(null)
  const [err, setErr] = useState('')
  const results = facts ? t.rubric.map((r) => ({ r, ok: r.test(facts) })) : null
  const pct = results ? Math.round((results.filter((x) => x.ok).length / results.length) * 100) : null

  async function onFile(f: File) {
    setErr('')
    try {
      const fx = await readDocx(new Uint8Array(await f.arrayBuffer()))
      setFacts(fx)
      const p = Math.round((t.rubric.filter((r) => r.test(fx)).length / t.rubric.length) * 100)
      update((s) => ({
        ...s,
        word: { ...s.word, [t.id]: Math.max(s.word[t.id] ?? 0, p) },
        history: [...s.history, { at: Date.now(), kind: 'manual' as const, level: 5, score: p, total: 100 }].slice(-200),
      }))
    } catch (e) {
      setFacts(null)
      setErr((e as Error).message)
    }
  }

  return (
    <div className="max-w-3xl">
      <a href={href('level', 5, 'latihan')} className="text-sm font-semibold text-muted hover:text-ink">
        ‹ Semua target
      </a>
      <div className="mt-3 mb-2 flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-extrabold tracking-tight">{t.title}</h2>
        <Chip>{t.level}</Chip>
        {best !== undefined && <Chip tone={best === 100 ? 'ok' : 'mark'}>Terbaik {best}%</Chip>}
      </div>
      <p className="mb-5 text-[16px] leading-relaxed">{t.about}</p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => downloadMessyDocx(t.id, t.title)}>
          <Icon name="download" /> Unduh Template Berantakan (.docx)
        </Button>
        <a href={t.pdf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-ink">
          <Icon name="download" /> Buka PDF Contoh Hasil
        </a>
        <Timer minutes={t.minutes} />
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-line bg-sunken px-4 py-2.5 text-sm font-bold">
          Panduan Ketentuan Format (Instruksi Perbaikan Template)
        </div>
        <dl className="divide-y divide-line text-sm">
          {t.guide.map((g) => (
            <div key={g.section} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="font-bold text-ink">{g.section}</dt>
              <dd className="leading-relaxed text-muted">
                <Markup text={g.spec} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="mb-6 p-4">
        <div className="mb-2 text-sm font-bold">Fitur Word yang dinilai</div>
        <div className="flex flex-wrap gap-1.5">
          {t.skills.map((s) => (
            <Chip key={s}>{s}</Chip>
          ))}
        </div>
      </Card>

      <DocxDrop onFile={onFile} />
      {err && (
        <div className="mt-3">
          <Callout tone="bad">{err}</Callout>
        </div>
      )}

      <h3 className="mt-8 mb-3 flex items-baseline gap-3 text-lg font-bold">
        Rubrik
        {pct !== null && <span className={cx('mono text-base', pct === 100 ? 'text-ok' : pct >= 70 ? 'text-warn' : 'text-bad')}>{pct}%</span>}
      </h3>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {t.rubric.map((r) => {
          const ok = results?.find((x) => x.r.id === r.id)?.ok
          return (
            <li key={r.id} className="flex gap-3 px-4 py-3">
              <span className={cx('mt-0.5 grid size-5 shrink-0 place-items-center rounded-full', ok === undefined ? 'bg-sunken' : ok ? 'bg-ok text-white' : 'bg-bad text-white')}>
                {ok !== undefined && <Icon name={ok ? 'check' : 'x'} className="size-3" />}
              </span>
              <div className="min-w-0">
                <div className="font-semibold">{r.label}</div>
                {(ok === false || ok === undefined) && <div className="text-sm text-muted">{r.hint}</div>}
              </div>
            </li>
          )
        })}
      </ul>
      {facts && <FactsView f={facts} />}
    </div>
  )
}

function FreeCheck() {
  const [facts, setFacts] = useState<DocxFacts | null>(null)
  const [err, setErr] = useState('')
  return (
    <section className="mt-12">
      <h3 className="mb-1 text-lg font-bold">Periksa dokumen apa saja</h3>
      <p className="mb-3 text-[15px] text-muted">Punya laporan atau tugas sendiri? Unggah untuk melihat apakah strukturnya sudah benar. File dibaca di browser kamu saja, tidak dikirim ke mana pun.</p>
      <DocxDrop
        onFile={async (f) => {
          setErr('')
          try {
            setFacts(await readDocx(new Uint8Array(await f.arrayBuffer())))
          } catch (e) {
            setFacts(null)
            setErr((e as Error).message)
          }
        }}
      />
      {err && (
        <div className="mt-3">
          <Callout tone="bad">{err}</Callout>
        </div>
      )}
      {facts && <FactsView f={facts} />}
    </section>
  )
}

function DocxDrop({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
      className={cx('flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center', drag ? 'border-accent bg-accent/5' : 'border-line')}
    >
      <Icon name="upload" className="size-6 text-muted" />
      <p className="text-sm text-muted">Seret file .docx ke sini, atau</p>
      <Button onClick={() => ref.current?.click()}>Pilih file .docx</Button>
      <input
        ref={ref}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function FactsView({ f }: { f: DocxFacts }) {
  const h = hygiene(f)
  const rows: [string, string][] = [
    ['Kertas', [...new Set(f.sections.map((s) => paperName(s) + (s.landscape ? ' landscape' : '')))].join(', ')],
    ['Section', String(f.sections.length)],
    ['Heading', f.headings.map((n, i) => (i && n ? `H${i}: ${n}` : '')).filter(Boolean).join(', ') || 'tidak ada'],
    ['Daftar isi / daftar gambar', `${f.toc ? 'ada' : 'tidak'} / ${f.tof ? 'ada' : 'tidak'}`],
    ['Paragraf daftar otomatis', String(f.listParas)],
    ['Tabel', `${f.tables}${f.tableHeaderRepeat ? `, ${f.tableHeaderRepeat} judul berulang` : ''}`],
    ['Caption', Object.entries(f.seq).map(([k, v]) => `${k} ${v}`).join(', ') || 'tidak ada'],
    ['Footnote', String(f.footnotes)],
    ['Nomor halaman', f.footerPage ? (f.numPages ? 'ada, dengan total halaman' : 'ada') : 'tidak ada'],
    ['Spasi baris Normal', f.lineSpacing ? String(f.lineSpacing).replace('.', ',') : 'bawaan'],
  ]
  return (
    <div className="mt-6 space-y-4">
      {h.length > 0 ? (
        <div className="space-y-2">
          {h.map((x, i) => (
            <Callout key={i} tone={x.level === 'bad' ? 'bad' : 'warn'}>
              {x.msg}
              {x.detail && (
                <ul className="mt-1.5 list-disc pl-5 text-xs">
                  {x.detail.map((d, j) => (
                    <li key={j} className="mono">
                      {d.length > 70 ? d.slice(0, 70) + '...' : d}
                    </li>
                  ))}
                </ul>
              )}
            </Callout>
          ))}
        </div>
      ) : (
        <Callout tone="ok">Tidak ada judul palsu, Enter berderet, nomor manual, atau spasi berderet. Bersih.</Callout>
      )}
      <Card>
        <div className="border-b border-line px-4 py-2 text-sm font-bold">Yang terbaca dari file</div>
        <dl className="grid grid-cols-[minmax(9rem,max-content)_1fr] gap-x-4 gap-y-1.5 px-4 py-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
