import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getTicket } from '../api/client'
import TicketCard from '../components/TicketCard'
import Spinner from '../components/Spinner'
import { downloadElementPdf, downloadElementPng } from '../utils/download'

export default function Ticket() {
  const { token } = useParams()
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

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: 'My Kindness Jam ticket', url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Ticket link copied.')
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') toast.error('Could not share the ticket link.')
    }
  }

  if (loading) return <main className="page-shell px-4 py-12 text-center text-ku-700"><Spinner label="Loading your ticket…" /></main>
  if (error) return <main className="page-shell mx-auto max-w-xl px-4 py-12"><div className="surface p-6 text-center"><p className="text-red-800" role="alert">{error}</p><Link to="/my-ticket" className="primary-button mt-5">Recover ticket</Link></div></main>
  return <main className="page-shell mx-auto max-w-3xl px-4 py-8 sm:py-10">
    <TicketCard ticket={ticket} cardRef={cardRef} />
    <div className="mx-auto mt-5 grid max-w-xl gap-3 sm:grid-cols-3">
      <button className="primary-button" disabled={downloading} onClick={() => download(() => downloadElementPng(cardRef.current, `KindnessJam-${ticket.regNo}.png`))}>{downloading ? 'Preparing…' : 'Download Ticket (PNG)'}</button>
      <button className="secondary-button" disabled={downloading} onClick={() => download(() => downloadElementPdf(cardRef.current, `KindnessJam-${ticket.regNo}.pdf`))}>{downloading ? 'Preparing…' : 'Download Ticket (PDF)'}</button>
      <button className="secondary-button" onClick={share}>Share link</button>
    </div>
  </main>
}
