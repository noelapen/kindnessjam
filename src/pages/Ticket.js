import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { findByPhone, getTicket } from '../api/client'
import TicketCard from '../components/TicketCard'
import { Spinner } from '../components/Shared'
import { downloadElementPdf, downloadElementPng } from '../utils/download'
import { isValidPhone, normalizePhone } from '../utils/validators'

function TicketRecovery() {
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
      <p className="mt-5 text-center text-sm"><Link className="font-semibold text-ku-700 underline" to="/register">Back to registration</Link></p>
    </section>
  </main>
}

function TicketDetails() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    let active = true
    const secret = decodeURIComponent(token)
    localStorage.setItem('kindnessJamTicketToken', secret)
    getTicket(secret).then((result) => {
      if (!result?.regNo || !result?.name) throw new Error('This ticket could not be found.')
      if (active) setTicket({ ...result, token: secret })
    }).catch((requestError) => { if (active) setError(requestError.message || 'Could not load this ticket.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  async function download(downloadAction) {
    setDownloading(true)
    try { await downloadAction() } catch (downloadError) {
      toast.error(downloadError.message || 'Ticket could not be downloaded.')
    } finally { setDownloading(false) }
  }

  if (loading) return <main className="page-shell px-4 py-12 text-center text-ku-700"><Spinner label="Loading your ticket…" /></main>
  if (error) return <main className="page-shell mx-auto max-w-xl px-4 py-12"><div className="surface p-6 text-center"><p className="text-red-800" role="alert">{error}</p><Link to="/my-ticket" className="primary-button mt-5">Recover ticket</Link></div></main>
  return <main className="page-shell mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <TicketCard ticket={ticket} cardRef={cardRef} />
    <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-2">
      <button className="primary-button" disabled={downloading} onClick={() => download(() => downloadElementPng(cardRef.current, `KindnessJam-${ticket.regNo}.png`))}>{downloading ? 'Preparing…' : 'Download Ticket (PNG)'}</button>
      <button className="secondary-button" disabled={downloading} onClick={() => download(() => downloadElementPdf(cardRef.current, `KindnessJam-${ticket.regNo}.pdf`))}>{downloading ? 'Preparing…' : 'Download Ticket (PDF)'}</button>
    </div>
  </main>
}

export default function Ticket({ recover = false }) {
  return recover ? <TicketRecovery /> : <TicketDetails />
}
