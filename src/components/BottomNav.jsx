import { Home, Plus, UserRound } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

/** Home | floating amber + | My Items */
export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabClass = (path) =>
    `flex w-[72px] flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold transition ${
      pathname === path ? 'text-navy' : 'text-slate-400 hover:text-navy'
    }`

  return (
    <nav className="relative z-30 shrink-0 border-t border-[#E8ECF6] bg-white px-8 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
      <div className="relative flex items-center justify-between">
        <button onClick={() => navigate('/')} className={tabClass('/')} aria-label="Home">
          <Home size={20} strokeWidth={pathname === '/' ? 2.6 : 2} />
          Home
        </button>

        <div className="w-[72px]" />

        <button onClick={() => navigate('/my-items')} className={tabClass('/my-items')} aria-label="My items">
          <UserRound size={20} strokeWidth={pathname === '/my-items' ? 2.6 : 2} />
          My Items
        </button>

        <button
          onClick={() => navigate('/report')}
          aria-label="Report a lost or found item"
          className="absolute left-1/2 top-1/2 grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-[70%] place-items-center rounded-full border-[5px] border-page bg-amber text-navy shadow-float transition hover:rotate-90 hover:scale-105 active:scale-95"
        >
          <Plus size={26} strokeWidth={3} />
        </button>
      </div>
    </nav>
  )
}
