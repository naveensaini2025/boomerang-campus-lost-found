import confetti from 'canvas-confetti'
import { storage } from '../services/storage'
import { getUserBestMatch } from '../services/itemService'
import MatchBadge from './MatchBadge'

/**
 * Two tilted success badges that float above the feed.
 * The green one fires a tiny confetti burst when tapped.
 */
export default function FloatingBadges() {
  const user = storage.getUser()
  const best = user ? getUserBestMatch(user.id) : null
  const score = best?.score || 92

  const burst = () =>
    confetti({
      particleCount: 70,
      spread: 65,
      startVelocity: 28,
      origin: { x: 0.72, y: 0.75 },
      colors: ['#F2B01E', '#0F9D74', '#4B2FA0', '#E5572C'],
      disableForReducedMotion: true,
    })

  return (
    <div className="pointer-events-none absolute bottom-[92px] right-1 z-20 flex flex-col items-end gap-2.5 lg:bottom-8 lg:right-8">
      <MatchBadge score={score} className="pointer-events-auto animate-float opacity-95" />
      <button
        onClick={burst}
        aria-label="Celebrate a returned item"
        className="pointer-events-auto animate-floatAlt transition hover:scale-105"
      >
        <MatchBadge variant="returned" />
      </button>
    </div>
  )
}
