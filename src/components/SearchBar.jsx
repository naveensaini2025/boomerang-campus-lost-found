import { Search, X } from 'lucide-react'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <Search
        size={17}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="black wallet near library..."
        aria-label="Search lost and found items"
        className="w-full rounded-full border border-white/60 bg-white py-3 pl-11 pr-10 text-sm font-medium text-ink shadow-lg shadow-navy/20 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-amber"
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500"
        >
          <X size={13} />
        </button>
      ) : null}
    </div>
  )
}
