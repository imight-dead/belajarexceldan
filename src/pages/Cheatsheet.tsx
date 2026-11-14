import { LEVELS } from '../content/levels'
import { Formula } from '../components/Formula'
import { Markup } from '../components/Markup'
import { Button } from '../components/ui'

// Cheat sheet disusun otomatis dari sintaks di materi, jadi selalu sama dengan isi website.
// Tata letaknya dua kolom saat dicetak (lihat @media print di index.css).

export function Cheatsheet() {
  return (
    <div className="cheat">
      <div className="no-print mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Cheat sheet</h1>
          <p className="mt-1 text-muted">Semua sintaks dan pegangan cepat dalam satu halaman. Cetak atau simpan sebagai PDF untuk dibaca ulang malam sebelum tes.</p>
        </div>
        <Button variant="primary" onClick={() => window.print()}>
          Cetak / simpan PDF
        </Button>
      </div>
      <h1 className="hidden text-xl font-extrabold print:block">Cheat sheet Tes MS Office dan Design IFLAB</h1>

      <div className="cheat-cols gap-8 md:columns-2">
        {LEVELS.map((l) => {
          const syn = l.concepts.flatMap((c) => (c.syntax ?? []).map((s) => ({ s, c })))
          const grids = l.concepts.filter((c) => c.grid && (l.practice || /pilih|ringkas|shortcut|error|kanvas|alat|cara-pikir|pdf/i.test(c.id + c.title)))
          if (!syn.length && !grids.length) return null
          return (
            <section key={l.n} className="mb-6 break-inside-avoid-column">
              <h2 className="mb-2 border-b-2 border-ink pb-1 text-base font-extrabold">
                Level {l.n} · {l.title}
              </h2>
              {syn.map(({ s, c }, i) => (
                <div key={i} className="mb-2.5 break-inside-avoid">
                  <Formula f={s.formula} className="text-[12px]" />
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
                    {s.args.map((a, j) => (
                      <span key={j}>
                        <b className="mono text-ink">{a.name}</b>
                        {a.optional ? '?' : ''}: <Markup text={a.desc} />{' '}
                      </span>
                    ))}
                  </p>
                  {c.mistakes?.[0] && (
                    <p className="mt-0.5 text-[12px] leading-snug text-bad">
                      Awas: <Markup text={c.mistakes[0]} />
                    </p>
                  )}
                </div>
              ))}
              {grids.map((c) => (
                <div key={c.id} className="mb-3 break-inside-avoid">
                  <div className="mb-1 text-[13px] font-bold">{c.title}</div>
                  <table className="w-full text-[12px] leading-snug">
                    <tbody>
                      {c.grid!.rows.map((r, i) => (
                        <tr key={i} className="border-t border-line align-top">
                          {r.slice(0, 2).map((v, j) => (
                            <td key={j} className={j === 0 ? 'mono py-0.5 pr-2 font-semibold whitespace-nowrap' : 'py-0.5'}>
                              <Markup text={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
