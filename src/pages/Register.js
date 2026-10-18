import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrg, getOrgs } from '../api/client'
import event from '../config/event'
import EventDetails from '../components/EventDetails'
import RegistrationForm from '../components/RegistrationForm'
import { Spinner } from '../components/Shared'
import jamImage from '../../images/jam img.jpeg'

function ClosedNotice({ orgName }) {
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center" role="status">
    <p className="text-lg font-bold text-amber-900">Registrations are closed</p>
    <p className="mt-2 text-sm text-amber-900">{orgName ? `Registrations for ${orgName} are` : 'Registrations for this organisation are'} closed or full. Please contact your organisation for assistance.</p>
  </section>
}

export default function Register() {
  const { orgCode: routeOrgCode } = useParams()
  const [orgCode, setOrgCode] = useState(routeOrgCode || '')
  const [orgs, setOrgs] = useState([])
  const [unconfiguredOrgNames, setUnconfiguredOrgNames] = useState([])
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
        if (!Array.isArray(list)) throw new Error('The organisation list is unavailable.')
        const normalizeName = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '')
        const configuredOrgs = event.organizations.map((item) => ({
          ...item,
          backendOrg: list.find((backendOrg) => normalizeName(backendOrg.orgName) === normalizeName(item.orgName)),
        }))
        if (active) {
          setOrgs(configuredOrgs)
          setUnconfiguredOrgNames(configuredOrgs.filter((item) => !item.backendOrg).map((item) => item.orgName))
          setOrgCode('')
        }
      })
    load.catch((requestError) => { if (active) setError(requestError.message || 'Could not load registration details.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [routeOrgCode])

  function selectOrg(code) {
    setOrgCode(code)
    setOrg(orgs.find((item) => item.backendOrg?.orgCode === code)?.backendOrg || null)
  }

  if (loading) return <main className="page-shell mx-auto max-w-3xl px-4 py-12 text-ku-700"><Spinner label="Loading registration…" /></main>
  if (error) return <main className="page-shell mx-auto max-w-3xl px-4 py-12"><div className="surface p-6 text-red-800" role="alert">{error}<p className="mt-4"><Link className="font-semibold underline" to="/register">Return to registration</Link></p></div></main>

  const remaining = org ? Math.max(0, Number(org.remaining ?? (Number(org.quota) - Number(org.used)))) : null
  const closed = org && (org.open === false || org.active === false || remaining <= 0)
  const attractions = event.guestAttractions?.length
    ? event.guestAttractions
    : Array.from({ length: 3 }, (_, index) => ({ name: `Guest attraction ${index + 1}`, image: '' }))
  return <main className="page-shell mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <div className="mb-6 overflow-hidden rounded-3xl bg-ku-900 text-white shadow-soft">
      <img className="h-40 w-full object-cover object-center sm:h-52" src={jamImage} alt="Kindness Jam music, dance and storytelling celebration" />
      <div className="p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Your invitation to</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Kindness Jam</h1>
        <p className="mt-2 text-sm text-white/85">{event.date} · Register with your organisation to claim your ticket.</p>
      </div>
    </div>
    <section className="mb-6" aria-labelledby="attractions-heading">
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ku-600">A day made to move you</p>
        <h2 className="mt-1 text-xl font-bold text-ku-900" id="attractions-heading">Guest attractions</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {attractions.map((attraction, index) => <article className="overflow-hidden rounded-2xl bg-white shadow-soft" key={`${attraction.name}-${index}`}>
          {attraction.image
            ? <img className="aspect-[4/3] w-full object-cover" src={attraction.image} alt={attraction.name} />
            : <div className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${['from-fuchsia-500 to-ku-900', 'from-orange-400 to-pink-600', 'from-ku-500 to-cyan-500'][index % 3]}`} aria-label={`${attraction.name} image space`}>
              <span className="rounded-full border border-white/60 bg-black/10 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white sm:px-3 sm:text-xs">Image coming soon</span>
            </div>}
          <p className="truncate px-2 py-2 text-center text-xs font-semibold text-ku-900 sm:px-3 sm:text-sm">{attraction.name}</p>
        </article>)}
      </div>
    </section>
    <EventDetails />
    {!routeOrgCode && orgs.length === 0
      ? <p className="surface p-6 text-sm text-slate-700">The organization list is unavailable right now.</p>
      : <section className="surface p-6 sm:p-8">
        {!routeOrgCode && <div className="mb-5">
          <label className="field-label" htmlFor="registration-organization">Select your NGO / College</label>
          <select className="field" id="registration-organization" value={orgCode} onChange={(change) => selectOrg(change.target.value)} required>
            <option value="">Choose your organisation</option>
            {orgs.map((item) => <option key={item.orgName} value={item.backendOrg?.orgCode || ''} disabled={!item.backendOrg}>
              {item.orgName} · Quota: {item.quota}{item.backendOrg?.open === false ? ' — Registration closed / full' : !item.backendOrg ? ' — Setup required' : ''}
            </option>)}
          </select>
          {unconfiguredOrgNames.length > 0 && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">
            These organizations are shown with their requested quotas, but registration is not enabled until they are added to the registration service: {unconfiguredOrgNames.join(', ')}.
          </p>}
        </div>}
        {org && <p className="mb-4 text-sm text-slate-600">
          {org.orgName}{Number.isFinite(remaining) && Number.isFinite(Number(org.quota)) ? ` · ${remaining} of ${org.quota} places remaining` : ''}
        </p>}
        {closed
          ? <ClosedNotice orgName={org.orgName} />
          : org && <RegistrationForm orgCode={org.orgCode} orgName={org.orgName} />}
      </section>}
    <div className="mt-5 flex flex-col items-center gap-3">
      <Link className="secondary-button" to="/my-ticket">Already Registered (My Ticket)</Link>
    </div>
  </main>
}
