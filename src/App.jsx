import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import FloatingBadges from './components/FloatingBadges'
import { ToastProvider } from './components/Toast'
import { storage } from './services/storage'

const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Report = lazy(() => import('./pages/Report'))
const ItemDetail = lazy(() => import('./pages/ItemDetail'))
const MyItems = lazy(() => import('./pages/MyItems'))
const MapPage = lazy(() => import('./pages/MapPage'))

function Loader() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-navy/15 border-t-amber" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Boomerang</p>
      </div>
    </div>
  )
}

function RequireUser() {
  return storage.getUser() ? <Outlet /> : <Navigate to="/login" replace />
}

/** Centered phone frame on desktop, full-screen app on mobile. */
function Shell() {
  const { pathname } = useLocation()
  const showNav = ['/', '/my-items', '/map'].includes(pathname)

  return (
    <div className="app-stage">
      <div className="phone-shell">
        <ToastProvider>
          <main className="no-scrollbar relative flex-1 overflow-y-auto">
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </main>

          {pathname === '/' ? <FloatingBadges /> : null}
          {showNav ? <BottomNav /> : null}
        </ToastProvider>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireUser />}>
          <Route element={<Shell />}>
            <Route index element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/my-items" element={<MyItems />} />
            <Route path="/map" element={<MapPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
