import { useState } from 'react'
import { tokenize } from '../lib/formula'
import { Icon, cx } from './ui'

/** Rumus dengan highlight. inline = di dalam kalimat. */
export function Formula({ f, inline, copy, className }: { f: string; inline?: boolean; copy?: boolean; className?: string }) {
  const toks = tokenize(f)
  const body = toks.map((t, i) => (
    <span key={i} className={`tok-${t.k}`}>
      {t.t}
    </span>
  ))
  if (inline)
    return <code className={cx('rounded bg-sunken px-1 py-0.5 break-words', className)}>{body}</code>
  return (
    <div className={cx('group relative rounded-md border border-line bg-sunken', className)}>
      <pre className="mono overflow-x-auto px-3 py-2.5 pr-10 text-[13px] leading-relaxed whitespace-pre-wrap break-all">{body}</pre>
      {copy && <CopyBtn text={f} />}
    </div>
  )
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="absolute top-1.5 right-1.5 rounded p-1.5 text-muted hover:bg-surface hover:text-ink"
      title="Salin rumus"
      aria-label="Salin rumus"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => {
            setDone(true)
            setTimeout(() => setDone(false), 1200)
          },
          () => {},
        )
      }}
    >
      <Icon name={done ? 'check' : 'copy'} className="size-3.5" />
    </button>
  )
}
