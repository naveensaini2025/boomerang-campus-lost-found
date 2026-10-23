import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import Header from '../components/Header'
import { useToast } from '../components/Toast'
import { storage } from '../services/storage'
import {
  badgesFor,
  getClaimsByUser,
  getItems,
  getKarma,
  resetDemo,
} from '../services/itemService'
import { categoryMeta, itemMeta } from '../lib/config'

const CLAIM_TONE = {
  pending: 'bg-[#FFF3CD] text-[#8A6A0A]',
  approved: 'bg-[#DFF6EE] text-found',
  rejected: 'bg-[#FDE7DF] text-lost',
}

const STATUS_TONE = {
  listed: 'bg-[#EEF1FA] text-slate-500',
  matched: 'bg-[#FFF0C2] text-[#946B00]',
  claimed: 'bg-[#EFE9FF] text-ai',
  returned: 'bg-[#DFF6EE] text-found',
}

export default function MyItems() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = storage.getUser()
  const [tab, setTab] = useState('posts')
  const [version, setVersion] = useState(0)

  const items = useMemo(() => getItems(), [version])
  const myPosts = useMemo(
    () => items.filter((item) => item.ownerId === user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [items, user.id],
  )
  const myClaims = useMemo(() => getClaimsByUser(user.id), [user.id, version])
  const karma = useMemo(() => getKarma(user.id), [user.id, version])
  const badges = badgesFor(karma)

  const reset = () => {
    if (!window.confirm('Reset all demo items, claims and karma? You stay logged in.')) return
    resetDemo()
    setVersion((value) => value + 1)
    toast('Demo data reset — fresh campus!', 'found')
    navigate('/')
  }

  const logout = () => {
    storage.clearUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full pb-10">
      <Header user={user} />

      <div className="space-y-3 px-4 pt-4 lg:mx-auto lg:max-w-5xl lg:px-8 lg:pb-12 lg:pt-6">
        <div className="flex items-end justify-between px-1 lg:items-center">
          <div>
            <h1 className="text-xl font-black tracking-tight text-ink lg:text-2xl">My Items</h1>
            <p className="text-[10px] font-medium text-slate-400 lg:text-xs">Your posts, claims and good karma.</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-500 shadow-sm lg:px-3 lg:text-[10px]"
          >
            <LogOut size={11} /> Log out
          </button>
        </div>

        {/* Karma / Good Samaritan card */}
        <div className="card-gradient relative overflow-hidden rounded-2xl p-4 text-white shadow-card">
          <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber text-sm font-black text-white ring-2 ring-white/25">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="mt-0.5 text-[9px] font-medium text-white/60">
                {myPosts.length} post{myPosts.length === 1 ? '' : 's'} · {myClaims.length} claim
                {myClaims.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-[8px] font-bold uppercase tracking-widest text-white/50">
                <Trophy size={9} className="text-amber" /> Karma
              </p>
              <p className="text-2xl font-black leading-tight text-amber">{karma.karma}</p>
            </div>
          </div>

          <div className="relative mt-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                  badge.earned
                    ? 'bg-amber text-navy'
                    : 'bg-white/10 text-white/45'
                }`}
              >
                <span>{badge.emoji}</span>
                {badge.label}
                {badge.earned ? '' : ' · locked'}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold text-white/60">
              🎁 {karma.returns} returned
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-white p-1.5 shadow-card">
          <button
            onClick={() => setTab('posts')}
            className={`rounded-xl py-2 text-[11px] font-extrabold transition ${
              tab === 'posts' ? 'bg-navy text-white shadow-md shadow-navy/20' : 'text-slate-400'
            }`}
          >
            My Posts · {myPosts.length}
          </button>
          <button
            onClick={() => setTab('claims')}
            className={`rounded-xl py-2 text-[11px] font-extrabold transition ${
              tab === 'claims' ? 'bg-navy text-white shadow-md shadow-navy/20' : 'text-slate-400'
            }`}
          >
            My Claims · {myClaims.length}
          </button>
        </div>

        {/* Posts */}
        {tab === 'posts' ? (
          myPosts.length ? (
            <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 xl:grid-cols-3">
              {myPosts.map((item) => {
                const meta = categoryMeta(item.category)
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/item/${item.id}`)}
                    className="card flex w-full items-center gap-2.5 p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-float"
                  >
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-xl"
                      style={{ backgroundColor: meta.tint }}
                    >
                      {item.photo ? (
                        <img src={item.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        meta.emoji
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                      <p className="truncate text-[9px] text-slate-400">{itemMeta(item)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`pill ${STATUS_TONE[item.status]}`}>{item.status}</span>
                      <span
                        className={`pill ${
                          item.type === 'lost' ? 'bg-[#FDE7DF] text-lost' : 'bg-[#DFF6EE] text-found'
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="card px-6 py-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EEF1FA] text-2xl">
                📦
              </div>
              <p className="mt-2 text-sm font-extrabold text-ink">Nothing posted yet</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                Post a lost or found item and let Boomerang do the matching.
              </p>
              <button onClick={() => navigate('/report')} className="btn-amber mx-auto mt-4 w-auto px-5">
                <Sparkles size={14} /> Report an item
              </button>
            </div>
          )
        ) : myClaims.length ? (
          /* Claims */
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0 xl:grid-cols-3">
            {myClaims.map((claim) => {
              const item = items.find((entry) => entry.id === claim.itemId)
              if (!item) return null
              const meta = categoryMeta(item.category)
              return (
                <button
                  key={claim.id}
                  onClick={() => navigate(`/item/${item.id}`)}
                  className="card flex w-full items-center gap-2.5 p-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-float"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-xl"
                    style={{ backgroundColor: meta.tint }}
                  >
                    {item.photo ? (
                      <img src={item.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      meta.emoji
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                    <p className="truncate text-[9px] text-slate-400">
                      Claim on {item.type} item · {itemMeta(item)}
                    </p>
                  </div>
                  <span className={`pill shrink-0 ${CLAIM_TONE[claim.status]}`}>{claim.status}</span>
                </button>
              )
            })}
            <p className="px-1 text-[9px] leading-snug text-slate-400">
              Tap a claim to chat with the finder or owner. Contact details are never shared.
            </p>
          </div>
        ) : (
          <div className="card px-6 py-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EEF1FA] text-2xl">
              🤝
            </div>
            <p className="mt-2 text-sm font-extrabold text-ink">No claims yet</p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Found something that is yours? Open an item and answer the secret question.
            </p>
            <button onClick={() => navigate('/')} className="btn-ghost mx-auto mt-4 w-auto px-5">
              Browse the feed
            </button>
          </div>
        )}

        <button
          onClick={reset}
          className="mx-auto flex items-center gap-1.5 rounded-full border border-[#DDE2F1] bg-white px-3.5 py-2 text-[10px] font-bold text-slate-400 transition hover:text-lost"
        >
          <RotateCcw size={11} /> Reset demo data
        </button>

        <p className="text-center text-[9px] leading-relaxed text-slate-400">
          Boomerang · Hustle Carnival 2026 · Team WU SHANG CLAN
        </p>
      </div>
    </div>
  )
}
