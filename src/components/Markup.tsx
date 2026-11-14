import { Fragment, type ReactNode } from 'react'
import { Formula } from './Formula'

// Markup ringan untuk teks konten: {{=RUMUS}}, **tebal**, `kode`.
const RE = /(\{\{.+?\}\}|\*\*.+?\*\*|`[^`]+`)/g

export function Markup({ text }: { text: string }): ReactNode {
  const parts = text.split(RE)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('{{')) return <Formula key={i} f={p.slice(2, -2)} inline />
        if (p.startsWith('**')) return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
        if (p.startsWith('`')) return <code key={i} className="rounded bg-sunken px-1 py-0.5">{p.slice(1, -1)}</code>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
