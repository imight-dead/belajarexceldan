import { useState, type MouseEvent } from 'react'
import { BRIEFS, type Brief } from '../content/level6'
import { href } from '../lib/router'
import { update, useStore } from '../lib/store'
import { Timer } from './Timer'
import { Button, Callout, Card, Chip, Icon, cx } from './ui'

export function DesignPractice({ focus }: { focus?: string }) {
  const best = useStore((s) => s.design)
  if (focus === 'perbaiki') return <FixBad />
  const b = BRIEFS.find((x) => x.id === focus)
  if (b) return <BriefView b={b} />
  return (
    <div className="max-w-3xl">
      <a href={href('level', 6, 'latihan', 'perbaiki')} className="mb-8 block rounded-lg border-2 border-mark bg-mark-soft p-5 hover:brightness-95">
        <div className="flex items-center gap-2 text-lg font-bold">
          Perbaiki desain jelek
          {best.perbaiki !== undefined && <Chip tone="ok">Terbaik {best.perbaiki}%</Chip>}
        </div>
        <p className="mt-1 text-[15px]">Mulai dari sini. Klik bagian poster yang salah, lalu bandingkan dengan versi yang sudah dibetulkan. Melatih mata sebelum mulai mendesain.</p>
      </a>
      <h3 className="mb-3 text-lg font-bold">6 brief latihan</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {BRIEFS.map((x) => (
          <a key={x.id} href={href('level', 6, 'latihan', x.id)} className="rounded-lg border border-line bg-surface p-4 hover:border-ink">
            <div className="flex items-start gap-2">
              <h4 className="flex-1 font-bold">{x.title}</h4>
              {best[x.id] !== undefined && <Chip tone={best[x.id] >= 80 ? 'ok' : 'mark'}>{best[x.id]}%</Chip>}
            </div>
            <p className="mt-1 text-sm text-muted">{x.canvas}</p>
            <p className="text-sm text-muted">{x.minutes} menit</p>
          </a>
        ))}
      </div>
    </div>
  )
}

function expectedPx(b: Brief): [number, number] | null {
  const m = b.canvas.match(/(\d+) x (\d+) px/)
  if (m) return [Number(m[1]), Number(m[2])]
  const mm = b.canvas.match(/(\d+) x (\d+) mm/)
  if (mm) return [Math.round((Number(mm[1]) / 25.4) * 300), Math.round((Number(mm[2]) / 25.4) * 300)]
  return null
}

