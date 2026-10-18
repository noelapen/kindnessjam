import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ngoLogin } from '../api/client'
import Spinner from '../components/Spinner'

export default function NgoLogin() {
  const [orgCode, setOrgCode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const result = await ngoLogin(orgCode.trim(), passcode)
      if (result?.ok === false) throw new Error('Organisation code or passcode was not accepted.')
      sessionStorage.setItem('kindnessJamNgo', JSON.stringify({ orgCode: orgCode.trim(), passcode }))
      navigate('/ngo', { replace: true })
    } catch (error) { toast.error(error.message || 'Could not sign in.') }
    finally { setLoading(false) }
  }
  return <main className="page-shell mx-auto max-w-md px-4 py-12"><section className="surface p-6 sm:p-8">
    <h1 className="text-2xl font-bold text-ku-900">Volunteer / organisation login</h1><p className="mt-2 text-sm text-slate-600">Sign in with your organisation code and passcode to view its registrations.</p>
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <div><label className="field-label" htmlFor="org-code">Organisation code</label><input className="field" id="org-code" autoComplete="username" required value={orgCode} onChange={(event) => setOrgCode(event.target.value)} /></div>
      <div><label className="field-label" htmlFor="org-passcode">Passcode</label><input className="field" id="org-passcode" type="password" autoComplete="current-password" required value={passcode} onChange={(event) => setPasscode(event.target.value)} /></div>
      <button className="primary-button w-full" disabled={loading}>{loading ? <Spinner label="Signing in…" /> : 'Sign in'}</button>
    </form>
  </section></main>
}
