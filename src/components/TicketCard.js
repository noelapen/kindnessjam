import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import EventDetails from './EventDetails'
import jamImage from '../../images/jam img.jpeg'

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

  return <article ref={cardRef} className="mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-ku-100 bg-white shadow-[0_24px_70px_rgba(46,16,101,0.18)]">
    <div className="relative h-36 overflow-hidden sm:h-44">
      <img className="h-full w-full object-cover object-center" src={jamImage} alt="" />
      <div className="absolute inset-0 bg-gradient-to-r from-ku-900/90 via-ku-900/55 to-transparent" />
      <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 text-white sm:px-8">
        <p className="text-[10px] font-bold tracking-[0.22em] text-white/80">YOUR EVENT PASS</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Kindness Jam</h1>
        <p className="mt-1 text-xs font-medium text-white/85">MUSIC · MOVEMENT · COMMUNITY</p>
      </div>
    </div>
    <div className="bg-gradient-to-br from-ku-900 via-ku-700 to-ku-500 p-6 text-white sm:p-8">
      <p className="text-xs font-semibold tracking-wide text-white/75">Presented by Kindness Unlimited</p>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-white/70">PARTICIPANT</p><p className="mt-1 font-semibold">{ticket.name}</p></div>
        <div><p className="text-white/70">REGISTRATION NO.</p><p className="mt-1 font-semibold">{ticket.regNo}</p></div>
        <div className="col-span-2"><p className="text-white/70">ORGANISATION</p><p className="mt-1 font-semibold">{ticket.orgName}</p></div>
      </div>
      <EventDetails ticket />
    </div>
    <div className="relative flex flex-col items-center border-t-2 border-dashed border-ku-100 px-5 py-6 text-center">
      <span aria-hidden="true" className="absolute -left-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#fbf9ff]" />
      <span aria-hidden="true" className="absolute -right-3 top-0 h-6 w-6 -translate-y-1/2 rounded-full bg-[#fbf9ff]" />
      {ticket.checkedIn && <p className="mb-3 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">Checked in ✅</p>}
      <span className="mb-3 rounded-full bg-orange-100 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.16em] text-orange-800">Admit one · scan to enter</span>
      <div ref={qrRef} className="rounded-3xl border-4 border-orange-300 bg-white p-3 shadow-[0_10px_30px_rgba(234,88,12,0.15)]">
        <canvas ref={canvasRef} aria-label="Unique ticket QR code" />
      </div>
      {qrError && <p className="mt-2 text-sm text-red-700" role="alert">{qrError}</p>}
      <p className="mt-3 text-sm font-bold text-ku-900">Your all-access kindness pass</p>
      <p className="mt-1 text-xs text-slate-500">Keep it handy and show your QR at the entrance.</p>
    </div>
    <div className="mx-5 mb-5 rounded-2xl bg-ku-50 p-4 text-left sm:mx-6">
      <h2 className="font-bold text-ku-900">Important Instructions</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">The event is outdoors, so please make sure to bring:<br />🎩 Hat / Cap<br />💧 Water bottle<br />🧺 Towel, picnic mat, or newspaper for sitting on the grass</p>
    </div>
    <p className="px-5 pb-6 text-center text-xs text-slate-600">Please show this QR code at the entrance. One QR = one entry.</p>
  </article>
}
