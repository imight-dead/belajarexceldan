// Utilitas teks rumus: normalisasi dari format file, ekstraksi nama fungsi, dan token untuk highlight.

/**
 * Di file .xlsx, fungsi baru disimpan dengan awalan, mis. `_xlfn.XLOOKUP(`, `_xlfn._xlws.FILTER(`,
 * parameter LAMBDA `_xlpm.x`, dan operator `A1#` menjadi `_xlfn.ANCHORARRAY(A1)`.
 */
export function normalizeFormula(f: string): string {
  let s = f.trim()
  if (s.startsWith('=')) s = s.slice(1)
  s = s.replace(/_xlfn\.ANCHORARRAY\(([^()]+)\)/gi, '$1#')
  s = s.replace(/_xlfn\.SINGLE\(/gi, '@(')
  s = s.replace(/_xl(fn|ws|pm|eta|udf)\./gi, '')
  return '=' + s
}

/** Hapus isi string literal "..." dan nama sheet '...' supaya tidak terbaca sebagai fungsi. */
function stripLiterals(f: string): string {
  return f.replace(/"(?:[^"]|"")*"/g, '""').replace(/'(?:[^']|'')*'!/g, "''!")
}

/** Daftar nama fungsi (huruf besar) yang dipanggil di rumus. */
export function functionsIn(formula: string): Set<string> {
  const s = stripLiterals(normalizeFormula(formula))
  const out = new Set<string>()
  for (const m of s.matchAll(/([A-Za-z_][A-Za-z0-9_.]*)\s*\(/g)) out.add(m[1].toUpperCase())
  return out
}

export function containsText(formula: string, needle: string): boolean {
  return normalizeFormula(formula).toUpperCase().replace(/\s+/g, '').includes(needle.toUpperCase().replace(/\s+/g, ''))
}

/** Normalisasi untuk membandingkan jawaban isian berupa rumus. */
export function canonFormula(f: string): string {
  let s = f.trim().replace(/;/g, ',').replace(/\s+/g, '').toUpperCase()
  if (!s.startsWith('=')) s = '=' + s
  return s
}

export type TokKind = 'fn' | 'ref' | 'str' | 'num' | 'op' | 'paren' | 'name' | 'bool' | 'err' | 'ws' | 'sep'
export interface Tok {
  k: TokKind
  t: string
}

const RE = new RegExp(
  [
    '(?<ws>\\s+)',
    '(?<str>"(?:[^"]|"")*")',
    "(?<ref>(?:(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!)?\\$?[A-Za-z]{1,3}\\$?\\d+(?::\\$?[A-Za-z]{1,3}\\$?\\d+)?#?(?![A-Za-z0-9_(])|(?:(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!)?\\$?[A-Za-z]{1,3}:\\$?[A-Za-z]{1,3}|(?:(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!)?\\$?\\d+:\\$?\\d+)",
    '(?<err>#(?:N\\/A|REF!|SPILL!|NAME\\?|CALC!|VALUE!|DIV\\/0!|NUM!|NULL!))',
    '(?<fn>[A-Za-z_][A-Za-z0-9_.]*(?=\\())',
    '(?<bool>\\b(?:TRUE|FALSE)\\b)',
    '(?<table>[A-Za-z_][A-Za-z0-9_.]*\\[[^\\]]*\\])',
    '(?<name>[A-Za-z_][A-Za-z0-9_.]*)',
    '(?<num>\\d+(?:\\.\\d+)?%?)',
    '(?<paren>[(){}])',
    '(?<sep>[,;])',
    '(?<op>[-+*/^&=<>:@#!%]+)',
    '(?<other>.)',
  ].join('|'),
  'gy',
)

export function tokenize(f: string): Tok[] {
  const out: Tok[] = []
  RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE.exec(f))) {
    const g = m.groups!
    const k = (Object.keys(g).find((key) => g[key] !== undefined) ?? 'other') as string
    const kind: TokKind = k === 'table' ? 'ref' : k === 'other' ? 'op' : (k as TokKind)
    out.push({ k: kind, t: m[0] })
    if (m[0].length === 0) RE.lastIndex++
  }
  return out
}
