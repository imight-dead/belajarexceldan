import { href } from '../lib/router'
import { update, useStore } from '../lib/store'
import { Card, Progress, cx } from '../components/ui'
import { Countdown } from './Home'

interface Day {
  id: string
  date: Date
  title: string
  focus: string
  tasks: { id: string; text: string; link?: string }[]
}

const DAYS: Day[] = [
  {
    id: 'sen',
    date: new Date(2026, 10, 9),
    title: 'Senin',
    focus: 'Level 0 dan 1: fondasi dan lookup',
    tasks: [
      { id: 'sen-1', text: 'Cek versi Excel (harus 365 / 2024 / web) dan pemisah argumen', link: href('level', 0) },
      { id: 'sen-2', text: 'Baca materi Level 0, coba semua contoh di Excel', link: href('level', 0) },
      { id: 'sen-3', text: 'Kerjakan workbook Level 0, unggah, perbaiki yang salah', link: href('level', 0, 'latihan') },
      { id: 'sen-4', text: 'Kuis Level 0 minimal 80%', link: href('level', 0, 'kuis') },
      { id: 'sen-5', text: 'Materi Level 1 + main visualisator lookup', link: href('level', 1) },
      { id: 'sen-6', text: 'Workbook Level 1 (target 18/22 benar)', link: href('level', 1, 'latihan') },
      { id: 'sen-7', text: 'Kuis Level 1 minimal 80%', link: href('level', 1, 'kuis') },
    ],
  },
  {
    id: 'sel',
    date: new Date(2026, 10, 10),
    title: 'Selasa',
    focus: 'Level 2 dan 3: referensi dinamis dan array',
    tasks: [
      { id: 'sel-0', text: 'Ulang soal salah dari hari Senin', link: href('ulang') },
      { id: 'sel-1', text: 'Level 2: OFFSET, ADDRESS, INDIRECT, dropdown bertingkat', link: href('level', 2) },
      { id: 'sel-2', text: 'Workbook + kuis Level 2, main peraga OFFSET', link: href('level', 2, 'latihan') },
      { id: 'sel-3', text: 'Level 3: spill, FILTER, SORT, UNIQUE, VSTACK, CHOOSECOLS', link: href('level', 3) },
      { id: 'sel-4', text: 'Workbook + kuis Level 3', link: href('level', 3, 'latihan') },
    ],
  },
  {
    id: 'rab',
    date: new Date(2026, 10, 11),
    title: 'Rabu',
    focus: 'Level 4: LET, LAMBDA, MAP, BYROW, REDUCE, SCAN',
    tasks: [
      { id: 'rab-0', text: 'Ulang soal salah', link: href('ulang') },
      { id: 'rab-1', text: 'LET dan LAMBDA, simpan fungsi di Name Manager', link: href('level', 4) },
      { id: 'rab-2', text: 'MAP, BYROW/BYCOL, REDUCE, SCAN dengan visualisator', link: href('level', 4) },
      { id: 'rab-3', text: 'Workbook Level 4 (paling berat, sisihkan waktu lebih)', link: href('level', 4, 'latihan') },
      { id: 'rab-4', text: 'Kuis Level 4', link: href('level', 4, 'kuis') },
    ],
  },
  {
    id: 'kam',
    date: new Date(2026, 10, 12),
    title: 'Kamis',
    focus: 'Level 5: MS Word, PDF ke dokumen terstruktur',
    tasks: [
      { id: 'kam-1', text: 'Materi Styles, heading, multilevel list, section break', link: href('level', 5) },
      { id: 'kam-2', text: 'Kerjakan minimal 2 dari 4 PDF target, cek dengan pemeriksa .docx', link: href('level', 5, 'latihan') },
      { id: 'kam-3', text: 'Kuis Level 5', link: href('level', 5, 'kuis') },
    ],
  },
  {
    id: 'jum',
    date: new Date(2026, 10, 13),
    title: 'Jumat',
    focus: 'Level 6 Design + simulasi tes',
    tasks: [
      { id: 'jum-1', text: 'Materi prinsip desain, tipografi, warna, ukuran kanvas', link: href('level', 6) },
      { id: 'jum-p', text: 'Latihan perbaiki desain jelek', link: href('level', 6, 'latihan', 'perbaiki') },
      { id: 'jum-2', text: 'Kerjakan 2 brief desain dengan timer', link: href('level', 6, 'latihan') },
      { id: 'jum-k', text: 'Kuis Level 6', link: href('level', 6, 'kuis') },
      { id: 'jum-3', text: 'Simulasi tes penuh', link: href('simulasi') },
      { id: 'jum-r', text: 'Cek rapor, ulang bab yang masih merah', link: href('rapor') },
      { id: 'jum-4', text: 'Baca ulang cheat sheet, tidur cukup', link: href('cheatsheet') },
    ],
  },
]

export function Plan() {
  const plan = useStore((s) => s.plan)
  const today = new Date()
  const isToday = (d: Date) => d.toDateString() === today.toDateString()

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">Rencana 5 hari</h1>
      <p className="mt-2 mb-6 text-muted">Senin sampai Jumat, 9 sampai 13 November 2026. Sabtu tes. Centang yang sudah selesai, tersimpan otomatis.</p>
      <Card className="mb-8 p-5">
        <div className="mb-3 text-sm font-semibold text-muted">Menuju Sabtu, 14 November 2026</div>
        <Countdown />
      </Card>

      <div className="space-y-4">
        {DAYS.map((d) => {
          const done = d.tasks.filter((t) => plan[t.id]).length
          return (
            <Card key={d.id} className={cx('p-5', isToday(d.date) && 'border-accent')}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-lg font-bold">{d.title}</h2>
                <span className="text-sm text-muted">{d.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                {isToday(d.date) && <span className="rounded bg-accent px-1.5 text-xs font-bold text-accent-ink">hari ini</span>}
                <span className="mono ml-auto text-xs text-muted">
                  {done}/{d.tasks.length}
                </span>
              </div>
              <p className="mb-3 text-sm font-semibold">{d.focus}</p>
              <Progress value={(done / d.tasks.length) * 100} className="mb-3" />
              <ul className="space-y-1.5">
                {d.tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5 text-sm">
                    <input
                      id={t.id}
                      type="checkbox"
                      checked={!!plan[t.id]}
                      onChange={(e) => update((s) => ({ ...s, plan: { ...s.plan, [t.id]: e.target.checked } }))}
                      className="mt-1 size-4 accent-[var(--accent)]"
                    />
                    <label htmlFor={t.id} className={cx('flex-1', plan[t.id] && 'text-muted line-through')}>
                      {t.text}
                    </label>
                    {t.link && (
                      <a href={t.link} className="text-xs font-semibold text-accent hover:underline">
                        buka
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
        <Card className="p-5">
          <h2 className="text-lg font-bold">Sabtu, 14 November: hari tes</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Datang lebih awal. Cek versi Excel di komputer tes dan pemisah argumennya (koma atau titik koma).</li>
            <li>Kerjakan yang paling yakin dulu. Soal yang macet lebih dari 5 menit, tandai dan lompati.</li>
            <li>Simpan berkala dengan Ctrl+S.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
