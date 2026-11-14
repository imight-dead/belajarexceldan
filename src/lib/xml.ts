import { DOMParser } from '@xmldom/xmldom'

// xmldom dipakai di browser dan Node (skrip verifikasi) supaya perilakunya sama persis.
export type XEl = Element

export function parseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'text/xml') as unknown as Document
}

/** Semua elemen turunan dengan nama tag persis (termasuk prefix, mis. "w:p"). */
export function all(node: Document | Element, tag: string): Element[] {
  return Array.from(node.getElementsByTagName(tag) as unknown as ArrayLike<Element>)
}

/** Anak langsung dengan nama tag tertentu. */
export function kids(node: Element, tag?: string): Element[] {
  const out: Element[] = []
  for (let c = node.firstChild; c; c = c.nextSibling) {
    if (c.nodeType === 1 && (!tag || (c as Element).tagName === tag)) out.push(c as Element)
  }
  return out
}

export function kid(node: Element, tag: string): Element | undefined {
  return kids(node, tag)[0]
}

export function text(node: Element | undefined | null): string {
  return node?.textContent ?? ''
}
