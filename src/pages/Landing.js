import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrgs } from '../api/client'
import event from '../config/event'
import Spinner from '../components/Spinner'

function OrgSelect({ orgs, value, onChange, disabled = false }) {
  return <div>
    <label className="field-label" htmlFor="organization">Select your NGO / College</label>
    <select className="field" id="organization" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
      <option value="">Choose your organisation</option>
      {orgs.map((org) => <option key={org.orgCode} value={org.orgCode}>
        {org.orgName}{org.open === false ? ' — Registration closed / full' : ''}
      </option>)}
    </select>
  </div>
}

export default function Landing() {
  const [orgs, setOrgs] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getOrgs().then((result) => {
      const list = Array.isArray(result) ? result : result?.orgs
      if (!Array.isArray(list)) throw new Error('The organisation list is unavailable.')
      if (active) setOrgs(list.filter((org) => org.active !== false))
    }).catch((requestError) => {
      if (active) setError(requestError.message || 'Could not load organisations.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const chosen = orgs.find((org) => org.orgCode === selected)
  function continueToForm() {
    if (!chosen) return toast.error('Select your NGO or College to continue.')
    navigate(`/r/${encodeURIComponent(chosen.orgCode)}`)
  }

  return <main className="page-shell">
    <section className="bg-gradient-to-br from-ku-900 via-ku-700 to-ku-500 px-4 py-12 text-white sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Kindness Unlimited presents</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">Kindness Jam</h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">Come together for a day of connection, community, and kindness.</p>
        <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[['Date', event.date], ['Time', event.time], ['Venue', event.venue]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/20 bg-white/10 p-4"><p className="text-xs uppercase tracking-wide text-white/70">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
        </div>
      </div>
    </section>
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="surface p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-ku-900">Save your place</h2>
        <p className="mt-2 text-sm text-slate-600">Choose the NGO or College you are attending with.</p>
        {error ? <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{error} <button className="ml-2 font-semibold underline" onClick={() => window.location.reload()}>Try again</button></div> : loading ? <div className="mt-6 text-ku-700"><Spinner label="Loading organisations…" /></div> : orgs.length ? <>
          <div className="mt-6"><OrgSelect orgs={orgs} value={selected} onChange={setSelected} /></div>
          {chosen?.open === false && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">Registration for {chosen.orgName} is full or closed.</p>}
          <button className="primary-button mt-5 w-full sm:w-auto" onClick={continueToForm} disabled={!selected}>Continue to registration</button>
        </> : <p className="mt-6 rounded-xl bg-ku-50 p-4 text-sm text-ku-900">There are no active organisations available for registration right now.</p>}
      </section>
      <aside className="surface flex flex-col justify-center p-6 sm:p-8">
        <h2 className="text-xl font-bold text-ku-900">Already registered?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Retrieve your ticket if you can no longer find the link.</p>
        <Link className="secondary-button mt-5 w-full" to="/my-ticket">Recover my ticket</Link>
      </aside>
    </div>
  </main>
}
