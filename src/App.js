import { lazy, Suspense } from 'react'
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Spinner from './components/Spinner'

function Header() {
  return <header className="bg-gradient-to-r from-ku-900 via-ku-700 to-ku-500 text-white">
    <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
      <div aria-label="Kindness Unlimited logo placeholder" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/10 text-xs font-bold">KU</div>
      <Link to="/" className="leading-tight text-white no-underline">
        <span className="block text-lg font-bold">Kindness Unlimited</span>
        <span className="block text-sm text-white/80">Kindness Jam</span>
      </Link>
    </div>
  </header>
}

function Footer() {
  return <footer className="mt-10 border-t border-ku-100 bg-white/70">
    <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
      Made with kindness by Kindness Unlimited
    </div>
  </footer>
}

function ProtectedRoute({ role }) {
  const key = role === 'admin' ? 'kindnessJamAdmin' : 'kindnessJamNgo'
  return sessionStorage.getItem(key) ? <Outlet /> : <Navigate to={role === 'admin' ? '/admin/login' : '/ngo/login'} replace />
}

const Landing = lazy(() => import('./pages/Landing'))
const Register = lazy(() => import('./pages/Register'))
const Ticket = lazy(() => import('./pages/Ticket'))
const MyTicket = lazy(() => import('./pages/MyTicket'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminOrg = lazy(() => import('./pages/AdminOrg'))
const AdminScan = lazy(() => import('./pages/AdminScan'))
const NgoLogin = lazy(() => import('./pages/NgoLogin'))
const NgoDashboard = lazy(() => import('./pages/NgoDashboard'))

function NotFound() {
  return <main className="page-shell mx-auto max-w-xl px-4 py-16 text-center">
    <div className="surface p-8"><p className="text-sm font-bold uppercase tracking-widest text-ku-600">404</p><h1 className="mt-2 text-3xl font-bold text-ku-900">We couldn’t find that page</h1><p className="mt-3 text-slate-600">The link may be incorrect or the page may have moved.</p><Link to="/" className="primary-button mt-6">Go to Kindness Jam</Link></div>
  </main>
}

export default function App() {
  return <>
    <Header />
    <Suspense fallback={<main className="page-shell flex justify-center px-4 py-12 text-ku-700"><Spinner label="Loading page…" /></main>}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/r/:orgCode" element={<Register />} />
      <Route path="/ticket/:token" element={<Ticket />} />
      <Route path="/my-ticket" element={<MyTicket />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/org/:orgCode" element={<AdminOrg />} />
        <Route path="/admin/scan" element={<AdminScan />} />
      </Route>
      <Route path="/ngo/login" element={<NgoLogin />} />
      <Route element={<ProtectedRoute role="ngo" />}>
        <Route path="/ngo" element={<NgoDashboard />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    <Footer />
  </>
}
