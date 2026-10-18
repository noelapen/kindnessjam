import { Link } from 'react-router-dom'
import event from '../config/event'
import jamImage from '../../images/jam img.jpeg'

export default function Landing() {
  return <main className="page-shell">
    <section className="bg-gradient-to-br from-ku-900 via-ku-700 to-ku-500 px-4 py-12 text-white sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Kindness Unlimited presents</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">Kindness Jam</h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">Come together for a day of connection, community, and kindness.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Date</p>
              <p className="mt-1 font-semibold">{event.date}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">Time</p>
              <p className="mt-1 font-semibold">{event.time}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-white/70">Venue</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{event.venue}</p>
                <a
                  className="inline-flex min-h-8 items-center justify-center rounded-lg border border-white/50 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/10"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Show map
                </a>
              </div>
            </div>
          </div>
        </div>
        <img
          className="mx-auto max-h-[34rem] w-full max-w-md rounded-2xl object-contain shadow-2xl"
          src={jamImage}
          alt="Kindness Jam event poster"
        />
      </div>
    </section>
    <div className="mx-auto grid max-w-4xl gap-5 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-10">
      <Link className="surface flex min-h-40 flex-col justify-center p-6 transition hover:-translate-y-1 sm:p-8" to="/register">
        <span className="text-sm font-semibold uppercase tracking-wide text-ku-600">Join the event</span>
        <span className="mt-2 text-2xl font-bold text-ku-900">Volunteer registration</span>
        <span className="mt-2 text-sm leading-6 text-slate-600">Fill in your details and receive your registration ticket and QR code.</span>
        <span className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-ku-700 px-5 py-3 font-semibold text-white">Register as a volunteer</span>
      </Link>
      <Link className="surface flex min-h-40 flex-col justify-center p-6 transition hover:-translate-y-1 sm:p-8" to="/admin/login">
        <span className="text-sm font-semibold uppercase tracking-wide text-ku-600">Event team</span>
        <span className="mt-2 text-2xl font-bold text-ku-900">Admin login</span>
        <span className="mt-2 text-sm leading-6 text-slate-600">Open participant records and verify event tickets at the entrance.</span>
        <span className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl border border-ku-100 bg-white px-5 py-3 font-semibold text-ku-700">Sign in as admin</span>
      </Link>
    </div>
  </main>
}
