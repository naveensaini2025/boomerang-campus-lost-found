import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)
const noop = () => {}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message, tone = 'navy') => {
    setToast({ message, tone })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[999] flex justify-center px-6">
          <div
            className={`animate-fadeUp flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold text-white shadow-float ${
              toast.tone === 'found' ? 'bg-found' : toast.tone === 'lost' ? 'bg-lost' : 'bg-navy'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber" />
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext) || noop
}
