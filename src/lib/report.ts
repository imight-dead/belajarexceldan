import { LEVELS } from '../content/levels'
import type { ExcelQuestion } from '../content/types'
import type { State } from './store'

const qById = new Map<string, { q: ExcelQuestion; level: number }>(LEVELS.flatMap((l) => l.questions.map((q) => [q.id, { q, level: l.n }] as const)))

export interface TopicStat {
  level: number
  topic: string
  right: number
  total: number
  pct: number
  /** soal yang belum benar, untuk ditautkan */
  todo: string[]
}

/** Rangkum hasil workbook per bab. Hanya bab yang sudah pernah dikerjakan. */
export function topicStats(s: State): TopicStat[] {
  const map = new Map<string, TopicStat>()
  for (const [id, r] of Object.entries(s.excel)) {
    const hit = qById.get(id)
    if (!hit) continue
    const key = `${hit.level}:${hit.q.topic}`
    const t = map.get(key) ?? { level: hit.level, topic: hit.q.topic, right: 0, total: 0, pct: 0, todo: [] }
    t.total++
    if (r.status === 'benar') t.right++
    else t.todo.push(id)
    map.set(key, t)
  }
  for (const t of map.values()) t.pct = Math.round((t.right / t.total) * 100)
  return [...map.values()].sort((a, b) => a.pct - b.pct || a.level - b.level)
}

/** Bab yang perlu diulang: akurasi di bawah 70%. */
export const weakTopics = (s: State) => topicStats(s).filter((t) => t.pct < 70)

export const findQuestion = (id: string) => qById.get(id)
