import { useEffect, useState, type ReactNode } from 'react'
import { LEVELS } from './content/levels'
import { href, useRoute } from './lib/router'
import { PASS, isUnlocked, update, useStore } from './lib/store'
import { Home } from './pages/Home'
import { LevelPage } from './pages/LevelPage'
import { Plan } from './pages/Plan'
import { Review } from './pages/Review'
import { Simulasi } from './pages/Simulasi'
import { Cheatsheet } from './pages/Cheatsheet'
import { Rapor } from './pages/Rapor'
import { Icon, cx } from './components/ui'

export default function App() {
  const route = useRoute()
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    setMenu(false)
    if (route[0] !== 'level' || !route[3]) window.scrollTo({ top: 0 })
  }, [route.join('/')]) // eslint-disable-line react-hooks/exhaustive-deps

  let page: ReactNode
  if (route[0] === 'level') page = <LevelPage n={Number(route[1])} tab={route[2]} focus={route[3]} />
  else if (route[0] === 'rencana') page = <Plan />
  else if (route[0] === 'ulang') page = <Review />
  else if (route[0] === 'cheatsheet') page = <Cheatsheet />
  else if (route[0] === 'simulasi') page = <Simulasi />
  else if (route[0] === 'rapor') page = <Rapor />
  else page = <Home />

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Brand />
        <button onClick={() => setMenu((m) => !m)} className="rounded-md p-2 hover:bg-sunken" aria-label="Menu" aria-expanded={menu}>
          <Icon name={menu ? 'x' : 'menu'} className="size-5" />
        </button>
      </header>
      <aside
        className={cx(
          'no-print fixed inset-x-0 top-[53px] bottom-0 z-20 overflow-y-auto border-r border-line bg-bg px-4 py-5 lg:sticky lg:top-0 lg:block lg:h-screen',
          menu ? 'block' : 'hidden',
        )}
      >
        <div className="mb-6 hidden lg:block">
          <Brand />
        </div>
        <Nav route={route} />
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-4xl">{page}</div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <a href="#/" className="flex items-center gap-2.5">
      <span className="grid grid-cols-3 grid-rows-3 gap-px rounded-sm bg-line p-px" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={cx('size-2', i === 4 ? 'bg-mark' : 'bg-surface')} />
        ))}
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-extrabold tracking-tight">Lembar Kerja Aslab</span>
        <span className="block text-[11px] text-muted">Tes MS Office &amp; Design IFLAB</span>
      </span>
    </a>
  )
}

function Nav({ route }: { route: string[] }) {
  const s = useStore((x) => x)
  const due = Object.values(s.review).filter((r) => r.due <= Date.now()).length
  const at = route.join('/')
  const item = (to: string, label: ReactNode, active: boolean, extra?: ReactNode) => (
    <a href={to} className={cx('flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm', active ? 'bg-ink font-semibold text-bg' : 'hover:bg-sunken')}>
      <span className="flex-1">{label}</span>
      {extra}
    </a>
  )
  return (
    <nav className="space-y-6 text-sm">
      <div className="space-y-0.5">
        {item('#/', 'Beranda', at === '')}
        {item(href('rencana'), 'Rencana 5 hari', at === 'rencana')}
        {item(href('ulang'), 'Ulang soal salah', at === 'ulang', due ? <span className="rounded bg-bad px-1.5 text-[11px] font-bold text-white">{due}</span> : null)}
        {item(href('rapor'), 'Rapor belajar', at === 'rapor')}
      </div>
      <div>
        <div className="mb-1.5 px-2.5 text-[11px] font-bold tracking-wider text-muted uppercase">Level</div>
        <div className="space-y-0.5">
          {LEVELS.map((l) => {
            const open = isUnlocked(s, l.n)
            const best = s.quiz[l.n]?.best
            return (
              <a
                key={l.n}
                href={href('level', l.n)}
                className={cx('flex items-center gap-2.5 rounded-md px-2.5 py-1.5', route[0] === 'level' && Number(route[1]) === l.n ? 'bg-ink text-bg' : 'hover:bg-sunken', !open && 'opacity-55')}
              >
                <span className="mono w-4 text-xs">{l.n}</span>
                <span className="flex-1 truncate">{l.title}</span>
                {best !== undefined && best >= PASS ? (
                  <Icon name="check" className="size-3.5 text-ok" />
                ) : !open ? (
                  <Icon name="lock" className="size-3.5" />
                ) : null}
              </a>
            )
          })}
        </div>
      </div>
      <div className="space-y-0.5">
        {item(href('cheatsheet'), 'Cheat sheet', at === 'cheatsheet')}
        {item(href('simulasi'), 'Simulasi tes', at === 'simulasi')}
      </div>
      <div className="space-y-3 border-t border-line pt-4">
        <label className="flex items-center justify-between gap-2 px-2.5">
          <span>
            Buka semua level
            <span className="block text-[11px] text-muted">mode review</span>
          </span>
          <input type="checkbox" checked={s.unlockAll} onChange={(e) => update((x) => ({ ...x, unlockAll: e.target.checked }))} className="size-4 accent-[var(--accent)]" />
        </label>
        <ThemeToggle />
      </div>
    </nav>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  return (
    <button
      onClick={() => {
        const d = !dark
        setDark(d)
        document.documentElement.classList.toggle('dark', d)
        try {
          localStorage.setItem('iflab-theme', d ? 'dark' : 'light')
        } catch {
          /* abaikan */
        }
      }}
      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-sunken"
    >
      <Icon name={dark ? 'sun' : 'moon'} />
      {dark ? 'Mode terang' : 'Mode gelap'}
    </button>
  )
}
