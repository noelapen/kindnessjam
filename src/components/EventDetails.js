import event from '../config/event'

export default function EventDetails({ ticket = false }) {
  const mapUrl = `https://maps.app.goo.gl/LQjSThtRdpREZHReA`
  const containerClass = ticket
    ? 'mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 text-white'
    : 'surface mb-6 p-5 sm:p-6'
  const labelClass = ticket ? 'text-white/65' : 'text-slate-500'
  const valueClass = ticket ? 'text-white' : 'text-ku-900'

  return <section className={containerClass} aria-label="Event details">
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>Date</p>
        <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{event.date}</p>
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>Time</p>
        <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{event.time}</p>
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>Venue &amp; location</p>
        <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{event.venue}</p>
        <a className={`mt-2 inline-flex min-h-9 items-center rounded-lg border px-3 py-1 text-xs font-bold transition ${ticket ? 'border-white/40 text-white hover:bg-white/10' : 'border-ku-100 text-ku-700 hover:bg-ku-50'}`}
          href={mapUrl} target="_blank" rel="noreferrer">
          Open location in Google Maps ↗
        </a>
      </div>
    </div>
  </section>
}
