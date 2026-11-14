import JSZip from 'jszip'
import { all, kid, parseXml } from './xml'

// Pembaca struktur .docx. Yang dibaca bukan tampilan, tapi "cara dokumen dibuat":
// heading pakai style atau cuma ditebalkan, daftar otomatis atau diketik, pindah halaman
// pakai page break atau Enter berkali-kali, dan seterusnya.

const CM = 567 // twip per cm

export interface Section {
  landscape: boolean
  /** ukuran kertas dalam cm */
  w: number
  h: number
  margin: { top: number; right: number; bottom: number; left: number }
  pgFmt?: string
  pgStart?: number
  cols: number
}

export interface DocxFacts {
  paragraphs: number
  words: number
  sections: Section[]
  /** headings[n] = jumlah paragraf Heading n (1..9) */
  headings: number[]
  headingTexts: { level: number; text: string; numbered: boolean }[]
  title: boolean
  fakeHeadings: string[]
  /** jumlah kelompok paragraf kosong berturut-turut (2 atau lebih) */
  emptyStreaks: number
  emptyStreakMax: number
  pageBreaks: number
  toc: boolean
  tof: boolean
  seq: Record<string, number>
  captionStyle: number
  footnotes: number
  tables: number
  tableHeaderRepeat: number
  listParas: number
  maxListLevel: number
  manualList: string[]
  spaceRuns: string[]
  tabs: number
  headerText: boolean
  footerPage: boolean
  numPages: boolean
  images: number
  lineSpacing: number | null
  hangingIndent: number
}

interface StyleInfo {
  name: string
  basedOn?: string
  outline?: number
  numbered: boolean
}

const W = (el: Element | undefined, attr: string) => el?.getAttribute('w:' + attr) ?? undefined
const num = (v: string | undefined) => (v === undefined ? undefined : Number(v))

