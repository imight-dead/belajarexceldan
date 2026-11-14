import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'ghost' | 'mark' | 'quiet'
export function Button({ variant = 'ghost', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        variant === 'primary' && 'bg-accent text-accent-ink hover:opacity-90',
        variant === 'mark' && 'bg-mark text-[#18202a] hover:brightness-95',
        variant === 'ghost' && 'border border-line bg-surface hover:bg-sunken',
        variant === 'quiet' && 'text-muted hover:bg-sunken hover:text-ink',
        className,
      )}
    />
  )
}

export function Chip({ children, tone = 'plain', className }: { children: ReactNode; tone?: 'plain' | 'ok' | 'bad' | 'warn' | 'mark' | 'accent'; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tone === 'plain' && 'bg-sunken text-muted',
        tone === 'ok' && 'bg-ok-soft text-ok',
        tone === 'bad' && 'bg-bad-soft text-bad',
        tone === 'warn' && 'bg-warn-soft text-warn',
        tone === 'mark' && 'bg-mark-soft text-ink',
        tone === 'accent' && 'bg-accent text-accent-ink',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg border border-line bg-surface', className)}>{children}</div>
}

export function Callout({ children, tone = 'warn', title }: { children: ReactNode; tone?: 'warn' | 'ok' | 'bad' | 'mark'; title?: string }) {
  return (
    <div
      className={cx(
        'rounded-lg border-l-4 px-4 py-3 text-sm',
        tone === 'warn' && 'border-warn bg-warn-soft',
        tone === 'ok' && 'border-ok bg-ok-soft',
        tone === 'bad' && 'border-bad bg-bad-soft',
        tone === 'mark' && 'border-mark bg-mark-soft',
      )}
    >
      {title && <div className="mb-0.5 font-bold">{title}</div>}
      {children}
    </div>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-sunken', className)}>
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Icon({ name, className = 'size-4' }: { name: 'lock' | 'check' | 'x' | 'sun' | 'moon' | 'download' | 'upload' | 'copy' | 'play' | 'step' | 'reset' | 'menu' | 'flag'; className?: string }) {
  const paths: Record<string, ReactNode> = {
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    check: <path d="m5 12 5 5 9-10" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />,
    download: <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />,
    upload: <path d="M12 20V9m0 0-4 4m4-4 4 4M5 4h14" />,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>,
    play: <path d="M7 5v14l11-7z" />,
    step: <path d="M6 5v14M10 5l9 7-9 7z" />,
    reset: <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  )
}
