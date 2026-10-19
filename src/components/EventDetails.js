import event from '../config/event'

const mapUrl = 'https://maps.app.goo.gl/LQjSThtRdpREZHReA'

function DetailIcon({ type }) {
  const paths = {
    date: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    venue: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  }

  return <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg>
}

export default function EventDetails({ ticket = false }) {
  const containerClass = ticket
    ? 'mt-6 rounded-2xl border border-white/15 bg-[#32145e]/35 p-4 text-white sm:p-5'
    : 'surface mb-6 p-5 sm:p-6'
  const labelClass = ticket ? 'text-white/65' : 'text-slate-500'
  const valueClass = ticket ? 'text-white' : 'text-ku-900'

  function detailHeading(type, label) {
    return <div className="flex items-center gap-2">
      {ticket && <span className="text-[#f6a9e5]"><DetailIcon type={type} /></span>}
      <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${labelClass}`}>{label}</p>
    </div>
  }

  return <section className={containerClass} aria-label="Event details">
    <div className={`grid gap-x-5 gap-y-4 ${ticket ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
      <div className="min-w-0">
        {detailHeading('date', 'Date')}
        <p className={`mt-2 text-sm font-bold leading-snug sm:text-base ${valueClass}`}>{event.date}</p>
      </div>
      <div className="min-w-0">
        {detailHeading('time', 'Time')}
        <p className={`mt-2 text-sm font-bold leading-snug sm:text-base ${valueClass}`}>{event.time}</p>
      </div>
      <div className={ticket ? 'col-span-2 min-w-0 border-t border-white/15 pt-4' : 'min-w-0'}>
        {detailHeading('venue', 'Venue & location')}
        <p className={`mt-2 break-words text-sm font-bold leading-snug sm:text-base ${valueClass}`}>{event.venue}</p>
        <a className={`mt-3 inline-flex min-h-9 max-w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${ticket ? 'border-white/25 bg-white/10 text-white hover:border-white/50 hover:bg-white/15' : 'border-ku-100 text-ku-700 hover:bg-ku-50'}`}
          href={mapUrl} target="_blank" rel="noreferrer">
          Open location in Google Maps <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </section>
}