export async function readDocx(data: ArrayBuffer | Uint8Array): Promise<DocxFacts> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    throw new Error('File ini bukan .docx yang valid. Simpan ulang dari Word sebagai "Word Document (.docx)".')
  }
  const read = async (p: string) => (zip.file(p) ? zip.file(p)!.async('string') : null)
  const docXml = await read('word/document.xml')
  if (!docXml) throw new Error('word/document.xml tidak ditemukan. Pastikan filenya .docx, bukan .doc atau .pdf.')
  const doc = parseXml(docXml)

  // ---------- styles
  const styles = new Map<string, StyleInfo>()
  let lineSpacing: number | null = null
  const stylesXml = await read('word/styles.xml')
  if (stylesXml) {
    const sd = parseXml(stylesXml)
    for (const s of all(sd, 'w:style')) {
      if (W(s, 'type') !== 'paragraph') continue
      const id = W(s, 'styleId')!
      const pPr = kid(s, 'w:pPr')
      const numPr = pPr && kid(pPr, 'w:numPr')
      styles.set(id, {
        name: (W(kid(s, 'w:name'), 'val') ?? id).toLowerCase(),
        basedOn: W(kid(s, 'w:basedOn'), 'val'),
        outline: num(W(pPr && kid(pPr, 'w:outlineLvl'), 'val')),
        numbered: !!numPr && W(kid(numPr, 'w:numId'), 'val') !== '0',
      })
      if ((W(kid(s, 'w:name'), 'val') ?? '').toLowerCase() === 'normal') {
        const sp = pPr && kid(pPr, 'w:spacing')
        if (sp && W(sp, 'line') && (W(sp, 'lineRule') ?? 'auto') === 'auto') lineSpacing = Number(W(sp, 'line')) / 240
      }
    }
    if (lineSpacing === null) {
      const d = all(sd, 'w:pPrDefault')[0]
      const sp = d && all(d, 'w:spacing')[0]
      if (sp && W(sp, 'line') && (W(sp, 'lineRule') ?? 'auto') === 'auto') lineSpacing = Number(W(sp, 'line')) / 240
    }
  }
  const chain = (id: string | undefined) => {
    const out: StyleInfo[] = []
    for (let k = 0; id && k < 10; k++) {
      const s = styles.get(id)
      if (!s) break
      out.push(s)
      id = s.basedOn
    }
    return out
  }
  const headingLevel = (styleId: string | undefined, pOutline: number | undefined): number => {
    const c = chain(styleId)
    const m = c[0]?.name.match(/^heading (\d)$/)
    if (m) return Number(m[1])
    const ol = pOutline ?? c.find((s) => s.outline !== undefined)?.outline
    return ol !== undefined && ol < 9 ? ol + 1 : 0
  }

  // ---------- paragraf
  const body = all(doc, 'w:body')[0]
  const paras = all(body, 'w:p')
  const f: DocxFacts = {
    paragraphs: 0,
    words: 0,
    sections: [],
    headings: Array(10).fill(0),
    headingTexts: [],
    title: false,
    fakeHeadings: [],
    emptyStreaks: 0,
    emptyStreakMax: 0,
    pageBreaks: 0,
    toc: false,
    tof: false,
    seq: {},
    captionStyle: 0,
    footnotes: all(body, 'w:footnoteReference').length,
    tables: all(body, 'w:tbl').length,
    tableHeaderRepeat: all(body, 'w:tblHeader').filter((e) => W(e, 'val') !== '0' && W(e, 'val') !== 'false').length,
    listParas: 0,
    maxListLevel: 0,
    manualList: [],
    spaceRuns: [],
    tabs: 0,
    headerText: false,
    footerPage: false,
    numPages: false,
    images: all(body, 'w:drawing').length + all(body, 'w:pict').length,
    lineSpacing,
    hangingIndent: 0,
  }

  const instrOf = (root: Element) => [...all(root, 'w:instrText').map((e) => e.textContent ?? ''), ...all(root, 'w:fldSimple').map((e) => W(e, 'instr') ?? '')].join(' ')
  const allInstr = instrOf(body)
  for (const m of allInstr.matchAll(/\bTOC\b([^]*?)(?=\bTOC\b|$)/g)) {
    if (/\\[ca]\s/.test(m[1])) f.tof = true
    else f.toc = true
  }
  if (all(body, 'w:sdt').some((s) => all(s, 'w:docPartGallery').some((g) => /Table of Contents/i.test(W(g, 'val') ?? '')))) f.toc = true
  for (const m of allInstr.matchAll(/\bSEQ\s+("?)([^\s"\\]+)\1/g)) f.seq[m[2]] = (f.seq[m[2]] ?? 0) + 1

  let streak = 0
  const flush = () => {
    if (streak >= 2) f.emptyStreaks++
    f.emptyStreakMax = Math.max(f.emptyStreakMax, streak)
    streak = 0
  }
  for (const p of paras) {
    const inTable = !!closest(p, 'w:tbl')
    const pPr = kid(p, 'w:pPr')
    const styleId = W(pPr && kid(pPr, 'w:pStyle'), 'val')
    const style = chain(styleId)[0]
    const txt = all(p, 'w:t')
      .map((t) => t.textContent ?? '')
      .join('')
    const hasDrawing = all(p, 'w:drawing').length + all(p, 'w:pict').length > 0
    const pageBr = all(p, 'w:br').filter((b) => W(b, 'type') === 'page').length + (pPr && kid(pPr, 'w:pageBreakBefore') ? 1 : 0)
    f.pageBreaks += pageBr
    f.tabs += all(p, 'w:tab').filter((t) => closest(t, 'w:r')).length
    const sect = pPr && kid(pPr, 'w:sectPr')
    if (sect) f.sections.push(readSect(sect))
    const isField = all(p, 'w:instrText').length > 0 || all(p, 'w:fldSimple').length > 0
    const empty = !txt.trim() && !hasDrawing && !pageBr && !sect && !isField
    if (!inTable) {
      if (empty) streak++
      else flush()
    }
    if (!txt.trim()) continue
    f.paragraphs++
    f.words += txt.trim().split(/\s+/).length

    const numPr = pPr && kid(pPr, 'w:numPr')
    const listNumbered = !!numPr && W(kid(numPr, 'w:numId'), 'val') !== '0'
    const level = headingLevel(styleId, num(W(pPr && kid(pPr, 'w:outlineLvl'), 'val')))
    if (style?.name === 'title') f.title = true
    if (style?.name === 'caption') f.captionStyle++
    const ind = pPr && kid(pPr, 'w:ind')
    if (ind && Number(W(ind, 'hanging') ?? 0) > 0) f.hangingIndent++
    if (level) {
      f.headings[level]++
      f.headingTexts.push({ level, text: txt.trim(), numbered: listNumbered || chain(styleId).some((s) => s.numbered) })
      continue
    }
    if (listNumbered) {
      f.listParas++
      f.maxListLevel = Math.max(f.maxListLevel, Number(W(kid(numPr!, 'w:ilvl'), 'val') ?? 0))
      continue
    }
    if (/^\s*(\d{1,2}[.)]|[a-z][.)]|[-•*·▪●])\s+\S/.test(txt) && !inTable) f.manualList.push(txt.trim())
    if (/\S {3,}\S|^ {3,}\S/.test(txt)) f.spaceRuns.push(txt.trim())
    // heading palsu: paragraf pendek di luar tabel, semua run tebal atau besar, tanpa style heading
    if (!inTable && txt.trim().length <= 80 && !/[.:;,]$/.test(txt.trim()) && style?.name !== 'title' && style?.name !== 'subtitle' && style?.name !== 'caption') {
      const runs = all(p, 'w:r').filter((r) => all(r, 'w:t').some((t) => (t.textContent ?? '').trim()))
      const bold = runs.length > 0 && runs.every((r) => isOn(kid(kid(r, 'w:rPr') ?? r, 'w:b')) || /strong/i.test(W(kid(kid(r, 'w:rPr') ?? r, 'w:rStyle'), 'val') ?? ''))
      const big = runs.length > 0 && runs.every((r) => Number(W(kid(kid(r, 'w:rPr') ?? r, 'w:sz'), 'val') ?? 0) >= 28)
      if (bold || big) f.fakeHeadings.push(txt.trim())
    }
  }
  flush()
  const last = kid(body, 'w:sectPr')
  if (last) f.sections.push(readSect(last))

  // ---------- header dan footer
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(header|footer)\d*\.xml$/.test(name)) continue
    const x = parseXml((await read(name))!)
    const root = x.documentElement as unknown as Element
    const ins = instrOf(root)
    const hasText = all(root, 'w:t').some((t) => (t.textContent ?? '').trim()) || /\bPAGE\b/.test(ins)
    if (name.includes('header') && hasText) f.headerText = true
    if (/\bPAGE\b/.test(ins)) f.footerPage = f.footerPage || name.includes('footer') || name.includes('header')
    if (/\bNUMPAGES\b|\bSECTIONPAGES\b/.test(ins)) f.numPages = true
  }
  return f
}

