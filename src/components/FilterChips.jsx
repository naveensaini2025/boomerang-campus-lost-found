import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CHIPS = [
  { id: 'all', label: 'All', active: 'bg-navy text-white shadow-md shadow-navy/30', idle: 'bg-white/15 text-white/80' },
  { id: 'lost', label: 'Lost', active: 'bg-[#FFE7DC] text-lost', idle: 'bg-[#FFE7DC]/95 text-lost' },
  { id: 'found', label: 'Found', active: 'bg-[#DDF6ED] text-found', idle: 'bg-[#DDF6ED]/95 text-found' },
]

export default function FilterChips({ active, onChange }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
      {CHIPS.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChange(chip.id)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${
            active === chip.id ? chip.active : chip.idle
          } ${active === chip.id && chip.id === 'all' ? 'ring-2 ring-white/30' : ''}`}
        >
          {chip.label}
        </button>
      ))}
      <button
        onClick={() => navigate('/map')}
        className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF3CD] px-3.5 py-1.5 text-xs font-bold text-[#A87A06] transition active:scale-95"
      >
        <MapPin size={12} strokeWidth={2.6} /> Map
      </button>
    </div>
  )
}
