/**
 * Item, claim, chat and karma logic.
 * Matching is recalculated with the simple scoring function in matchService.
 */
import { storage } from './storage'
import { findMatches } from './matchService'
import { maskSensitive } from '../lib/privacy'
import { seedItems, buildSeedClaims, buildSeedKarma } from '../data/seedItems'
import { KARMA_PER_RETURN, MATCH_THRESHOLD, MAX_PENDING_CLAIMS } from '../lib/config'

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

/** Seed localStorage once, then keep match suggestions fresh. */
export function ensureSeeded(force = false) {
  if (force || !storage.isSeeded()) {
    storage.setItems(seedItems())
    storage.setClaims(buildSeedClaims())
    storage.setKarma(buildSeedKarma())
    storage.markSeeded()
  }
  refreshAllMatches()
}

export function refreshAllMatches() {
  const items = storage.getItems()
  const updated = items.map((item) => {
    if (['claimed', 'returned'].includes(item.status)) return item
    const matches = findMatches(item, items, 3)
    const top = matches[0]?.score || 0
    const status = top >= MATCH_THRESHOLD ? 'matched' : 'listed'
    return { ...item, matches, status }
  })
  storage.setItems(updated)
}

export function getItems() {
  return storage.getItems()
}

export function getItem(id) {
  return storage.getItems().find((item) => item.id === id) || null
}

export function getTopMatches(item) {
  if (!item) return []
  const items = storage.getItems()
  return (item.matches || [])
    .map((match) => ({ ...match, item: items.find((entry) => entry.id === match.itemId) }))
    .filter((match) => match.item)
}

/** The first strong (>=70) match among a user's posts — used for the home banner. */
export function getUserBestMatch(userId) {
  const items = storage.getItems()
  let best = null

  for (const item of items.filter((entry) => entry.ownerId === userId && entry.status !== 'returned')) {
    const top = (item.matches || []).find((match) => match.score >= MATCH_THRESHOLD)
    if (!top) continue
    const other = items.find((entry) => entry.id === top.itemId && entry.status !== 'returned')
    if (!other) continue

    // Highest score wins; on a tie, prefer the freshest match (the newly posted side).
    const fresher =
      !best ||
      top.score > best.score ||
      (top.score === best.score &&
        new Date(other.createdAt || 0) > new Date(best.match.createdAt || 0))

    if (fresher) best = { item, match: other, score: top.score }
  }

  return best
}

export function createItem(data, user) {
  const item = {
    ...data,
    id: uid('itm'),
    title: maskSensitive(data.title).trim(),
    description: maskSensitive(data.description || '').trim(),
    ownerId: user.id,
    ownerName: user.name,
    status: 'listed',
    createdAt: new Date().toISOString(),
    photo: data.photo || null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    matches: [],
  }
  storage.setItems([item, ...storage.getItems()])
  refreshAllMatches()
  return getItem(item.id)
}

export function updateItem(id, patch) {
  const items = storage.getItems().map((item) => (item.id === id ? { ...item, ...patch } : item))
  storage.setItems(items)
  return items.find((item) => item.id === id)
}

/* --------------------------- claims & chat --------------------------- */

export const getClaims = () => storage.getClaims()

export function getClaimsForItem(itemId) {
  return storage.getClaims().filter((claim) => claim.itemId === itemId)
}

export function getClaimsByUser(userId) {
  return storage.getClaims().filter((claim) => claim.claimantId === userId)
}

export function getMyClaim(itemId, userId) {
  return storage
    .getClaims()
    .find((claim) => claim.itemId === itemId && claim.claimantId === userId && claim.status !== 'rejected')
}

export function countPendingClaims(itemId, userId) {
  return storage
    .getClaims()
    .filter((claim) => claim.itemId === itemId && claim.claimantId === userId && claim.status === 'pending')
    .length
}