function readSect(s: Element): Section {
  const sz = kid(s, 'w:pgSz')
  const mar = kid(s, 'w:pgMar')
  const pg = kid(s, 'w:pgNumType')
  const cols = kid(s, 'w:cols')
  const w = Number(W(sz, 'w') ?? 11906)
  const h = Number(W(sz, 'h') ?? 16838)
  const cm = (v: string | undefined) => Math.round((Number(v ?? 1440) / CM) * 100) / 100
  return {
    landscape: W(sz, 'orient') === 'landscape' || w > h,
    w: Math.round((w / CM) * 10) / 10,
    h: Math.round((h / CM) * 10) / 10,
    margin: { top: cm(W(mar, 'top')), right: cm(W(mar, 'right')), bottom: cm(W(mar, 'bottom')), left: cm(W(mar, 'left')) },
    pgFmt: W(pg, 'fmt'),
    pgStart: num(W(pg, 'start')),
    cols: Number(W(cols, 'num') ?? 1),
  }
}

function isOn(b: Element | undefined): boolean {
  if (!b) return false
  const v = W(b, 'val')
  return v === undefined || (v !== '0' && v !== 'false')
}

function closest(el: Element, tag: string): Element | null {
  for (let p = el.parentNode as Element | null; p; p = p.parentNode as Element | null) if (p.nodeType === 1 && p.tagName === tag) return p
  return null
}

/** Ukuran kertas bernama, untuk ditampilkan. */
export function paperName(s: Section): string {
  const [a, b] = [Math.min(s.w, s.h), Math.max(s.w, s.h)]
  if (Math.abs(a - 21) < 0.3 && Math.abs(b - 29.7) < 0.3) return 'A4'
  if (Math.abs(a - 21.6) < 0.3 && Math.abs(b - 27.9) < 0.3) return 'Letter'
  if (Math.abs(a - 21.6) < 0.3 && Math.abs(b - 33) < 0.4) return 'F4/Folio'
  return `${a} x ${b} cm`
}

/** Peringatan umum yang berlaku untuk semua dokumen. */
export function hygiene(f: DocxFacts): { level: 'bad' | 'warn'; msg: string; detail?: string[] }[] {
  const out: { level: 'bad' | 'warn'; msg: string; detail?: string[] }[] = []
  if (f.fakeHeadings.length)
    out.push({ level: 'bad', msg: `${f.fakeHeadings.length} paragraf terlihat seperti judul tapi tidak memakai style Heading. Pilih paragrafnya, lalu klik Heading 1/2 di Home > Styles.`, detail: f.fakeHeadings.slice(0, 6) })
  if (f.emptyStreaks)
    out.push({ level: 'bad', msg: `Ada ${f.emptyStreaks} tempat yang memakai Enter berkali-kali (paling banyak ${f.emptyStreakMax} baris kosong). Untuk pindah halaman pakai Ctrl+Enter, untuk jarak pakai Spacing Before/After.` })
  if (f.manualList.length)
    out.push({ level: 'warn', msg: `${f.manualList.length} paragraf diawali nomor atau tanda yang diketik manual. Pakai tombol Numbering/Bullets supaya nomornya otomatis.`, detail: f.manualList.slice(0, 5) })
  if (f.spaceRuns.length) out.push({ level: 'warn', msg: `${f.spaceRuns.length} paragraf memakai spasi berderet untuk merapikan posisi. Pakai Tab dan tab stop.`, detail: f.spaceRuns.slice(0, 5) })
  if (f.headingTexts.length >= 5 && !f.toc) out.push({ level: 'warn', msg: 'Dokumen punya heading tapi belum ada daftar isi otomatis (References > Table of Contents).' })
  return out
}
