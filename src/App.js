import { lazy, Suspense } from 'react'
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Spinner } from './components/Shared'
import logo from '../images/logo.png'

function Header() {
  return <header className="bg-gradient-to-r from-ku-900 via-ku-700 to-ku-500 text-white">
    <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
      <img className="h-12 w-12 shrink-0 rounded-xl object-contain" src={logo} alt="Kindness Unlimited logo" />
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
const Admin = lazy(() => import('./pages/Admin'))
const Ngo = lazy(() => import('./pages/Ngo'))

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
      <Route path="/register" element={<Register />} />
      <Route path="/r/:orgCode" element={<Register />} />
      <Route path="/ticket/:token" element={<Ticket />} />
      <Route path="/my-ticket" element={<Ticket recover />} />
      <Route path="/admin/login" element={<Admin page="login" />} />
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<Admin page="dashboard" />} />
        <Route path="/admin/org/:orgCode" element={<Admin page="org" />} />
        <Route path="/admin/scan" element={<Admin page="scan" />} />
      </Route>
      <Route path="/ngo/login" element={<Ngo mode="login" />} />
      <Route element={<ProtectedRoute role="ngo" />}>
        <Route path="/ngo" element={<Ngo mode="dashboard" />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    <Footer />
  </>
}