export function createClaim(item, user, answer) {
  const existing = getMyClaim(item.id, user.id)
  if (existing) throw new Error('You already have a claim on this item. Use the chat below.')
  if (countPendingClaims(item.id, user.id) >= MAX_PENDING_CLAIMS) {
    throw new Error(`Limit reached: ${MAX_PENDING_CLAIMS} pending claims per item.`)
  }

  const claim = {
    id: uid('claim'),
    itemId: item.id,
    claimantId: user.id,
    claimantName: user.name,
    answer: maskSensitive(answer).trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: uid('msg'),
        senderId: user.id,
        senderName: user.name,
        text: 'Hi! I think this belongs to me. Please check my answer.',
        at: new Date().toISOString(),
      },
    ],
  }
  storage.setClaims([...storage.getClaims(), claim])
  return claim
}

export function approveClaim(claimId, finderName) {
  const claims = storage.getClaims()
  const target = claims.find((claim) => claim.id === claimId)
  if (!target) return
  const updated = claims.map((claim) => {
    if (claim.id === claimId) {
      return {
        ...claim,
        status: 'approved',
        messages: [
          ...claim.messages,
          {
            id: uid('msg'),
            senderId: 'system',
            senderName: finderName || 'Finder',
            text: `Claim approved! Let's meet at the College Help Desk. — ${finderName || 'Finder'}`,
            at: new Date().toISOString(),
          },
        ],
      }
    }
    // Only one claim can win an item.
    if (claim.itemId === target.itemId && claim.status === 'pending') {
      return { ...claim, status: 'rejected' }
    }
    return claim
  })
  storage.setClaims(updated)
  updateItem(target.itemId, { status: 'claimed' })
}

export function rejectClaim(claimId) {
  storage.setClaims(
    storage.getClaims().map((claim) =>
      claim.id === claimId ? { ...claim, status: 'rejected' } : claim,
    ),
  )
}

export function addMessage(claimId, user, text) {
  const safe = maskSensitive(text).trim()
  if (!safe) return
  storage.setClaims(
    storage.getClaims().map((claim) =>
      claim.id === claimId
        ? {
            ...claim,
            messages: [
              ...claim.messages,
              {
                id: uid('msg'),
                senderId: user.id,
                senderName: user.name,
                text: safe,
                at: new Date().toISOString(),
              },
            ],
          }
        : claim,
    ),
  )
}

/* --------------------------- returns & karma --------------------------- */

export function canMarkReturned(item, user, claims) {
  if (!item || item.status === 'returned') return false
  if (item.ownerId === user?.id) return true
  return claims.some((claim) => claim.claimantId === user?.id && claim.status !== 'rejected')
}

/**
 * Mark an item returned, mark its best counterpart returned too,
 * and award +10 karma to the finder.
 */
export function markReturned(item, user) {
  if (!item) return null
  const now = new Date().toISOString()
  const items = storage.getItems()

  const counterpartId = (item.matches || []).find((match) => {
    const other = items.find((entry) => entry.id === match.itemId)
    return other && other.status !== 'returned'
  })?.itemId

  const updated = items.map((entry) => {
    if (entry.id === item.id) {
      return { ...entry, status: 'returned', returnedAt: now, returnedBy: user.id }
    }
    if (counterpartId && entry.id === counterpartId) {
      return { ...entry, status: 'returned', returnedAt: now, returnedBy: user.id }
    }
    return entry
  })
  storage.setItems(updated)

  // Finder = owner of the FOUND item.
  const finderId = item.type === 'found' ? item.ownerId : updated.find((e) => e.id === counterpartId)?.ownerId
  let karmaAwarded = 0
  if (finderId) {
    const karma = storage.getKarma()
    const record = karma[finderId] || { karma: 0, returns: 0 }
    karma[finderId] = { karma: record.karma + KARMA_PER_RETURN, returns: record.returns + 1 }
    storage.setKarma(karma)
    karmaAwarded = KARMA_PER_RETURN
  }

  return { item: getItem(item.id), karmaAwarded }
}

export function getKarma(userId) {
  return storage.getKarma()[userId] || { karma: 0, returns: 0 }
}

export function badgesFor(record = {}) {
  return [
    { label: 'First Return', emoji: '🌱', earned: (record.returns || 0) >= 1 },
    { label: '5 Returns', emoji: '🏅', earned: (record.returns || 0) >= 5 },
  ]
}

export function resetDemo() {
  storage.clearDemoData()
  ensureSeeded(true)
  return { items: getItems() }
}
