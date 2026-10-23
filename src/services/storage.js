/**
 * The ONLY file that touches localStorage.
 * Everything is JSON in the browser — no backend, no database, no accounts.
 */
const KEYS = {
  user: 'boomerang_user',
  items: 'boomerang_items',
  claims: 'boomerang_claims',
  karma: 'boomerang_karma',
  seeded: 'boomerang_seeded',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Most likely the photo quota is full — the app keeps working with previous data.
    console.warn('Boomerang: could not save to localStorage (storage may be full).')
    return false
  }
}

export const storage = {
  // user
  getUser: () => read(KEYS.user, null),
  setUser: (user) => write(KEYS.user, user),
  clearUser: () => localStorage.removeItem(KEYS.user),

  // items
  getItems: () => read(KEYS.items, []),
  setItems: (items) => write(KEYS.items, items),

  // claims + chat
  getClaims: () => read(KEYS.claims, []),
  setClaims: (claims) => write(KEYS.claims, claims),

  // karma / good samaritan stats
  getKarma: () => read(KEYS.karma, {}),
  setKarma: (karma) => write(KEYS.karma, karma),

  isSeeded: () => localStorage.getItem(KEYS.seeded) === 'yes',
  markSeeded: () => localStorage.setItem(KEYS.seeded, 'yes'),

  /** Wipe demo content but keep the logged-in user. */
  clearDemoData() {
    ;[KEYS.items, KEYS.claims, KEYS.karma, KEYS.seeded].forEach((key) => localStorage.removeItem(key))
  },
}
