// One place for all demo-tunable constants.
export const COLLEGE = {
  name: 'GL Bajaj Institute, Mathura',
  lat: 27.6,
  lng: 77.6,
  zoom: 15,
}

export const HELP_DESK = 'College Help Desk (Main Building)'
export const MATCH_THRESHOLD = 70
export const MAX_PENDING_CLAIMS = 3
export const KARMA_PER_RETURN = 10

export const CATEGORIES = [
  'ID Card',
  'Wallet',
  'Electronics',
  'Phone',
  'Bottle',
  'Calculator',
  'Keys',
  'Umbrella',
  'Stationery',
  'Bag',
  'Eyewear',
  'Other',
]

// Emoji + soft tint used for photo-less thumbnails.
export const CATEGORY_META = {
  'ID Card': { emoji: '🪪', tint: '#E7ECFF' },
  Wallet: { emoji: '👛', tint: '#FFF1DF' },
  Electronics: { emoji: '🎧', tint: '#E6F0FF' },
  Phone: { emoji: '📱', tint: '#EDE8FF' },
  Bottle: { emoji: '🧴', tint: '#E4F7F0' },
  Calculator: { emoji: '🧮', tint: '#FFF6D8' },
  Keys: { emoji: '🔑', tint: '#FDE8E4' },
  Umbrella: { emoji: '🌂', tint: '#EFE9FF' },
  Stationery: { emoji: '📓', tint: '#E9F8E5' },
  Bag: { emoji: '🎒', tint: '#FDE8EC' },
  Eyewear: { emoji: '👓', tint: '#E8EEF7' },
  Other: { emoji: '📦', tint: '#EEF1F8' },
}

export const STATUS_LABELS = ['LOST', 'LISTED', 'MATCHED', 'CLAIMED', 'RETURNED']

export function categoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.Other
}

// "Canteen, 2:10 PM" — seed items carry a friendly timeLabel.
export function formatWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Recently'
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`
  return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}, ${time}`
}

export function itemMeta(item) {
  const when = item.timeLabel || formatWhen(item.dateTime || item.createdAt)
  return `${item.location}, ${when}`
}
