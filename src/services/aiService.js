/**
 * Optional "AI" autofill.
 * - With VITE_GEMINI_KEY: one free Gemini vision call reads the photo.
 * - Without a key (default): a tiny keyword guesser keeps the demo fully offline.
 * Either way this module never throws — the form always keeps working.
 */
import { CATEGORIES } from '../lib/config'

const KEY = (import.meta.env.VITE_GEMINI_KEY || '').trim()
export const hasAIKey = Boolean(KEY)

// Model names change over time; try the current free model first, then an older one.
const MODELS = [
  (import.meta.env.VITE_GEMINI_MODEL || '').trim(),
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter((model, index, list) => model && list.indexOf(model) === index)

const KEYWORDS = [
  { words: ['wallet', 'purse'], category: 'Wallet', title: 'Wallet' },
  { words: ['id card', 'idcard', 'identity', 'student card'], category: 'ID Card', title: 'Student ID Card' },
  { words: ['earphone', 'earbud', 'headphone', 'airpod', 'boat'], category: 'Electronics', title: 'Earphones' },
  { words: ['phone', 'mobile', 'iphone', 'redmi', 'samsung'], category: 'Phone', title: 'Phone' },
  { words: ['bottle', 'flask', 'sipper'], category: 'Bottle', title: 'Water Bottle' },
  { words: ['calculator', 'casio'], category: 'Calculator', title: 'Scientific Calculator' },
  { words: ['key', 'keys', 'keychain'], category: 'Keys', title: 'Keys' },
  { words: ['umbrella'], category: 'Umbrella', title: 'Umbrella' },
  { words: ['notebook', 'book', 'register', 'stationery'], category: 'Stationery', title: 'Notebook' },
  { words: ['bag', 'backpack', 'rucksack'], category: 'Bag', title: 'Backpack' },
  { words: ['spectacle', 'glasses', 'eyewear', 'goggles'], category: 'Eyewear', title: 'Spectacles' },
]

const COLORS = ['black', 'blue', 'red', 'white', 'green', 'yellow', 'silver', 'grey', 'gray', 'brown', 'pink', 'orange', 'purple']
const BRANDS = ['puma', 'nike', 'adidas', 'apple', 'samsung', 'oneplus', 'boat', 'dell', 'hp', 'lenovo', 'casio', 'wildcraft', 'milton', 'classmate', 'fastrack', 'titan', 'redmi', 'realme']

function titleCase(word = '') {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** Offline guesser from a title or uploaded file name. */
export function guessFromText(text = '') {
  const lower = text.toLowerCase()
  const hit = KEYWORDS.find((entry) => entry.words.some((word) => lower.includes(word)))
  const color = COLORS.find((entry) => lower.includes(entry))
  const brand = BRANDS.find((entry) => lower.includes(entry))
  const normalizedColor = color === 'gray' ? 'Grey' : color ? titleCase(color) : ''

  const tags = {}
  if (hit) {
    tags.category = hit.category
    tags.title = `${normalizedColor ? normalizedColor + ' ' : ''}${hit.title}`.trim()
  }
  if (normalizedColor) tags.color = normalizedColor
  if (brand) tags.brand = brand === 'boat' ? 'boAt' : titleCase(brand)

  return { ...tags, source: 'local', tagged: Boolean(hit || normalizedColor) }
}

function fileToParts(dataUrl) {
  const [header, data] = dataUrl.split(',')
  const mime = header.match(/data:(.*?);/)?.[1] || 'image/jpeg'
  return { inline_data: { mime_type: mime, data } }
}

async function readWithGemini(dataUrl) {
  const prompt = `You are tagging a campus lost-and-found photo. Reply with ONLY a JSON object:
{"title":"short item name","category":"one of ${CATEGORIES.join(', ')}","color":"main colour","brand":"brand or empty"}
Be practical and brief.`

  let lastError = new Error('Gemini is unavailable')

  for (const model of MODELS) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, fileToParts(dataUrl)] }],
            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
          }),
        },
      )
      if (!response.ok) throw new Error(`Gemini returned ${response.status}`)

      const json = await response.json()
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

      return {
        title: typeof parsed.title === 'string' ? parsed.title.slice(0, 60) : '',
        category: CATEGORIES.includes(parsed.category) ? parsed.category : '',
        color: typeof parsed.color === 'string' ? parsed.color.slice(0, 20) : '',
        brand: typeof parsed.brand === 'string' ? parsed.brand.slice(0, 30) : '',
        source: 'gemini',
        tagged: true,
      }
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}

/**
 * Autofill tags from a compressed photo, falling back to the title/file name.
 * Returned fields are suggestions only — the user can edit every field.
 */
export async function autofillItem({ dataUrl, title = '', fileName = '' } = {}) {
  if (KEY && dataUrl) {
    try {
      const result = await readWithGemini(dataUrl)
      if (result.category || result.color || result.brand || result.title) return result
    } catch (error) {
      // Silent, expected when offline / quota reached. Fall back to keywords.
      console.info('Boomerang AI: using offline tagger —', error.message)
    }
  }

  const guessed = guessFromText(`${title} ${fileName.replace(/\.[a-z0-9]+$/i, '')}`)
  if (!title && guessed.title) return guessed
  return guessed
}