function BriefView({ b }: { b: Brief }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [img, setImg] = useState<{ url: string; w: number; h: number } | null>(null)
  const [saved, setSaved] = useState(false)
  const exp = expectedPx(b)
  const score = Math.round((Object.values(checked).filter(Boolean).length / b.rubric.length) * 100)
  const sizeOk = img && exp ? Math.abs(img.w / img.h - exp[0] / exp[1]) < 0.01 && img.w >= exp[0] * 0.95 : null

  return (
    <div className="max-w-3xl">
      <a href={href('level', 6, 'latihan')} className="text-sm font-semibold text-muted hover:text-ink">
        ‹ Semua latihan desain
      </a>
      <h2 className="mt-3 mb-1 text-2xl font-extrabold tracking-tight">{b.title}</h2>
      <p className="mb-4 text-muted">{b.canvas}</p>
      <div className="mb-6">
        <Timer minutes={b.minutes} />
      </div>

      <Card className="mb-6 p-5">
        <h3 className="mb-2 font-bold">Isi yang wajib ada</h3>
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          {b.must.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="mt-3 text-[15px]">
          <b>Batasan:</b> {b.constraint}
        </p>
      </Card>

      <h3 className="mb-2 font-bold">Sudah selesai? Unggah hasil ekspornya</h3>
      <p className="mb-3 text-sm text-muted">Gambar hanya ditampilkan di browser kamu. Website mengecek ukurannya, sisanya kamu nilai sendiri dengan ceklis.</p>
      <label className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-sunken">
        <Icon name="upload" /> Pilih gambar PNG/JPG
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const url = URL.createObjectURL(f)
            const im = new Image()
            im.onload = () => setImg({ url, w: im.naturalWidth, h: im.naturalHeight })
            im.src = url
          }}
        />
      </label>
      {img && (
        <div className="mb-6">
          <img src={img.url} alt="Desain kamu" className="max-h-[480px] rounded-md border border-line" />
          <div className="mt-2">
            {sizeOk === null ? null : sizeOk ? (
              <Callout tone="ok">
                Ukuran {img.w} x {img.h} px sudah sesuai.
              </Callout>
            ) : (
              <Callout tone="bad">
                Ukuran {img.w} x {img.h} px. Brief meminta {exp![0]} x {exp![1]} px. Cek ukuran kanvas atau pengaturan ekspor.
              </Callout>
            )}
          </div>
        </div>
      )}

      <h3 className="mb-2 flex items-baseline gap-3 font-bold">
        Ceklis penilaian <span className="mono text-muted">{score}%</span>
      </h3>
      <p className="mb-3 text-sm text-muted">Jujur saja. Lihat desainmu dari jauh, lalu centang yang benar-benar sudah terpenuhi.</p>
      <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
        {b.rubric.map((r, i) => (
          <li key={r}>
            <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
              <input type="checkbox" checked={!!checked[i]} onChange={(e) => (setChecked({ ...checked, [i]: e.target.checked }), setSaved(false))} className="mt-1 size-4 accent-[var(--accent)]" />
              <span className="text-[15px]">{r}</span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        className="mt-4"
        onClick={() => {
          update((s) => ({ ...s, design: { ...s.design, [b.id]: Math.max(s.design[b.id] ?? 0, score) } }))
          setSaved(true)
        }}
      >
        Simpan skor
      </Button>
      {saved && <span className="ml-3 text-sm text-ok">Tersimpan.</span>}
    </div>
  )
}

// ------------------------------------------------------------------ Perbaiki desain jelek
interface Issue {
  id: string
  title: string
  why: string
  fix: string
  box: { x: number; y: number; w: number; h: number }
}

const ISSUES: Issue[] = [
  { id: 'logo', title: 'Logo lebih menonjol dari judul', why: 'Lingkaran logo paling besar dan paling berwarna, jadi itu yang pertama dilihat. Padahal pesannya adalah rekrutmen.', fix: 'Kecilkan logo dan pindahkan ke pojok. Judul jadi elemen terbesar.', box: { x: 240, y: 0, w: 160, h: 150 } },
  { id: 'margin', title: 'Judul menempel di tepi', why: 'Huruf pertama judul hampir menyentuh tepi kiri. Bisa terpotong di layar dan terlihat tidak rapi.', fix: 'Beri margin yang sama di semua sisi, sekitar 6% dari lebar.', box: { x: 0, y: 150, w: 400, h: 42 } },
  { id: 'stretch', title: 'Huruf diregangkan', why: 'Teks DAFTAR SEKARANG ditarik melebar sehingga bentuk hurufnya rusak.', fix: 'Pakai ukuran atau ketebalan font untuk menonjolkan, jangan regangkan.', box: { x: 0, y: 200, w: 400, h: 44 } },
  { id: 'font', title: 'Terlalu banyak jenis font', why: 'Ada serif, tulisan tangan, dan monospace dalam satu poster. Terasa tidak menyatu.', fix: 'Pakai satu font sans-serif. Bedakan dengan ukuran dan ketebalan.', box: { x: 10, y: 250, w: 380, h: 92 } },
  { id: 'kontras', title: 'Kontras tanggal terlalu rendah', why: 'Tanggal ditulis kuning muda di atas putih. Informasi penting ini hampir tidak terbaca.', fix: 'Teks gelap di latar terang, atau taruh tanggal di kotak warna aksen.', box: { x: 140, y: 348, w: 260, h: 34 } },
  { id: 'warna', title: 'Terlalu banyak warna', why: 'Garis pelangi tujuh warna tidak punya fungsi dan bersaing dengan isi.', fix: 'Batasi 3 warna: dasar, pendukung, dan satu aksen.', box: { x: 0, y: 388, w: 400, h: 52 } },
  { id: 'jarak', title: 'Info yang berhubungan terpisah jauh', why: 'Tanggal ada di kanan tengah, tempat dan jam di kiri bawah. Pembaca harus mencari-cari.', fix: 'Kelompokkan tanggal, jam, dan tempat jadi satu blok.', box: { x: 0, y: 450, w: 260, h: 50 } },
]

function BadPoster() {
  const rainbow = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7']
  return (
    <>
      <rect width="400" height="500" fill="#ffffff" />
      <circle cx="330" cy="70" r="68" fill="#ec4899" />
      <text x="330" y="82" textAnchor="middle" fontFamily="serif" fontSize="34" fontWeight="bold" fill="#fde047">
        IFLAB
      </text>
      <text x="2" y="178" fontFamily="serif" fontSize="22" fill="#111">
        open recruitment asisten laboratorium
      </text>
      <text x="40" y="234" fontFamily="cursive" fontSize="22" fill="#16a34a" transform="scale(1.7 1)">
        DAFTAR SEKARANG!!!
      </text>
      <g fontFamily="monospace" fontSize="13" fill="#444" textAnchor="middle">
        <text x="200" y="270">syarat: mahasiswa aktif angkatan 2024/2025,</text>
        <text x="200" y="290">IPK minimal 3,25, lulus Algoritma dan</text>
        <text x="200" y="310">Pemrograman, bersedia mengikuti seleksi,</text>
        <text x="200" y="330">mengunggah CV dan transkrip nilai.</text>
      </g>
      <text x="392" y="372" textAnchor="end" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="#fef08a">
        1 - 10 November 2026
      </text>
      {rainbow.map((c, i) => (
        <rect key={c} x="0" y={392 + i * 6} width="400" height="6" fill={c} />
      ))}
      <text x="6" y="478" fontFamily="cursive" fontSize="13" fill="#333">
        Lab Gedung F, pukul 08.00
      </text>
    </>
  )
}

function GoodPoster() {
  return (
    <>
      <rect width="400" height="500" fill="#f8fafc" />
      <rect x="24" y="24" width="38" height="38" rx="8" fill="#1e3a8a" />
      <text x="43" y="48" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#fff">
        IF
      </text>
      <text x="72" y="48" fontFamily="sans-serif" fontSize="12" fontWeight="600" fill="#334155">
        Laboratorium Informatika
      </text>
      <text x="24" y="122" fontFamily="sans-serif" fontSize="15" fontWeight="600" fill="#1e3a8a">
        OPEN RECRUITMENT
      </text>
      <text x="24" y="162" fontFamily="sans-serif" fontSize="34" fontWeight="800" fill="#0f172a">
        Asisten
      </text>
      <text x="24" y="200" fontFamily="sans-serif" fontSize="34" fontWeight="800" fill="#0f172a">
        Laboratorium
      </text>
      <g fontFamily="sans-serif" fontSize="13" fill="#334155">
        <text x="24" y="246" fontWeight="700" fill="#0f172a">
          Syarat
        </text>
        <text x="24" y="268">• Mahasiswa aktif angkatan 2024/2025</text>
        <text x="24" y="288">• IPK minimal 3,25</text>
        <text x="24" y="308">• Lulus Algoritma dan Pemrograman</text>
      </g>
      <rect x="24" y="340" width="352" height="96" rx="10" fill="#1e3a8a" />
      <g fontFamily="sans-serif" fill="#fff">
        <text x="44" y="372" fontSize="12" opacity="0.8">
          Pendaftaran
        </text>
        <text x="44" y="398" fontSize="22" fontWeight="800" fill="#facc15">
          1 - 10 November 2026
        </text>
        <text x="44" y="420" fontSize="12">
          Lab Gedung F, pukul 08.00
        </text>
      </g>
      <text x="24" y="472" fontFamily="sans-serif" fontSize="12" fill="#475569">
        Daftar: s.id/oprec-iflab
      </text>
    </>
  )
}

function FixBad() {
  const [found, setFound] = useState<Set<string>>(new Set())
  const [miss, setMiss] = useState<{ x: number; y: number }[]>([])
  const [done, setDone] = useState(false)
  const pct = Math.round((found.size / ISSUES.length) * 100)

  const click = (e: MouseEvent<SVGSVGElement>) => {
    if (done) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 400
    const y = ((e.clientY - r.top) / r.height) * 500
    const hit = ISSUES.find((i) => x >= i.box.x && x <= i.box.x + i.box.w && y >= i.box.y && y <= i.box.y + i.box.h)
    if (hit) setFound((s) => new Set(s).add(hit.id))
    else setMiss((m) => [...m, { x, y }])
  }
  const finish = () => {
    setDone(true)
    update((s) => ({ ...s, design: { ...s.design, perbaiki: Math.max(s.design.perbaiki ?? 0, pct) } }))
  }

  return (
    <div>
      <a href={href('level', 6, 'latihan')} className="text-sm font-semibold text-muted hover:text-ink">
        ‹ Semua latihan desain
      </a>
      <h2 className="mt-3 mb-1 text-2xl font-extrabold tracking-tight">Perbaiki desain jelek</h2>
      <p className="mb-5 max-w-[68ch] text-[16px] leading-relaxed">
        Poster di bawah punya <b>{ISSUES.length} kesalahan</b>. Klik bagian yang menurutmu salah. Kalau sudah, tekan Selesai untuk melihat pembahasan dan versi yang sudah dibetulkan.
      </p>

      <div className="flex flex-wrap items-start gap-6">
        <figure className="w-full max-w-[400px]">
          <svg viewBox="0 0 400 500" onClick={click} className={cx('w-full rounded-lg border border-line shadow-sm', !done && 'cursor-crosshair')} role="img" aria-label="Poster dengan banyak kesalahan desain">
            <BadPoster />
            {ISSUES.filter((i) => found.has(i.id) || done).map((i, k) => (
              <g key={i.id}>
                <rect {...i.box} fill="none" stroke={found.has(i.id) ? '#16a34a' : '#dc2626'} strokeWidth="2.5" strokeDasharray={found.has(i.id) ? undefined : '6 4'} rx="4" />
                <circle cx={i.box.x + 14} cy={i.box.y + 14} r="11" fill={found.has(i.id) ? '#16a34a' : '#dc2626'} />
                <text x={i.box.x + 14} y={i.box.y + 18} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="sans-serif">
                  {ISSUES.indexOf(i) + 1 || k + 1}
                </text>
              </g>
            ))}
            {miss.map((m, k) => (
              <text key={k} x={m.x} y={m.y + 5} textAnchor="middle" fontSize="16" fill="#94a3b8" fontFamily="sans-serif">
                ×
              </text>
            ))}
          </svg>
          <figcaption className="mt-2 text-sm text-muted">
            Ketemu {found.size} dari {ISSUES.length}
          </figcaption>
        </figure>

        {done ? (
          <figure className="w-full max-w-[400px]">
            <svg viewBox="0 0 400 500" className="w-full rounded-lg border border-line shadow-sm" role="img" aria-label="Poster setelah diperbaiki">
              <GoodPoster />
            </svg>
            <figcaption className="mt-2 text-sm text-muted">Setelah diperbaiki: satu font, tiga warna, satu sisi rata, info dikelompokkan.</figcaption>
          </figure>
        ) : (
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={finish}>
              Selesai, lihat pembahasan
            </Button>
            <Button variant="quiet" onClick={() => (setFound(new Set()), setMiss([]))}>
              <Icon name="reset" /> Ulang
            </Button>
          </div>
        )}
      </div>

      {done && (
        <div className="mt-8 max-w-[68ch]">
          <h3 className="mb-3 flex items-baseline gap-3 text-lg font-bold">
            Pembahasan <span className="mono text-base text-muted">{pct}%</span>
          </h3>
          <ol className="space-y-3">
            {ISSUES.map((i, k) => (
              <li key={i.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center gap-2 font-bold">
                  <span className={cx('grid size-6 place-items-center rounded-full text-xs text-white', found.has(i.id) ? 'bg-ok' : 'bg-bad')}>{k + 1}</span>
                  {i.title}
                </div>
                <p className="mt-1.5 text-[15px]">{i.why}</p>
                <p className="mt-1 text-[15px] text-muted">
                  <b className="text-ink">Perbaikan:</b> {i.fix}
                </p>
              </li>
            ))}
          </ol>
          <Button className="mt-4" onClick={() => (setDone(false), setFound(new Set()), setMiss([]))}>
            <Icon name="reset" /> Coba lagi
          </Button>
        </div>
      )}
    </div>
  )
}
