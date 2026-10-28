import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrg, getOrgs } from '../api/client'
import event from '../config/event'
import RegistrationForm from '../components/RegistrationForm'
import { Spinner } from '../components/Shared'
import jamImage from '../../images/jam img.jpeg'

import iraImg from '../../images/irakhan.png'
import anshuImg from '../../images/anshu.png'
import avantiImg from '../../images/awanti.jpeg'
import anishriyaImg from '../../images/anishriya.png'

const guestAttractions = [
  { name: "Ira Khan", role: "Founder & CEO Agatsu Foundation", image: iraImg, position: "center 15%" },
  { name: "Anshu Gupta", role: "Founder of Goonj", image: anshuImg, position: "center 10%" },
  { name: "Avanti Nagral", role: "Singer & Entrepreneur · Founder & CEO, BreadButter", image: avantiImg },
  { name: "Anish and Riya", role: "Acapella - Beat Box", image: anishriyaImg },
]

function ClosedNotice({ orgName }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center" role="status">
      <p className="text-lg font-bold text-amber-900">Registrations are closed</p>
      <p className="mt-2 text-sm text-amber-900">
        {orgName ? `Registrations for ${orgName} are` : 'Registrations for this organisation are'} closed or full. Please contact your organisation for assistance.
      </p>
    </section>
  )
}

export default function Register() {
  const { orgCode: routeOrgCode } = useParams()
  const [orgCode, setOrgCode] = useState(routeOrgCode || '')
  const [orgs, setOrgs] = useState([])
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setOrg(null)
    setError('')
    setLoading(true)
    const load = routeOrgCode
      ? getOrg(routeOrgCode).then((result) => {
          if (!result || !result.orgCode) throw new Error('This organisation link is not valid.')
          if (active) {
            setOrg(result)
            setOrgCode(result.orgCode)
          }
        })
      : getOrgs().then((result) => {
          const list = Array.isArray(result) ? result : result?.orgs
          if (!Array.isArray(list) || list.some((item) => !item?.orgCode || !item?.orgName)) {
            throw new Error('The organisation list is unavailable.')
          }
          if (active) {
            setOrgs(list)
            setOrgCode('')
          }
        })
    load
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load registration details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [routeOrgCode])

  function selectOrg(code) {
    setOrgCode(code)
    setOrg(orgs.find((item) => item.orgCode === code) || null)
  }

  if (loading) {
    return (
      <main className="page-shell mx-auto max-w-3xl px-4 py-12 text-ku-700">
        <Spinner label="Loading registration…" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-shell mx-auto max-w-3xl px-4 py-12">
        <div className="surface p-6 text-red-800" role="alert">
          {error}
          <p className="mt-4">
            <Link className="font-semibold underline" to="/register">
              Return to registration
            </Link>
          </p>
        </div>
      </main>
    )
  }

  const remaining = org ? Math.max(0, Number(org.remaining ?? (Number(org.quota) - Number(org.used)))) : null
  const closed = org && (org.open === false || org.active === false || remaining <= 0)

  return (
    <main className="page-shell mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6 overflow-hidden rounded-3xl bg-ku-900 text-white shadow-soft">
        <img
          className="h-40 w-full object-cover object-center sm:h-52"
          src={jamImage}
          alt="Kindness Jam music, dance and storytelling celebration"
        />
        <div className="p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Your invitation to</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Kindness Jam</h1>
          <p className="mt-2 text-sm text-white/85">
            {event.date} · Register with your organisation to claim your ticket.
          </p>
        </div>
      </div>

      {/* Special Guests Section */}
      <section className="mb-6" aria-labelledby="attractions-heading">
        {/* Section Header */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-ku-600">
            WHAT'S IN STORE
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-ku-900" id="attractions-heading">
            Meet our special guests
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            An unforgettable day of music, movement and community, with surprises from people who believe in kindness as much as you do.
          </p>
        </div>

        {/* Guest Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guestAttractions.map((guest, index) => (
            <article
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-soft"
              key={`${guest.name}-${index}`}
            >
              {guest.image ? (
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    className="h-full w-full object-cover"
                    style={{ objectPosition: guest.position || 'center center' }}
                    src={guest.image}
                    alt={guest.name}
                  />
                </div>
              ) : (
                <div
                  className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${['from-fuchsia-500 to-ku-900', 'from-orange-400 to-pink-600', 'from-ku-500 to-cyan-500'][index % 3]
                    }`}
                  aria-label={`${guest.name} image space`}
                >
                  <span className="rounded-full border border-white/60 bg-black/10 px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
                    Reveal coming soon
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col justify-center px-3 py-3.5 text-center">
                <p className="text-sm font-bold text-ku-900">{guest.name}</p>
                {guest.role && (
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{guest.role}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* ...and many more artists text banner */}
        <div className="mt-6 text-center">
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-ku-600 sm:text-sm">
            ...AND MANY MORE ARTISTS
          </span>
        </div>
      </section>

      {/* Save the date Section */}
      <section className="surface mb-6 p-6 sm:p-8" aria-labelledby="event-details-heading">
        <h2 className="text-xl font-bold text-ku-900" id="event-details-heading">
          Save the date
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ku-600">DATE</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Saturday, 28 November 2026</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ku-600">TIME</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">3:30pm</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ku-600">VENUE</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              D.P.R.C (D'Monte Park Recreation Center), St Andrews Rd, Bandra West, Mumbai
            </p>
            <a
              href="https://maps.app.goo.gl/LQjSThtRdpREZHReA"
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button mt-4 inline-flex items-center justify-center text-sm"
            >
              Get directions
            </a>
          </div>
        </div>
        {org && Number.isFinite(remaining) && Number.isFinite(Number(org.quota)) && (
          <div className="mt-5 rounded-2xl border border-ku-200 bg-[#f3ecf9] px-4 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-base font-semibold italic text-ku-900 sm:text-lg">
              {org.orgName} · {remaining} of {org.quota} places remaining
            </p>
          </div>
        )}
      </section>

      {/* Registration Selection & Form */}
      {!routeOrgCode && orgs.length === 0 ? (
        <p className="surface p-6 text-sm text-slate-700">The organization list is unavailable right now.</p>
      ) : (
        <section className="surface p-6 sm:p-8">
          {!routeOrgCode && (
            <div className="mb-5">
              <label className="field-label" htmlFor="registration-organization">
                Select your NGO / College
              </label>
              <select
                className="field"
                id="registration-organization"
                value={orgCode}
                onChange={(change) => selectOrg(change.target.value)}
                required
              >
                <option value="">Choose your organisation</option>
                {orgs.map((item) => (
                  <option key={item.orgCode} value={item.orgCode}>
                    {item.orgName} · Quota: {item.quota}
                    {item.open === false || item.active === false
                      ? ' — Registration closed'
                      : Number(item.remaining ?? (Number(item.quota) - Number(item.used))) <= 0
                      ? ' — Full'
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {closed ? (
            <ClosedNotice orgName={org.orgName} />
          ) : (
            org && <RegistrationForm orgCode={org.orgCode} orgName={org.orgName} />
          )}
        </section>
      )}

      <div className="mt-5 flex flex-col items-center gap-3">
        <Link className="secondary-button" to="/my-ticket">
          Already Registered (My Ticket)
        </Link>
      </div>
    </main>
  )
}