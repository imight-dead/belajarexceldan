import { useEffect, useState } from 'react'
import { Button, cx } from './ui'

/** Timer hitung mundur sederhana untuk latihan bertenggat. */
export function Timer({ minutes, label = 'Timer' }: { minutes: number; label?: string }) {
  const [end, setEnd] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!end) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [end])
  const left = end ? Math.max(0, end - now) : minutes * 60000
  const mm = Math.floor(left / 60000)
  const ss = Math.floor((left % 60000) / 1000)
  const over = end !== null && left === 0
  return (
    <div className="flex items-center gap-2">
      <span className={cx('mono rounded-md px-2 py-1 text-sm font-semibold tabular-nums', over ? 'bg-bad-soft text-bad' : end ? 'bg-mark-soft' : 'bg-sunken text-muted')}>
        {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
      </span>
      {end ? (
        <Button variant="quiet" onClick={() => setEnd(null)}>
          {over ? 'Waktu habis, ulang' : 'Berhenti'}
        </Button>
      ) : (
        <Button variant="quiet" onClick={() => (setEnd(Date.now() + minutes * 60000), setNow(Date.now()))}>
          Mulai {label.toLowerCase()} {minutes} menit
        </Button>
      )}
    </div>
  )
}
