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

  return <article ref={cardRef} className="mx-auto max-w-[760px] overflow-hidden rounded-[2rem] border border-white bg-[#fbf8ff] shadow-[0_28px_80px_rgba(62,25,111,0.22)]">
    <header className="relative isolate min-h-[180px] overflow-hidden bg-[#4c1fa5] px-6 py-7 sm:min-h-[210px] sm:px-10 sm:py-8">
      <img className="absolute inset-0 -z-20 h-full w-full object-cover object-center" src={jamImage} alt="" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#32116f]/90 via-[#5421a4]/70 to-[#7b2db8]/30" />
      <div className="absolute -right-10 -top-16 -z-10 h-48 w-48 rounded-full border border-white/20 sm:h-64 sm:w-64" />
      <div className="absolute -right-2 -top-8 -z-10 h-32 w-32 rounded-full border border-white/15 sm:h-44 sm:w-44" />
      <svg aria-hidden="true" className="absolute bottom-0 right-4 h-16 w-32 text-white/30 sm:right-8 sm:h-20 sm:w-40" viewBox="0 0 160 56" fill="none">
        <path d="M2 29h13l7-13 12 29 11-38 12 48 12-38 10 24 9-12h11l6-10 9 22 10-30 12 38 9-20h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="relative max-w-xl text-white">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/80">Your event pass</p>
        <h1 className="mt-2 text-[2.2rem] font-black leading-[0.98] tracking-[-0.06em] sm:text-5xl">Kindness Jam</h1>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85 sm:text-xs">Music <span className="px-1 text-[#ff8bd5]">·</span> Movement <span className="px-1 text-[#ff8bd5]">·</span> Community</p>
      </div>
      <div aria-hidden="true" className="absolute bottom-4 right-6 flex gap-1 sm:right-10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff87d2]" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/75" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd174]" />
      </div>
    </header>

    <section className="bg-gradient-to-br from-[#5823a5] via-[#57228d] to-[#40176f] px-6 py-6 text-white sm:px-10 sm:py-8">
      <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/85">
        Presented by Kindness Unlimited
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e7caff]">Participant</p>
          <p className="mt-1 break-words text-2xl font-black leading-tight tracking-[-0.04em] sm:text-3xl">{ticket.name}</p>
        </div>
        <div className="w-fit min-w-36 rounded-2xl border border-white/20 bg-[#32135d]/45 px-4 py-3 sm:text-right">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#e7caff]">Pass ID</p>
          <p className="mt-1 font-mono text-lg font-bold tracking-[0.08em] text-white">{ticket.regNo}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/15 pt-4">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#e7caff]">Organisation</p>
        <p className="mt-1 break-words text-base font-bold leading-snug">{ticket.orgName}</p>
      </div>

      <EventDetails ticket />
    </section>

    <section className="ticket-stub relative flex flex-col items-center bg-[#fbf8ff] px-5 py-6 text-center sm:py-7" aria-label="Ticket entry QR code">
      <span aria-hidden="true" className="absolute -left-4 top-0 h-8 w-8 -translate-y-1/2 rounded-full bg-[#f5edff]" />
      <span aria-hidden="true" className="absolute -right-4 top-0 h-8 w-8 -translate-y-1/2 rounded-full bg-[#f5edff]" />
      {ticket.checkedIn && <p className="mb-3 rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">Checked in ✅</p>}
      <span className="mb-4 rounded-full border border-[#e7c9ff] bg-[#f4e8ff] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#6a2da2]">scan to enter</span>
      <div ref={qrRef} className="rounded-[1.4rem] border border-[#e6d5f8] bg-white p-2.5 shadow-[0_12px_32px_rgba(76,31,120,0.12)]">
        <canvas ref={canvasRef} aria-label="Unique ticket QR code" />
      </div>
      {qrError && <p className="mt-2 text-sm text-red-700" role="alert">{qrError}</p>}
      <p className="mt-4 text-sm font-extrabold text-[#45206c]">Your all-access kindness pass</p>
      <p className="mt-1 text-xs text-[#786b86]">Keep it handy and show your QR at the entrance.</p>
      <div className="mt-5 w-full max-w-md rounded-2xl border border-[#e8dcf4] bg-gradient-to-br from-white to-[#f8efff] p-4 text-left">
        <h2 className="text-sm font-extrabold text-[#45206c]">Pack your festival essentials ✨</h2>
        <p className="mt-1 text-xs text-[#786b86]">It’s outdoors—bring along:</p>
        <ul className="mt-3 grid gap-2 text-xs font-semibold text-[#514361] sm:grid-cols-2">
          <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2"><span aria-hidden="true" className="text-base">🧢</span><span>Hat or cap</span></li>
          <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2"><span aria-hidden="true" className="text-base">💧</span><span>Water bottle</span></li>
          <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 sm:col-span-2"><span aria-hidden="true" className="text-base">🧺</span><span>Towel, picnic mat, or newspaper for sitting on the grass</span></li>
        </ul>
      </div>
    </section>
  </article>
}
