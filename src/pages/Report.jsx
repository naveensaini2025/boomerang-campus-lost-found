import { useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { Camera, MapPin, Sparkles, X } from 'lucide-react'
import Header from '../components/Header'
import MatchBadge from '../components/MatchBadge'
import { useToast } from '../components/Toast'
import { storage } from '../services/storage'
import { createItem, getItem } from '../services/itemService'
import { CATEGORIES, COLLEGE, MATCH_THRESHOLD, formatWhen } from '../lib/config'
import { compressImage } from '../lib/imageCompress'
import { autofillItem, guessFromText } from '../services/aiService'

function localNow() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

function ClickToPin({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng })
    },
  })
  return null
}

export default function Report() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = storage.getUser()
  const [searchParams] = useSearchParams()
  const fileRef = useRef(null)

  const [type, setType] = useState(searchParams.get('type') === 'found' ? 'found' : 'lost')
  const [photo, setPhoto] = useState(null)
  const [aiTagged, setAiTagged] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [pin, setPin] = useState(null)
  const [created, setCreated] = useState(null)
  const [match, setMatch] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    color: '',
    brand: '',
    location: '',
    dateTime: localNow(),
    secretQuestion: '',
  })

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))

  const applyTags = (tags) => {
    if (!tags?.tagged) {
      toast('No clear tags found — fill the fields manually.', 'lost')
      return
    }
    setForm((prev) => ({
      ...prev,
      category: tags.category || prev.category,
      color: tags.color || prev.color,
      brand: tags.brand || prev.brand,
      title: prev.title || tags.title || '',
    }))
    setAiTagged(true)
    toast('AI tagged your item ✨')
  }

  const onPhoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCompressing(true)
    try {
      const dataUrl = await compressImage(file)
      setPhoto(dataUrl)
      const tags = await autofillItem({ dataUrl, title: form.title, fileName: file.name })
      applyTags(tags)
    } catch (error) {
      toast(error.message || 'Could not read that photo', 'lost')
    } finally {
      setCompressing(false)
      event.target.value = ''
    }
  }

  const runAutoTag = () => {
    const tags = guessFromText(`${form.title} ${form.description}`)
    applyTags(tags)
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.location.trim() || !form.category) {
      toast('Add a title, category and location first.', 'lost')
      return
    }
    if (type === 'found' && !form.secretQuestion.trim()) {
      toast('Add a secret question so the owner can prove it.', 'lost')
      return
    }

    const iso = form.dateTime ? new Date(form.dateTime).toISOString() : new Date().toISOString()
    const item = createItem(
      {
        ...form,
        type,
        dateTime: iso,
        timeLabel: formatWhen(iso),
        lat: pin?.lat ?? null,
        lng: pin?.lng ?? null,
        photo,
        aiTagged,
        secretQuestion: type === 'found' ? form.secretQuestion.trim() : '',
      },
      user,
    )

    const top = item.matches?.[0]
    setCreated(item)
    if (top && top.score >= MATCH_THRESHOLD) {
      setMatch({ score: top.score, item: getItem(top.itemId) })
    } else {
      setMatch(null)
    }
  }

  const matchTitle = useMemo(() => match?.item?.title || '', [match])

  return (
    <div className="min-h-full pb-8">
      <Header user={user} title="Report an item" back />

      <form onSubmit={submit} className="space-y-4 px-4 pt-4">
        {/* Lost / Found toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          <button
            type="button"
            onClick={() => setType('lost')}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition ${
              type === 'lost' ? 'bg-lost text-white shadow-md shadow-lost/30' : 'text-slate-400'
            }`}
          >
            🔎 I lost it
          </button>
          <button
            type="button"
            onClick={() => setType('found')}
            className={`rounded-xl py-2.5 text-xs font-extrabold transition ${
              type === 'found' ? 'bg-found text-white shadow-md shadow-found/30' : 'text-slate-400'
            }`}
          >
            🙌 I found it
          </button>
        </div>

        {/* Photo + AI tags */}
        <div className="card p-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPhoto}
            className="hidden"
            aria-label="Upload item photo"
          />
          {photo ? (
            <div className="relative overflow-hidden rounded-xl">
              <img src={photo} alt="Item preview" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 left-2 rounded-full bg-navy/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur"
              >
                Change photo
              </button>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                aria-label="Remove photo"
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#DCE2F2] bg-[#F8FAFF] px-4 py-6 text-slate-400 transition hover:border-purple/40 hover:bg-[#F2F5FF]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-purple shadow-sm">
                <Camera size={19} />
              </span>
              <span className="text-xs font-bold text-navy">
                {compressing ? 'Compressing…' : 'Add a photo (optional)'}
              </span>
              <span className="text-[10px]">AI will tag the item for you</span>
            </button>
          )}

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium text-slate-400">
              Auto-fill category, colour &amp; brand
            </span>
            <button
              type="button"
              onClick={runAutoTag}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFF3CD] px-3 py-1.5 text-[10px] font-extrabold text-[#8A6A0A]"
            >
              <Sparkles size={11} /> Auto-tag
            </button>
          </div>
          {aiTagged ? (
            <div className="mt-2">
              <span className="pill bg-[#FFF3CD] text-[#8A6A0A]">✨ AI tagged — edit anything</span>
            </div>
          ) : null}
        </div>

        {/* Core fields */}
        <div className="card space-y-3 p-4">
          <div>
            <label className="label" htmlFor="title">
              Item title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Black Wallet"
              className="field"
              maxLength={60}
            />
          </div>

          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={set('description')}
              rows={3}
              placeholder="What does it look like? Where exactly did you lose/find it?"
              className="field resize-none"
              maxLength={300}
            />
            <p className="mt-1 text-[9px] leading-snug text-slate-400">
              🔒 Phone, roll &amp; card numbers are masked automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label" htmlFor="category">
                Category
              </label>
              <select id="category" value={form.category} onChange={set('category')} className="field">
                <option value="">Select…</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="color">
                Colour
              </label>
              <input
                id="color"
                value={form.color}
                onChange={set('color')}
                placeholder="Black"
                className="field"
                maxLength={20}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="label" htmlFor="brand">
                Brand <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <input
                id="brand"
                value={form.brand}
                onChange={set('brand')}
                placeholder="Puma"
                className="field"
                maxLength={30}
              />
            </div>
            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={set('location')}
                placeholder="Canteen, Block A"
                className="field"
                maxLength={60}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="dateTime">
              Date &amp; time
            </label>
            <input
              id="dateTime"
              type="datetime-local"
              value={form.dateTime}
              onChange={set('dateTime')}
              className="field"
            />
          </div>
        </div>

        {/* Optional map pin */}
        <div className="card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Map pin <span className="font-normal normal-case">(optional)</span>
            </p>
            {pin ? (
              <button
                type="button"
                onClick={() => setPin(null)}
                className="text-[10px] font-bold text-lost"
              >
                Remove pin
              </button>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-xl border border-[#E3E8F4]">
            <MapContainer
              center={pin ? [pin.lat, pin.lng] : [COLLEGE.lat, COLLEGE.lng]}
              zoom={16}
              scrollWheelZoom={false}
              className="h-36 w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ClickToPin onPick={setPin} />
              {pin ? (
                <CircleMarker
                  center={[pin.lat, pin.lng]}
                  radius={9}
                  pathOptions={{ color: '#fff', weight: 3, fillColor: '#E5572C', fillOpacity: 1 }}
                />
              ) : null}
            </MapContainer>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-400">
            <MapPin size={11} className="text-amber" />
            {pin ? 'Pin added to the campus map.' : 'Tap the map to drop a pin.'}
          </p>
        </div>

        {/* Secret question only for found items */}
        {type === 'found' ? (
          <div className="card border-found/20 p-4">
            <label className="label" htmlFor="secretQuestion">
              Secret detail question
            </label>
            <input
              id="secretQuestion"
              value={form.secretQuestion}
              onChange={set('secretQuestion')}
              placeholder="What is the wallpaper on the lock screen?"
              className="field"
              maxLength={100}
            />
            <p className="mt-1.5 text-[9px] leading-snug text-slate-400">
              Only the real owner should know this. It is never shown publicly.
            </p>
          </div>
        ) : null}

        <button type="submit" className="btn-amber">
          <Sparkles size={16} /> Post {type === 'found' ? 'found' : 'lost'} item
        </button>
      </form>

      {/* Success / match modal */}
      {created ? (
        <div className="phone-modal px-5">
          <div className="w-full max-w-[330px] animate-pop rounded-3xl bg-white p-6 text-center shadow-2xl">
            {match ? (
              <>
                <div className="mb-3 flex justify-center">
                  <MatchBadge variant="score" score={match.score} />
                </div>
                <h3 className="text-lg font-black text-ink">Possible match found!</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  Your {created.type} <b className="text-ink">{created.title}</b> may be the{' '}
                  <b className="text-ink">{matchTitle}</b>. Matches are only suggestions — you decide
                  what happens next.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-[#E4F7F0] text-2xl">
                  ✅
                </div>
                <h3 className="text-lg font-black text-ink">Posted to campus</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  We&apos;ll keep looking. Boomerang checks new posts automatically — no need to
                  refresh anything.
                </p>
              </>
            )}

            <div className="mt-5 space-y-2">
              <button onClick={() => navigate(`/item/${created.id}`)} className="btn-primary">
                View my post
              </button>
              {match ? (
                <button
                  onClick={() => navigate(`/item/${match.item.id}?claim=1`)}
                  className="btn-ghost w-full"
                >
                  Open the {match.score}% match
                </button>
              ) : (
                <button onClick={() => navigate('/')} className="btn-ghost w-full">
                  Back to feed
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
