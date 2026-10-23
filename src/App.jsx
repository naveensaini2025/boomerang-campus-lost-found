import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import DesktopNav from './components/DesktopNav'
import FloatingBadges from './components/FloatingBadges'
import { ToastProvider } from './components/Toast'
import { storage } from './services/storage'

const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Report = lazy(() => import('./pages/Report'))
const ItemDetail = lazy(() => import('./pages/ItemDetail'))
const MyItems = lazy(() => import('./pages/MyItems'))

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

/** Full-screen mobile layout; sidebar + wide canvas on desktop. */
function Shell() {
  const { pathname } = useLocation()
  const showNav = ['/', '/my-items'].includes(pathname)

  return (
    <div className="app-stage">
      <div className="app-shell">
        <DesktopNav />
        <div className="app-main">
          <ToastProvider>
            <main className="no-scrollbar app-scroll">
              <Suspense fallback={<Loader />}>
                <Outlet />
              </Suspense>
            </main>

            {pathname === '/' ? <FloatingBadges /> : null}
            {showNav ? (
              <div className="lg:hidden">
                <BottomNav />
              </div>
            ) : null}
          </ToastProvider>
        </div>
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
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
