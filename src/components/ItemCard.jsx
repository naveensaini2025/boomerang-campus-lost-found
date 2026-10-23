import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { categoryMeta, itemMeta } from '../lib/config'

/** Feed card: thumbnail + title + "place, time" + status/extra pills. */
export default function ItemCard({ item }) {
  const navigate = useNavigate()
  const meta = categoryMeta(item.category)
  const topScore = item.matches?.[0]?.score || 0

  const extraPill =
    item.type === 'found'
      ? { label: 'Chat to claim', className: 'bg-[#E3F1FF] text-[#2274B8]' }
      : topScore >= 70
        ? { label: `${topScore}% match`, className: 'bg-[#FFF0C2] text-[#946B00]' }
        : item.aiTagged
          ? { label: 'AI tagged', className: 'bg-[#FFF7DD] text-[#8A6A0A]' }
          : null

  return (
    <button
      onClick={() => navigate(`/item/${item.id}`)}
      className="card group flex w-full items-center gap-3 p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-float active:scale-[0.99]"
    >
      <div
        className="grid h-[62px] w-[62px] shrink-0 place-items-center overflow-hidden rounded-2xl text-[30px]"
        style={{ backgroundColor: meta.tint }}
      >
        {item.photo ? (
          <img src={item.photo} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{meta.emoji}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-extrabold leading-snug text-ink">{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{itemMeta(item)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`pill ${
              item.type === 'lost' ? 'bg-[#FDE7DF] text-lost' : 'bg-[#DFF6EE] text-found'
            }`}
          >
            {item.type === 'lost' ? 'LOST' : 'FOUND'}
          </span>
          {extraPill ? <span className={`pill ${extraPill.className}`}>{extraPill.label}</span> : null}
        </div>
      </div>

      <ChevronRight size={16} className="shrink-0 text-slate-300 transition group-hover:text-purple" />
    </button>
  )
}
