import { useSyncExternalStore } from 'react'
import type { Status } from './grader'

// Progres disimpan di localStorage. Semua akses dibungkus try/catch karena storage bisa
// diblokir (mode privat, file:// di beberapa browser). Kalau gagal, progres hanya hidup di memori.

const KEY = 'iflab-prep:v1'
export const PASS = 80

export interface ReviewItem {
  /** "quiz:q1-4" atau "excel:L1-07" */
  id: string
  level: number
  label: string
  box: number
  due: number
}

export interface State {
  quiz: Record<number, { best: number; last: number; attempts: number }>
  excel: Record<string, { status: Status; at: number }>
  revealed: Record<string, boolean>
  history: { at: number; kind: 'kuis' | 'excel' | 'manual'; level: number; score: number; total: number }[]
  review: Record<string, ReviewItem>
  plan: Record<string, boolean>
  /** Topik materi yang sudah ditandai paham, kunci "level:conceptId". */
  read: Record<string, boolean>
  /** Hasil pemeriksa .docx terbaik per target, dalam persen. */
  word: Record<string, number>
  /** Skor penilaian mandiri brief desain, dalam persen. */
  design: Record<string, number>
  sim: { at: number; score: number; total: number; parts: Record<string, [number, number]> }[]
  unlockAll: boolean
}

const empty: State = { quiz: {}, excel: {}, revealed: {}, history: [], review: {}, plan: {}, read: {}, word: {}, design: {}, sim: [], unlockAll: false }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty, ...JSON.parse(raw) }
  } catch {
    /* storage tidak tersedia */
  }
  return empty
}

let state: State = load()
const subs = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* abaikan */
  }
  subs.forEach((f) => f())
}

export function update(fn: (s: State) => State) {
  commit(fn(state))
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => sel(state),
  )
}

export const getState = () => state

export function isUnlocked(s: State, n: number): boolean {
  if (s.unlockAll || n === 0) return true
  return (s.quiz[n - 1]?.best ?? 0) >= PASS
}

// ---------- spaced repetition sederhana (sistem kotak Leitner) ----------
// Kotak 1: ulang hari ini. Naik kotak tiap kali benar: +1 hari, +2 hari, +4 hari, lalu lulus.
const DAY = 86400000
const INTERVAL = [0, 0, DAY, 2 * DAY, 4 * DAY]

export function markWrong(s: State, item: Omit<ReviewItem, 'box' | 'due'>): State {
  return { ...s, review: { ...s.review, [item.id]: { ...item, box: 1, due: Date.now() } } }
}

export function markRight(s: State, id: string): State {
  const it = s.review[id]
  if (!it) return s
  const box = it.box + 1
  const review = { ...s.review }
  if (box >= INTERVAL.length) delete review[id]
  else review[id] = { ...it, box, due: Date.now() + INTERVAL[box] }
  return { ...s, review }
}

export function resetProgress() {
  commit({ ...empty, plan: state.plan })
}
