import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrg } from '../api/client'
import event from '../config/event'
import RegistrationForm from '../components/RegistrationForm'
import Spinner from '../components/Spinner'

function ClosedNotice({ orgName }) {
  return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center" role="status">
    <p className="text-lg font-bold text-amber-900">Registrations are closed</p>
    <p className="mt-2 text-sm text-amber-900">{orgName ? `Registrations for ${orgName} are` : 'Registrations for this organisation are'} closed or full. Please contact your organisation for assistance.</p>
  </section>
}

export default function Register() {
  const { orgCode } = useParams()
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getOrg(orgCode).then((result) => {
      if (!result || !result.orgCode) throw new Error('This organisation link is not valid.')
      if (active) setOrg(result)
    }).catch((requestError) => { if (active) setError(requestError.message || 'Could not load this organisation.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orgCode])

  if (loading) return <main className="page-shell mx-auto max-w-3xl px-4 py-12 text-ku-700"><Spinner label="Loading registration…" /></main>
  if (error) return <main className="page-shell mx-auto max-w-3xl px-4 py-12"><div className="surface p-6 text-red-800" role="alert">{error}<p className="mt-4"><Link className="font-semibold underline" to="/">Return to event page</Link></p></div></main>

  const remaining = Math.max(0, Number(org.remaining ?? (Number(org.quota) - Number(org.used))))
  const closed = org.open === false || org.active === false || remaining <= 0
  return <main className="page-shell mx-auto max-w-3xl px-4 py-8 sm:py-12">
    <div className="mb-6">
      <p className="text-sm font-semibold text-ku-600">Kindness Jam · {event.date}</p>
      <h1 className="mt-2 text-3xl font-bold text-ku-900">Register with {org.orgName}</h1>
      <p className="mt-2 text-sm text-slate-600">{remaining} of {org.quota} tickets remaining</p>
    </div>
    {closed ? <ClosedNotice orgName={org.orgName} /> : <section className="surface p-6 sm:p-8"><RegistrationForm orgCode={org.orgCode} orgName={org.orgName} /></section>}
    <p className="mt-5 text-center text-sm"><Link className="font-semibold text-ku-700 underline" to="/">Back to event page</Link></p>
  </main>
}
