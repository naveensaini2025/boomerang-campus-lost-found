/**
 * Explainable local matching — no API key, no model, no magic.
 *
 * scoreMatch(lostItem, foundItem) -> 0..100
 *   40 pts  word-overlap (Jaccard) of title + description
 *   20 pts  same category
 *   15 pts  same colour
 *   10 pts  same brand
 *   15 pts  similar location + posted within 48 hours
 */
import { MATCH_THRESHOLD } from '../lib/config'

const STOP_WORDS = new Set([
  'a','an','the','my','i','me','we','you','your','is','are','was','were','be','been','being',
  'in','on','at','of','to','and','or','for','with','it','this','that','these','those','has',
  'have','had','do','did','some','any','from','by','as','so','but','if','then','there','here',
])

const pick = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)

/** Unique meaningful words from a piece of text. */
export function textTokens(text = '') {
  return new Set(pick(text).filter((word) => word.length > 1 && !STOP_WORDS.has(word)))
}

/** Jaccard similarity: shared words / all words (0..1). */
export function similarity(a = '', b = '') {
  const setA = textTokens(a)
  const setB = textTokens(b)
  if (setA.size === 0 || setB.size === 0) return 0
  let shared = 0
  setA.forEach((word) => {
    if (setB.has(word)) shared += 1
  })
  const union = setA.size + setB.size - shared
  return union === 0 ? 0 : shared / union
}

function hoursBetween(a, b) {
  const first = new Date(a).getTime()
  const second = new Date(b).getTime()
  if (Number.isNaN(first) || Number.isNaN(second)) return Infinity
  return Math.abs(first - second) / (60 * 60 * 1000)
}

/**
 * Pure scoring function. Only compares a LOST item with a FOUND item.
 * Returns 0 for same-type pairs.
 */
export function scoreMatch(lostItem, foundItem) {
  if (!lostItem || !foundItem) return 0
  if (lostItem.type === foundItem.type) return 0

  // Keep arguments in the documented lost -> found order.
  const lost = lostItem.type === 'lost' ? lostItem : foundItem
  const found = lostItem.type === 'lost' ? foundItem : lostItem

  // 1) Text similarity (40)
  const textScore = similarity(
    `${lost.title} ${lost.description}`,
    `${found.title} ${found.description}`,
  )
  let score = textScore * 40

  // 2) Same category (20)
  if (lost.category && lost.category === found.category) score += 20

  // 3) Same colour (15)
  if (lost.color && lost.color === found.color) score += 15

  // 4) Same brand (10)
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) score += 10

  // 5) Location similarity, only fully rewarded inside the 48-hour window (15)
  const locationScore = similarity(lost.location, found.location)
  if (hoursBetween(lost.createdAt, found.createdAt) <= 48) {
    score += locationScore * 15
  } else {
    score += locationScore * 5
  }

  return Math.min(100, Math.round(score))
}

/** Compare only opposite types that are still open. */
export function isMatchable(item, other) {
  return (
    item && other &&
    item.id !== other.id &&
    item.type !== other.type &&
    ['listed', 'matched'].includes(item.status) &&
    ['listed', 'matched'].includes(other.status)
  )
}

/** Top matches (default 3), highest score first. These are suggestions, not decisions. */
export function findMatches(item, items, limit = 3) {
  if (!item) return []
  return items
    .filter((other) => isMatchable(item, other))
    .map((other) => ({ itemId: other.id, score: scoreMatch(item, other) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Best score only counts as a confident match when it clears the 70% threshold. */
export function bestScore(item, items) {
  const top = findMatches(item, items, 1)[0]?.score ?? 0
  return top >= MATCH_THRESHOLD ? top : 0
}
