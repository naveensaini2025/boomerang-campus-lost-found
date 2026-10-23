import { Sparkles } from 'lucide-react'

/**
 * The tilted success badge.
 * variant="match"    → yellow "92% MATCH"
 * variant="returned" → green "RETURNED ✓"
 * variant="score"    → bigger celebration version used after reporting.
 */
export default function MatchBadge({ score, variant = 'match', className = '' }) {
  if (variant === 'returned') {
    return (
      <div
        className={`inline-flex -rotate-6 items-center gap-1.5 rounded-xl border-2 border-white/70 bg-found px-3 py-2 text-white shadow-float ${className}`}
      >
        <span className="text-[11px] font-black tracking-wider">RETURNED ✓</span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex -rotate-6 items-center gap-1.5 rounded-xl border-2 border-white/80 bg-amber text-navy shadow-float ${
        variant === 'score' ? 'px-4 py-3' : 'px-3 py-2'
      } ${className}`}
    >
      <Sparkles size={variant === 'score' ? 18 : 13} strokeWidth={2.8} />
      <span className={`font-black tracking-wide ${variant === 'score' ? 'text-lg' : 'text-[11px]'}`}>
        {score}% MATCH
      </span>
    </div>
  )
}
