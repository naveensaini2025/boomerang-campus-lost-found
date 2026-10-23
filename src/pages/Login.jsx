import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Sparkles, Undo2, UserRound } from 'lucide-react'
import { storage } from '../services/storage'

function makeUser(name) {
  const clean = name.trim().replace(/\s+/g, ' ')
  const initials = clean
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return {
    id: `u-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: clean,
    initials: initials || 'BO',
    joinedAt: new Date().toISOString(),
  }
}

export default function Login() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // Already logged in? Go straight to the feed.
  if (storage.getUser()) return <Navigate to="/" replace />

  const signIn = (user) => {
    storage.setUser(user)
    navigate('/', { replace: true })
  }

  const submit = (event) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      setError('Please type your name (at least 2 letters).')
      return
    }
    signIn(makeUser(name))
  }

  const demoLogin = () => {
    signIn({
      id: 'u-demo',
      name: 'Campus User',
      initials: 'CU',
      joinedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="hero-gradient relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-10 lg:px-8">
      {/* decorative glows */}
      <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-amber/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative w-full max-w-[370px] lg:max-w-[440px]">
        <div className="mb-7 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.75rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur">
            <Undo2 size={40} className="text-amber" strokeWidth={2.6} />
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white">Boomerang</h1>
          <p className="mt-1 text-sm font-medium text-white/70">what you lose comes back</p>
        </div>

        <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-black/20 lg:p-8">
          <div className="mb-5">
            <span className="pill bg-amber/20 text-[#8A6A0A]">
              <Sparkles size={11} /> Campus lost &amp; found
            </span>
            <h2 className="mt-3 text-xl font-extrabold text-ink">Welcome back 👋</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              No password, no phone number. Just your name and a little campus trust.
            </p>
          </div>

          <label htmlFor="name" className="label">
            Your name
          </label>
          <div className="relative">
            <UserRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              placeholder="Enter your name"
              autoFocus
              autoComplete="name"
              className="field pl-10"
            />
          </div>
          {error ? <p className="mt-2 text-[11px] font-semibold text-lost">{error}</p> : null}

          <button type="submit" className="btn-amber mt-4">
            Continue <ArrowRight size={16} />
          </button>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={demoLogin} className="btn-ghost w-full">
            <Sparkles size={15} className="text-amber" /> Demo login
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-slate-400">
            <ShieldCheck size={12} className="text-found" />
            Contact details stay private. Chat happens in-app.
          </p>
        </form>

        <p className="mt-6 text-center text-[10px] font-medium leading-relaxed text-white/55">
          Hustle Carnival 2026 · GL Bajaj Mathura · Team WU SHANG CLAN
        </p>
      </div>
    </div>
  )
}
