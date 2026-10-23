import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, SearchX, Sparkles } from 'lucide-react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import FilterChips from '../components/FilterChips'
import ItemCard from '../components/ItemCard'
import { storage } from '../services/storage'
import { getItems, getUserBestMatch } from '../services/itemService'

export default function Home() {
  const navigate = useNavigate()
  const user = storage.getUser()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const items = useMemo(() => getItems().filter((item) => item.status !== 'returned'), [])
  const banner = useMemo(() => (user ? getUserBestMatch(user.id) : null), [user])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items
      .filter((item) => filter === 'all' || item.type === filter)
      .filter((item) => {
        if (!needle) return true
        return `${item.title} ${item.description} ${item.location} ${item.category} ${item.color}`
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [items, filter, query])

  const clear = () => {
    setQuery('')
    setFilter('all')
  }

  return (
    <div className="min-h-full pb-8">
      <Header user={user}>
        <SearchBar value={query} onChange={setQuery} />
        <FilterChips active={filter} onChange={setFilter} />
      </Header>

      <div className="px-4 pt-4">
        {banner ? (
          <button
            onClick={() => navigate(`/item/${banner.item.id}`)}
            className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber/30 bg-[#FFF8E1] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card active:scale-[0.99]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-white">
              <Sparkles size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#A87A06]">
                Good news
              </span>
              <span className="mt-0.5 block text-xs font-bold leading-snug text-ink">
                We found a {banner.score}% match for your {banner.item.title}
              </span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-[#A87A06]" />
          </button>
        ) : (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-purple/10 bg-white/70 px-3 py-2.5">
            <span className="text-base">💡</span>
            <p className="text-[11px] font-medium leading-snug text-slate-500">
              Lost something? Tap the <b className="text-navy">+</b> button — it takes 30 seconds.
            </p>
          </div>
        )}

        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold tracking-tight text-ink">Around campus</h2>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500 shadow-sm">
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {filtered.length ? (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="card mt-3 flex flex-col items-center px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EEF1FA] text-slate-400">
              <SearchX size={26} />
            </span>
            <p className="mt-3 text-sm font-extrabold text-ink">No items here yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Try a different filter, or post the item yourself so campus can help.
            </p>
            <button onClick={clear} className="btn-ghost mt-4 px-4 py-2 text-xs">
              Clear filters
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[10px] font-medium leading-relaxed text-slate-400">
          🔒 Phone numbers and roll numbers are hidden automatically.
          <br />
          Matches are suggestions — you decide.
        </p>
      </div>
    </div>
  )
}
