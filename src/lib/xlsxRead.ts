import JSZip from 'jszip'
import { all, kid, parseXml, text } from './xml'
import type { Cell } from '../data/ds'

// Pembaca .xlsx minimal. Kita baca XML-nya langsung supaya dapat dua hal sekaligus:
// teks rumus (<f>) dan nilai hasil terakhir yang disimpan Excel (<v>, "cached value").

export interface XCell {
  /** Nilai cache. undefined = tidak ada <v> (rumus belum pernah dihitung Excel). */
  v: Cell | undefined
  /** Teks rumus mentah dari file (tanpa "="), bila ada. */
  f?: string
  isError?: boolean
}

export interface XBook {
  sheets: Map<string, Map<string, XCell>>
  names: { name: string; ref: string }[]
  tables: { name: string; ref: string }[]
}

export async function readXlsx(data: ArrayBuffer | Uint8Array): Promise<XBook> {
  const zip = await JSZip.loadAsync(data)
  const read = async (p: string) => {
    const f = zip.file(p)
    return f ? f.async('string') : null
  }

  const wbXml = await read('xl/workbook.xml')
  if (!wbXml) throw new Error('Ini bukan file .xlsx yang valid (xl/workbook.xml tidak ditemukan).')
  const wb = parseXml(wbXml)
  const rels = parseXml((await read('xl/_rels/workbook.xml.rels')) ?? '<Relationships/>')
  const relTarget = new Map(all(rels, 'Relationship').map((r) => [r.getAttribute('Id')!, r.getAttribute('Target')!]))

  const sst: string[] = []
  const sstXml = await read('xl/sharedStrings.xml')
  if (sstXml) {
    for (const si of all(parseXml(sstXml), 'si')) sst.push(all(si, 't').map(text).join(''))
  }

  const names = all(wb, 'definedName').map((d) => ({ name: d.getAttribute('name') ?? '', ref: text(d) }))

  const sheets = new Map<string, Map<string, XCell>>()
  for (const s of all(wb, 'sheet')) {
    const name = s.getAttribute('name')!
    const rid = s.getAttribute('r:id') ?? s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')!
    let target = relTarget.get(rid) ?? ''
    target = target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.\//, '')
    const xml = await read(target)
    if (!xml) continue
    sheets.set(name, parseSheet(parseXml(xml), sst))
  }

  const tables: XBook['tables'] = []
  for (const p of Object.keys(zip.files)) {
    if (/^xl\/tables\/[^/]+\.xml$/.test(p)) {
      const t = parseXml((await read(p))!).documentElement
      tables.push({ name: t.getAttribute('displayName') ?? t.getAttribute('name') ?? '', ref: t.getAttribute('ref') ?? '' })
    }
  }
  return { sheets, names, tables }
}

function parseSheet(doc: Document, sst: string[]): Map<string, XCell> {
  const cells = new Map<string, XCell>()
  const shared = new Map<string, string>()
  for (const c of all(doc, 'c')) {
    const r = c.getAttribute('r')
    if (!r) continue
    const t = c.getAttribute('t') ?? 'n'
    const fEl = kid(c, 'f')
    const vEl = kid(c, 'v')
    let f: string | undefined
    if (fEl) {
      const ft = text(fEl)
      const si = fEl.getAttribute('si')
      if (fEl.getAttribute('t') === 'shared' && si !== null) {
        // Rumus shared: teks hanya ada di sel induk. Nama fungsinya sama, jadi cukup untuk pengecekan.
        if (ft) shared.set(si, ft)
        f = ft || shared.get(si)
      } else f = ft
    }
    let v: Cell | undefined
    let isError = false
    if (t === 'inlineStr') {
      const is = kid(c, 'is')
      v = is ? all(is, 't').map(text).join('') : ''
    } else if (vEl) {
      const raw = text(vEl)
      if (t === 's') v = sst[Number(raw)] ?? ''
      else if (t === 'str') v = raw
      else if (t === 'b') v = raw === '1'
      else if (t === 'e') {
        v = raw
        isError = true
      } else v = raw === '' ? null : Number(raw)
    } else if (t === 'str' && fEl) {
      // Rumus teks yang hasilnya string kosong kadang disimpan tanpa <v>.
      v = undefined
    }
    if (f === undefined && v === undefined) continue
    cells.set(r.toUpperCase(), { v, f, isError })
  }
  return cells
}

/** Ambil sel dengan referensi "Sheet!A1" atau ("Sheet", "A1"). */
export function getCell(book: XBook, sheet: string, addr: string): XCell | undefined {
  return book.sheets.get(sheet)?.get(addr.replace(/\$/g, '').toUpperCase())
}
