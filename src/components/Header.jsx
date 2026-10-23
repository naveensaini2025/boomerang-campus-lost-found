import { ArrowLeft, Undo2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** Deep blue → purple app header. Home uses the logo row + children (search/chips). */
export default function Header({ user, title, back = false, children }) {
  const navigate = useNavigate()
  const initials = user?.initials || 'BO'

  return (
    <header className="hero-gradient relative overflow-hidden px-5 pb-5 pt-5 text-white lg:px-8 lg:pb-6 lg:pt-6">
      {/* soft decorative glow */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-amber/20 blur-2xl" />

      <div className="relative flex items-center gap-3">
        {back ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 shadow-inner">
            <Undo2 size={20} className="text-amber" strokeWidth={2.6} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {back ? (
            <h1 className="truncate text-lg font-extrabold leading-tight">{title}</h1>
          ) : (
            <>
              <h1 className="text-[22px] font-black leading-none tracking-tight">Boomerang</h1>
              <p className="mt-1 text-[10px] font-medium tracking-wide text-white/70">
                what you lose comes back
              </p>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/my-items')}
          aria-label="My profile"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber text-xs font-black text-white shadow-lg shadow-black/20 ring-2 ring-white/25 transition active:scale-95"
        >
          {initials}
        </button>
      </div>

      {children ? <div className="relative mt-4 space-y-3 lg:mt-5 lg:max-w-2xl">{children}</div> : null}
    </header>
  )
}
