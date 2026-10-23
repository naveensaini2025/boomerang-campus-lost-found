import { STATUS_LABELS } from '../lib/config'

const STAGE_COLORS = ['bg-lost', 'bg-navy', 'bg-ai', 'bg-amber', 'bg-found']
const ACTIVE_INDEX = { listed: 1, matched: 2, claimed: 3, returned: 4 }

/** LOST → LISTED → MATCHED → CLAIMED → RETURNED arrow-style stepper. */
export default function StatusStepper({ status }) {
  const current = ACTIVE_INDEX[status] ?? 1

  return (
    <div className="flex w-full items-stretch gap-[3px]">
      {STATUS_LABELS.map((label, index) => {
        const done = index <= current
        return (
          <div
            key={label}
            className={`step-arrow flex h-7 flex-1 items-center justify-center ${
              done ? `${STAGE_COLORS[index]} text-white` : 'bg-[#E7EAF4] text-slate-400'
            } ${index === 0 ? 'rounded-l-md' : ''} ${index === STATUS_LABELS.length - 1 ? 'rounded-r-md' : ''}`}
            title={label}
          >
            <span className="text-[7.5px] font-extrabold tracking-wide">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
