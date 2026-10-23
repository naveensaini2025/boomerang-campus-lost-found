import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import Header from '../components/Header'
import StatusStepper from '../components/StatusStepper'
import MatchBadge from '../components/MatchBadge'
import { useToast } from '../components/Toast'
import { storage } from '../services/storage'
import {
  addMessage,
  approveClaim,
  canMarkReturned,
  createClaim,
  getClaimsForItem,
  getItem,
  getItems,
  getMyClaim,
  markReturned,
  rejectClaim,
} from '../services/itemService'
import { HELP_DESK, MAX_PENDING_CLAIMS, categoryMeta, itemMeta } from '../lib/config'

const initialsOf = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

const CLAIM_TONE = {
  pending: 'bg-[#FFF3CD] text-[#8A6A0A]',
  approved: 'bg-[#DFF6EE] text-found',
  rejected: 'bg-[#FDE7DF] text-lost',
}

function ChatBox({ claim, user, onSend }) {
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [claim.messages.length])

  const send = (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    onSend(draft)
    setDraft('')
  }

  return (
    <div className="mt-3 rounded-xl bg-[#F7F9FE] p-2.5">
      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {claim.messages.map((message) => {
          const mine = message.senderId === user.id
          if (message.senderId === 'system') {
            return (
              <p key={message.id} className="text-center text-[9px] font-semibold text-slate-400">
                {message.text}
              </p>
            )
          }
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                  mine ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md bg-white text-ink shadow-sm'
                }`}
              >
                {!mine ? (
                  <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                    {message.senderName}
                  </p>
                ) : null}
                {message.text}
                <span className={`ml-1.5 text-[8px] ${mine ? 'text-white/50' : 'text-slate-400'}`}>
                  {new Date(message.at).toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="mt-2 flex items-center gap-1.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message (contact details masked)…"
          className="min-w-0 flex-1 rounded-full border border-[#E1E6F2] bg-white px-3 py-2 text-[11px] outline-none focus:border-purple"
        />
        <button
          type="submit"
          aria-label="Send message"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-white transition active:scale-95"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  )
}

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const user = storage.getUser()

  const [item, setItem] = useState(() => getItem(id))
  const [claims, setClaims] = useState(() => getClaimsForItem(id))
  const [claimOpen, setClaimOpen] = useState(false)
  const [answer, setAnswer] = useState('')
  const [chatId, setChatId] = useState(null)
  const [returned, setReturned] = useState(false)
  const openedFromLink = useRef(false)

  const reload = () => {
    setItem(getItem(id))
    setClaims(getClaimsForItem(id))
  }

  useEffect(() => {
    reload()
  }, [id])

  // "Claim" buttons can jump straight into the secret-question form.
  useEffect(() => {
    if (openedFromLink.current || !item) return
    if (searchParams.get('claim') === '1' && item.type === 'found' && item.ownerId !== user.id) {
      openedFromLink.current = true
      if (!getMyClaim(item.id, user.id)) setClaimOpen(true)
    }
  }, [item, searchParams, user.id])

  if (!item) {
    return (
      <div>
        <Header user={user} title="Item details" back />
        <div className="card m-4 p-8 text-center">
          <p className="text-sm font-bold text-ink">This item no longer exists.</p>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Back to feed
          </button>
        </div>
      </div>
    )
  }

  const meta = categoryMeta(item.category)
  const isOwner = item.ownerId === user.id
  const myClaim = claims.find(
    (claim) => claim.claimantId === user.id && claim.status !== 'rejected',
  )
  const visibleClaims = isOwner ? claims : claims.filter((claim) => claim.claimantId === user.id)
  const matchList = (item.matches || [])
    .map((match) => ({ ...match, other: getItems().find((entry) => entry.id === match.itemId) }))
    .filter((match) => match.other)
  const showReturnButton = canMarkReturned(item, user, claims)

  const openChat = (claimId) => {
    setChatId(claimId)
    setTimeout(() => {
      document.getElementById('claims')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const submitClaim = () => {
    if (answer.trim().length < 3) {
      toast('Please answer the secret question.', 'lost')
      return
    }
    try {
      const claim = createClaim(item, user, answer)
      setClaimOpen(false)
      setAnswer('')
      reload()
      openChat(claim.id)
      toast('Answer sent to the finder ✨', 'found')
    } catch (error) {
      toast(error.message, 'lost')
    }
  }

  const approve = (claim) => {
    approveClaim(claim.id, user.name)
    reload()
    toast('Claim approved — arrange the handover!', 'found')
  }

  const reject = (claim) => {
    rejectClaim(claim.id)
    reload()
    toast('Claim rejected. The finder can try again.', 'lost')
  }

  const sendMessage = (claim, text) => {
    addMessage(claim.id, user, text)
    reload()
  }

  const celebrate = () => {
    const colors = ['#F2B01E', '#0F9D74', '#4B2FA0', '#E5572C']
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors })
    setTimeout(() => confetti({ particleCount: 55, angle: 60, spread: 55, origin: { x: 0 }, colors }), 180)
    setTimeout(() => confetti({ particleCount: 55, angle: 120, spread: 55, origin: { x: 1 }, colors }), 240)
  }

  const onReturn = () => {
    const result = markReturned(item, user)
    reload()
    setReturned(true)
    celebrate()
    toast(`Returned ✓ +${result?.karmaAwarded || 0} karma to the finder`, 'found')
  }

  return (
    <div className="min-h-full pb-10">
      <Header user={user} title="Item details" back />

      <div className="space-y-3 px-4 pt-4">
        {/* Photo / illustration */}
        <div className="card relative overflow-hidden">
          <div
            className="relative grid h-52 place-items-center"
            style={{ backgroundColor: meta.tint }}
          >
            {item.photo ? (
              <img src={item.photo} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[76px] drop-shadow-sm" aria-hidden>
                {meta.emoji}
              </span>
            )}
            <span
              className={`pill absolute left-3 top-3 !px-2.5 !py-1 text-[9px] shadow ${
                item.type === 'lost' ? 'bg-lost text-white' : 'bg-found text-white'
              }`}
            >
              {item.type === 'lost' ? 'LOST' : 'FOUND'}
            </span>
            {item.aiTagged ? (
              <span className="pill absolute right-3 top-3 bg-[#FFF3CD] text-[#8A6A0A] shadow">
                ✨ AI tagged
              </span>
            ) : null}
          </div>
        </div>

        {/* Title + journey */}
        <div className="card p-4">
          <h1 className="text-xl font-black leading-tight text-ink">{item.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Clock size={11} /> {itemMeta(item)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="pill bg-[#EEF1FA] text-slate-500">{item.category}</span>
            {item.color ? <span className="pill bg-[#EEF1FA] text-slate-500">{item.color}</span> : null}
            {item.brand ? <span className="pill bg-[#EEF1FA] text-slate-500">{item.brand}</span> : null}
            <span className={`pill ${CLAIM_TONE[item.status] || 'bg-[#EEF1FA] text-slate-500'}`}>
              {item.status}
            </span>
          </div>

          <div className="mt-3 border-t border-[#EEF1F8] pt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Return journey
              </p>
              <p className="text-[9px] font-bold text-purple">{item.status.toUpperCase()}</p>
            </div>
            <StatusStepper status={item.status} />
          </div>
        </div>

        {/* Description */}
        <div className="card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Details</p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {item.description || 'No description added.'}
          </p>
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#F7F9FE] px-2.5 py-2 text-[9px] font-medium leading-snug text-slate-400">
            <ShieldCheck size={12} className="shrink-0 text-found" />
            Contact details are hidden. Phone, roll and card numbers are masked automatically.
          </p>
        </div>

        {/* Suggested matches */}
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
              <Sparkles size={14} className="text-amber" /> Suggested matches
            </h2>
            <span className="text-[10px] font-bold text-slate-400">{matchList.length} of 3</span>
          </div>

          {matchList.length ? (
            <div className="space-y-2">
              {matchList.map(({ score, other }) => {
                const otherMeta = categoryMeta(other.category)
                return (
                  <div
                    key={other.id}
                    onClick={() => navigate(`/item/${other.id}`)}
                    className="card flex cursor-pointer items-center gap-2.5 p-2.5 transition hover:-translate-y-0.5 hover:shadow-float"
                  >
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl text-xl"
                      style={{ backgroundColor: otherMeta.tint }}
                    >
                      {other.photo ? (
                        <img src={other.photo} alt="" className="h-full w-full object-cover" />
                      ) : (
                        otherMeta.emoji
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-ink">{other.title}</p>
                      <p className="truncate text-[10px] text-slate-400">{itemMeta(other)}</p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#EEF1F8]">
                        <div
                          className="h-full rounded-full bg-amber"
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={`pill ${score >= 70 ? 'bg-[#FFF0C2] text-[#946B00]' : 'bg-[#EEF1FA] text-slate-500'}`}
                      >
                        {score}%
                      </span>
                      {other.type === 'found' && other.ownerId !== user.id && item.status !== 'returned' ? (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/item/${other.id}?claim=1`)
                          }}
                          className="rounded-full bg-navy px-2 py-1 text-[8px] font-extrabold text-white"
                        >
                          Claim
                        </button>
                      ) : (
                        <ChevronRight size={13} className="text-slate-300" />
                      )}
                    </div>
                  </div>
                )
              })}
              <p className="px-1 text-[9px] leading-snug text-slate-400">
                Matches are suggestions from Boomerang&apos;s local scoring. You decide what&apos;s
                yours.
              </p>
            </div>
          ) : (
            <div className="card px-4 py-5 text-center">
              <p className="text-xs font-bold text-ink">No matches yet</p>
              <p className="mt-1 text-[10px] text-slate-400">
                New posts are checked automatically. Check back soon.
              </p>
            </div>
          )}
        </div>

        {/* Owner / claim actions */}
        {isOwner ? (
          <div className="card border-amber/30 bg-[#FFFBF0] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-ink">
              <span className="text-base">👑</span> This is your post
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              {claims.length
                ? `You have ${claims.length} claim${claims.length > 1 ? 's' : ''}. Verify the secret answer and approve the real owner.`
                : 'No claims yet. Matches are shown above; we will keep checking new posts.'}
            </p>
          </div>
        ) : null}

        {!isOwner && item.type === 'found' && item.status !== 'returned' ? (
          myClaim ? (
            <button onClick={() => openChat(myClaim.id)} className="btn-primary">
              <MessageCircle size={16} /> Chat with finder
            </button>
          ) : (
            <button onClick={() => setClaimOpen(true)} className="btn-amber">
              <Sparkles size={16} /> Claim this item
            </button>
          )
        ) : null}

        {item.status === 'returned' ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-found/20 bg-[#E4F7F0] p-3.5">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-xs font-extrabold text-found">Returned to its owner</p>
              <p className="text-[10px] text-found/70">Another Boomerang success story.</p>
            </div>
          </div>
        ) : null}

        {/* Claims + chat */}
        {(isOwner || myClaim) && (
          <div id="claims" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-ink">
                {isOwner ? 'Claims received' : 'Your claim'}
              </h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 shadow-sm">
                {visibleClaims.length}
              </span>
            </div>

            {visibleClaims.length === 0 ? (
              <div className="card px-4 py-4 text-center text-[10px] text-slate-400">
                No claims yet. When someone answers your secret question, they will appear here.
              </div>
            ) : null}

            {visibleClaims.map((claim) => (
              <div key={claim.id} className="card p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EFE9FF] text-[10px] font-black text-purple">
                    {initialsOf(claim.claimantName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-ink">{claim.claimantName}</p>
                    <p className="text-[9px] text-slate-400">
                      {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <span className={`pill ${CLAIM_TONE[claim.status]}`}>{claim.status}</span>
                </div>

                {isOwner ? (
                  <p className="mt-2 rounded-lg bg-[#F7F9FE] px-2.5 py-2 text-[10px] leading-relaxed text-slate-600">
                    <b className="text-ink">Secret answer:</b> {claim.answer}
                  </p>
                ) : (
                  <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
                    {claim.status === 'pending'
                      ? 'Waiting for the finder to approve your answer.'
                      : claim.status === 'approved'
                        ? 'Approved! Meet the finder at the College Help Desk.'
                        : 'This claim was rejected. Double-check the secret detail.'}
                  </p>
                )}

                {claim.status === 'approved' ? (
                  <p className="mt-2 flex items-center gap-1 text-[9px] font-semibold text-found">
                    <MapPin size={10} /> Suggested handover: {HELP_DESK}
                  </p>
                ) : null}

                <div className="mt-2.5 flex gap-1.5">
                  <button
                    onClick={() => setChatId(chatId === claim.id ? null : claim.id)}
                    className="btn-ghost flex-1 !py-2 text-[10px]"
                  >
                    <MessageCircle size={13} />
                    {chatId === claim.id ? 'Hide chat' : 'Chat'}
                  </button>
                  {isOwner && claim.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => approve(claim)}
                        className="flex items-center gap-1 rounded-xl bg-found px-3 py-2 text-[10px] font-extrabold text-white transition active:scale-95"
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        onClick={() => reject(claim)}
                        aria-label="Reject claim"
                        className="grid h-8 w-8 place-items-center rounded-xl bg-[#FDE7DF] text-lost transition active:scale-95"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : null}
                </div>

                {chatId === claim.id ? (
                  <ChatBox
                    claim={claim}
                    user={user}
                    onSend={(text) => sendMessage(claim, text)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Return action */}
        {showReturnButton ? (
          <div>
            <button
              onClick={onReturn}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-found/30 bg-[#E4F7F0] py-3 text-sm font-extrabold text-found transition hover:bg-[#D5F2E8] active:scale-[0.99]"
            >
              <Check size={17} strokeWidth={3} /> Mark as Returned
            </button>
            <p className="mt-1.5 text-center text-[9px] font-medium text-slate-400">
              Confetti moment + <b className="text-found">+10 karma</b> for the finder.
            </p>
          </div>
        ) : null}

        {/* Handover */}
        <div className="card flex items-center gap-3 p-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
            <MapPin size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Suggested handover
            </p>
            <p className="text-[11px] font-extrabold text-ink">{HELP_DESK}</p>
            <p className="text-[9px] text-slate-400">Public, CCTV-covered. Chat in-app only.</p>
          </div>
        </div>
      </div>

      {/* Secret question modal */}
      {claimOpen ? (
        <div className="phone-modal px-5">
          <div className="w-full max-w-[330px] rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="pill bg-[#EFE9FF] text-ai">Secret check</span>
                <h3 className="mt-2 text-base font-black text-ink">Prove it&apos;s yours</h3>
              </div>
              <button
                onClick={() => setClaimOpen(false)}
                aria-label="Close claim form"
                className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={14} />
              </button>
            </div>

            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Answer the finder&apos;s question about the {item.title}. No phone numbers — the finder
              replies in the chat.
            </p>

            <div className="mt-3 rounded-xl border border-amber/30 bg-[#FFF8E1] p-3">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#A87A06]">
                Finder&apos;s question
              </p>
              <p className="mt-1 text-xs font-bold text-ink">
                {item.secretQuestion || 'Describe a detail only the owner would know.'}
              </p>
            </div>

            <label htmlFor="secret-answer" className="label mt-3">
              Your answer
            </label>
            <textarea
              id="secret-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={3}
              placeholder="Type what only the owner would know…"
              className="field resize-none"
              maxLength={200}
            />

            <button onClick={submitClaim} className="btn-amber mt-3">
              Send answer to finder
            </button>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <ShieldCheck size={11} className="text-found" /> Max {MAX_PENDING_CLAIMS} pending claims per item.
            </p>
          </div>
        </div>
      ) : null}

      {/* Returned celebration */}
      {returned ? (
        <div className="phone-modal px-5">
          <div className="w-full max-w-[320px] animate-pop rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="flex justify-center">
              <MatchBadge variant="returned" className="scale-110" />
            </div>
            <h3 className="mt-4 text-xl font-black text-ink">Returned home! 🎉</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              What was lost just came back. The finder earned{' '}
              <b className="text-found">+10 karma</b> and a Good Samaritan badge.
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-[#FFF8E1] py-2 text-[11px] font-extrabold text-[#8A6A0A]">
              <Trophy size={14} /> Kindness, tracked.
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={() => navigate('/my-items')} className="btn-primary">
                See my items
              </button>
              <button onClick={() => setReturned(false)} className="btn-ghost w-full">
                Stay on this item
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
