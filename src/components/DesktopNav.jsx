import { Home, LogOut, Plus, Undo2, UserRound } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { storage } from '../services/storage'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/report', label: 'Report an item', icon: Plus },
  { to: '/my-items', label: 'My Items', icon: UserRound },
]

/** Persistent sidebar used on desktop only. */
export default function DesktopNav() {
  const navigate = useNavigate()
  const user = storage.getUser()

  const logout = () => {
    storage.clearUser()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="hero-gradient hidden w-[264px] shrink-0 flex-col border-r border-white/10 px-4 py-5 text-white lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 shadow-inner">
          <Undo2 size={23} className="text-amber" strokeWidth={2.6} />
        </div>
        <div>
          <p className="text-xl font-black leading-none tracking-tight">Boomerang</p>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-white/60">
            what you lose comes back
          </p>
        </div>
      </div>

      <nav className="mt-9 space-y-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${
                isActive
                  ? 'bg-white text-navy shadow-lg shadow-black/15'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={2.4} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber text-xs font-black text-navy ring-2 ring-white/20">
              {user?.initials || 'BO'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold">{user?.name || 'Campus member'}</p>
              <p className="mt-0.5 text-[9px] text-white/50">Signed in</p>
            </div>
            <button
              onClick={logout}
              aria-label="Log out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        <p className="px-2 text-[9px] font-medium leading-relaxed text-white/40">
          Hustle Carnival 2026 · GL Bajaj Mathura
          <br />
          Team WU SHANG CLAN
        </p>
      </div>
    </aside>
  )
}
