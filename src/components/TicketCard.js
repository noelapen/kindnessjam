import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import event from '../config/event'

export default function TicketCard({ ticket, qrRef, cardRef }) {
  const [qrError, setQrError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    let active = true
    QRCode.toCanvas(canvasRef.current, ticket.token, {
      errorCorrectionLevel: 'H',
      width: 360,
      margin: 2,
      color: { dark: '#2E1065', light: '#FFFFFF' },
    }).then(() => {
      if (active) setQrError('')
    }).catch((error) => {
      if (active) setQrError(error.message || 'Could not create the ticket QR code.')
    })
    return () => { active = false }
  }, [ticket.token])

  return <article ref={cardRef} className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-white shadow-soft">
    <div className="bg-gradient-to-br from-ku-900 via-ku-700 to-ku-500 p-6 text-white sm:p-8">
      <p className="text-xs font-bold tracking-[0.2em]">KINDNESS UNLIMITED</p>
      <h1 className="mt-2 text-3xl font-extrabold">Kindness Jam</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-white/70">PARTICIPANT</p><p className="mt-1 font-semibold">{ticket.name}</p></div>
        <div><p className="text-white/70">REGISTRATION NO.</p><p className="mt-1 font-semibold">{ticket.regNo}</p></div>
        <div className="col-span-2"><p className="text-white/70">ORGANISATION</p><p className="mt-1 font-semibold">{ticket.orgName}</p></div>
      </div>
      <div className="mt-5 grid gap-2 border-t border-dashed border-white/40 pt-4 text-sm sm:grid-cols-3">
        <p><span className="block text-white/70">DATE</span>{event.date}</p>
        <p><span className="block text-white/70">TIME</span>{event.time}</p>
        <p><span className="block text-white/70">VENUE</span>{event.venue}</p>
      </div>
    </div>
    <div className="relative flex flex-col items-center px-5 py-6 text-center">
      <span aria-hidden="true" className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#fbf9ff]" />
      <span aria-hidden="true" className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#fbf9ff]" />
      {ticket.checkedIn && <p className="mb-3 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">Checked in ✅</p>}
      <div ref={qrRef} className="rounded-2xl border border-ku-100 bg-white p-3">
        <canvas ref={canvasRef} aria-label="Unique ticket QR code" />
      </div>
      {qrError && <p className="mt-2 text-sm text-red-700" role="alert">{qrError}</p>}
      <p className="mt-3 text-xs text-slate-500">Present this unique QR code at the entrance.</p>
    </div>
    <div className="mx-5 mb-5 rounded-2xl bg-ku-50 p-4 text-left sm:mx-6">
      <h2 className="font-bold text-ku-900">Important Instructions</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">The event is outdoors, so please make sure to bring:<br />🎩 Hat / Cap<br />💧 Water bottle<br />🧺 Towel, picnic mat, or newspaper for sitting on the grass</p>
    </div>
    <p className="px-5 pb-6 text-center text-xs text-slate-600">Please show this QR code at the entrance. One QR = one entry.</p>
  </article>
}
