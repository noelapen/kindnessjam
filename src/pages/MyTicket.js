import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { findByPhone } from '../api/client'
import { isValidPhone, normalizePhone } from '../utils/validators'
import Spinner from '../components/Spinner'

export default function MyTicket() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    if (!isValidPhone(phone)) return toast.error('Enter the 10-digit phone number used to register.')
    setLoading(true)
    try {
      const result = await findByPhone(normalizePhone(phone))
      if (!result?.token) throw new Error('No ticket was found for that phone number.')
      localStorage.setItem('kindnessJamTicketToken', result.token)
      navigate(`/ticket/${encodeURIComponent(result.token)}`)
    } catch (error) { toast.error(error.message || 'Could not find a ticket.') }
    finally { setLoading(false) }
  }
  return <main className="page-shell mx-auto max-w-lg px-4 py-10">
    <section className="surface p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-ku-900">Recover your ticket</h1>
      <p className="mt-2 text-sm text-slate-600">Enter the phone number you used when registering.</p>
      <form className="mt-6 space-y-5" onSubmit={submit}>
        <div><label className="field-label" htmlFor="recovery-phone">Phone number</label><input className="field" id="recovery-phone" type="tel" inputMode="numeric" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
        <button className="primary-button w-full" disabled={loading}>{loading ? <Spinner label="Searching…" /> : 'Find my ticket'}</button>
      </form>
      <p className="mt-5 text-center text-sm"><Link className="font-semibold text-ku-700 underline" to="/">Back to event page</Link></p>
    </section>
  </main>
}
