import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminLogin } from '../api/client'
import Spinner from '../components/Spinner'

export default function AdminLogin() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const result = await adminLogin(key)
      if (result?.ok === false) throw new Error('The admin key was not accepted.')
      sessionStorage.setItem('kindnessJamAdmin', key)
      navigate('/admin', { replace: true })
    } catch (error) { toast.error(error.message || 'Could not sign in.') }
    finally { setLoading(false) }
  }
  return <main className="page-shell mx-auto max-w-md px-4 py-12"><section className="surface p-6 sm:p-8">
    <h1 className="text-2xl font-bold text-ku-900">admin login</h1><p className="mt-2 text-sm text-slate-600">Enter your authorized event-team key to continue.</p>
    <form className="mt-6 space-y-5" onSubmit={submit}><div><label className="field-label" htmlFor="admin-key">Admin key</label><input className="field" id="admin-key" type="password" autoComplete="current-password" required value={key} onChange={(event) => setKey(event.target.value)} /></div><button className="primary-button w-full" disabled={loading}>{loading ? <Spinner label="Signing in…" /> : 'Sign in'}</button></form>
  </section></main>
}
