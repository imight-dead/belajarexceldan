import { useSyncExternalStore } from 'react'

// Hash router kecil supaya jalan di hosting statis mana pun tanpa konfigurasi rewrite.
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean)
}

export const href = (...parts: (string | number)[]) => '#/' + parts.join('/')

export function go(...parts: (string | number)[]) {
  window.location.hash = href(...parts)
}
