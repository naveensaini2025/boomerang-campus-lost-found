import { describe, expect, it } from 'vitest'
import { scoreMatch, similarity } from './matchService'

const now = new Date().toISOString()

const lostWallet = {
  type: 'lost',
  title: 'Black Wallet',
  description: 'Black leather wallet with student ID inside lost near canteen',
  category: 'Wallet',
  color: 'Black',
  brand: 'Puma',
  location: 'Canteen, Block A',
  createdAt: now,
}

const foundWallet = {
  ...lostWallet,
  type: 'found',
  description: 'Black leather wallet with student ID inside found near canteen',
}

describe('scoreMatch (local, explainable matching)', () => {
  it('scores the seeded Black Wallet pair at 92%', () => {
    expect(scoreMatch(lostWallet, foundWallet)).toBe(92)
  })

  it('never matches two items of the same type', () => {
    expect(scoreMatch(lostWallet, { ...foundWallet, type: 'lost' })).toBe(0)
  })

  it('gives a low score to unrelated items', () => {
    const umbrella = {
      type: 'found',
      title: 'Black Umbrella',
      description: 'Found an umbrella in the lobby',
      category: 'Umbrella',
      color: 'Black',
      brand: '',
      location: 'Block D',
      createdAt: now,
    }
    expect(scoreMatch(lostWallet, umbrella)).toBeLessThan(40)
  })

  it('drops 10 points when the two posts are older than 48 hours apart', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const oldFound = { ...foundWallet, createdAt: threeDaysAgo }
    expect(scoreMatch(lostWallet, foundWallet) - scoreMatch(lostWallet, oldFound)).toBe(10)
  })

  it('scores the seeded Student ID pair at 92%', () => {
    const lostId = {
      ...lostWallet,
      title: 'Student ID Card',
      description: 'Lost white student ID card near library entrance on campus',
      category: 'ID Card',
      color: 'White',
      brand: 'GL Bajaj',
      location: 'Library, Block B',
    }
    const foundId = {
      ...lostId,
      type: 'found',
      description: 'Found white student ID card near library entrance on campus',
    }
    expect(scoreMatch(lostId, foundId)).toBe(92)
  })

  it('uses word overlap for text similarity', () => {
    expect(similarity('black leather wallet', 'black wallet')).toBeCloseTo(2 / 3, 5)
    expect(similarity('', 'anything')).toBe(0)
  })
})
