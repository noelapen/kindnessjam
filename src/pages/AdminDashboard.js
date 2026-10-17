import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addOrg, adminSummary, updateOrg } from '../api/client'
import DataTable from '../components/DataTable'
import Spinner from '../components/Spinner'
import StatCard from '../components/StatCard'

function ProgressBar({ used = 0, quota = 0 }) {
  const percentage = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  return <div className="min-w-24">
    <div className="h-2 overflow-hidden rounded-full bg-ku-100" role="progressbar" aria-label="Tickets registered" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
      <div className="h-full rounded-full bg-ku-500" style={{ width: `${percentage}%` }} />
    </div><span className="mt-1 block text-xs text-slate-500">{percentage}%</span>
  </div>
}

function counts(orgs) {
  return orgs.reduce((total, org) => ({
    quota: total.quota + Number(org.quota || 0),
    registered: total.registered + Number(org.used ?? org.registered ?? 0),
    checkedIn: total.checkedIn + Number(org.checkedIn ?? org.checkedInCount ?? 0),
  }), { quota: 0, registered: 0, checkedIn: 0 })
}

function status(org) {
  if (org.active === false || org.open === false && Number(org.remaining ?? (org.quota - org.used)) > 0) return 'Closed'
  if (Number(org.remaining ?? (org.quota - org.used)) <= 0) return 'Full'
  return 'Open'
}

export default function AdminDashboard() {
  const adminKey = sessionStorage.getItem('kindnessJamAdmin') || ''
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [edits, setEdits] = useState({})
  const [form, setForm] = useState({ orgName: '', type: 'NGO', quota: '', deadline: '' })
  const [adding, setAdding] = useState(false)
  const [newOrgDetails, setNewOrgDetails] = useState(null)
  const [createdWithoutCredentials, setCreatedWithoutCredentials] = useState(false)
  const navigate = useNavigate()

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await adminSummary(adminKey)
      const orgs = Array.isArray(result) ? result : result?.orgs
      if (!Array.isArray(orgs)) throw new Error('The dashboard data is unavailable.')
      setSummary({ ...result, orgs })
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'Could not load the dashboard.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [adminKey])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(() => refresh(true), 30000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const orgs = summary?.orgs || []
  const derived = useMemo(() => counts(orgs), [orgs])
  const totals = summary?.totals || {}
  const totalQuota = totals.totalQuota ?? totals.quota ?? derived.quota
  const registered = totals.totalRegistered ?? totals.registered ?? derived.registered
  const checkedIn = totals.totalCheckedIn ?? totals.checkedIn ?? derived.checkedIn
  const remaining = totals.totalRemaining ?? totals.remaining ?? Math.max(0, totalQuota - registered)

  function patch(org, field, value) {
    setEdits((current) => ({ ...current, [org.orgCode]: { ...current[org.orgCode], [field]: value } }))
  }

  async function save(org) {
    const edit = edits[org.orgCode] || {}
    const quota = Number(edit.quota ?? org.quota)
    if (!Number.isInteger(quota) || quota < Number(org.used ?? org.registered ?? 0)) {
      return toast.error('Quota must be a whole number and cannot be lower than registrations already used.')
    }
    try {
      await updateOrg({
        adminKey,
        orgCode: org.orgCode,
        quota,
        deadline: edit.deadline ?? org.deadline ?? '',
        active: edit.active ?? org.active !== false,
      })
      toast.success(`${org.orgName} updated.`)
      setEdits((current) => { const next = { ...current }; delete next[org.orgCode]; return next })
      refresh(true)
    } catch (saveError) { toast.error(saveError.message || 'Could not update organisation.') }
  }

  async function createOrganization(event) {
    event.preventDefault()
    if (!form.orgName.trim()) return toast.error('Enter an organisation name.')
    if (!Number.isInteger(Number(form.quota)) || Number(form.quota) < 0) return toast.error('Enter a valid ticket quota.')
    setAdding(true)
    try {
      const result = await addOrg({
        adminKey,
        orgName: form.orgName.trim(),
        type: form.type,
        quota: Number(form.quota),
        deadline: form.deadline,
      })
      setNewOrgDetails(result?.orgCode || result?.passcode ? result : null)
      setCreatedWithoutCredentials(!result?.orgCode || !result?.passcode)
      setForm({ orgName: '', type: 'NGO', quota: '', deadline: '' })
      toast.success('Organisation added.')
      refresh(true)
    } catch (addError) { toast.error(addError.message || 'Could not add organisation.') }
    finally { setAdding(false) }
  }

  const columns = [
    { key: 'orgName', label: 'Organisation', render: (org) => <Link className="font-semibold text-ku-700 underline" to={`/admin/org/${encodeURIComponent(org.orgCode)}`}>{org.orgName}</Link> },
    { key: 'type', label: 'Type' },
    { key: 'quota', label: 'Quota' },
    { key: 'used', label: 'Registered', render: (org) => org.used ?? org.registered ?? 0 },
    { key: 'remaining', label: 'Remaining', render: (org) => Math.max(0, Number(org.remaining ?? (org.quota - (org.used ?? org.registered ?? 0)))) },
    { key: 'checkedIn', label: 'Checked-in', render: (org) => org.checkedIn ?? org.checkedInCount ?? 0 },
    { key: 'progress', label: 'Progress', render: (org) => <ProgressBar used={Number(org.used ?? org.registered ?? 0)} quota={Number(org.quota)} /> },
    { key: 'status', label: 'Status', render: (org) => {
      const value = status(org)
      const styles = value === 'Open' ? 'bg-green-100 text-green-800' : value === 'Full' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
      return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{value}</span>
    } },
    { key: 'actions', label: 'Actions', render: (org) => {
      const edit = edits[org.orgCode] || {}
      const baseDate = String(edit.deadline ?? org.deadline ?? '').slice(0, 10)
      const link = `${window.location.origin}/r/${encodeURIComponent(org.orgCode)}`
      return <div className="min-w-64 space-y-2">
        <div className="flex gap-2"><label className="sr-only" htmlFor={`quota-${org.orgCode}`}>Quota for {org.orgName}</label><input id={`quota-${org.orgCode}`} className="w-20 rounded-lg border border-ku-100 px-2 py-1" type="number" min={org.used ?? org.registered ?? 0} value={edit.quota ?? org.quota} onChange={(event) => patch(org, 'quota', event.target.value)} aria-label={`Quota for ${org.orgName}`} />
          <label className="sr-only" htmlFor={`deadline-${org.orgCode}`}>Registration deadline for {org.orgName}</label><input id={`deadline-${org.orgCode}`} className="rounded-lg border border-ku-100 px-2 py-1" type="date" value={baseDate} onChange={(event) => patch(org, 'deadline', event.target.value)} /></div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={edit.active ?? org.active !== false} onChange={(event) => patch(org, 'active', event.target.checked)} /> Active</label>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg bg-ku-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => save(org)}>Save</button>
          <button className="rounded-lg border border-ku-100 px-3 py-2 text-xs font-semibold text-ku-700" onClick={() => { navigator.clipboard.writeText(link).then(() => toast.success('Registration link copied.')).catch(() => toast.error('Could not copy the link.')) }}>Copy link</button>
          <a className="rounded-lg border border-ku-100 px-3 py-2 text-xs font-semibold text-ku-700" href={`https://wa.me/?text=${encodeURIComponent(`Register for Kindness Jam: ${link}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      </div>
    } },
  ]

  if (loading) return <main className="page-shell px-4 py-12 text-ku-700"><Spinner label="Loading dashboard…" /></main>
  return <main className="page-shell mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-ku-900">KU Admin dashboard</h1><p className="mt-1 text-sm text-slate-600">Organisation and event registration overview</p></div>
      <div className="flex gap-2"><Link className="secondary-button" to="/admin/scan">Open entry scanner</Link><button className="secondary-button" onClick={() => refresh(true)} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><button className="secondary-button" onClick={() => { sessionStorage.removeItem('kindnessJamAdmin'); navigate('/admin/login', { replace: true }) }}>Sign out</button></div>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{error} <button className="font-semibold underline" onClick={() => refresh()}>Retry</button></p>}
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Organisations" value={orgs.length} /><StatCard label="Total quota" value={totalQuota} /><StatCard label="Registered" value={registered} /><StatCard label="Checked-in" value={checkedIn} /><StatCard label="Remaining" value={remaining} />
    </section>
    <section className="surface mt-6 p-5 sm:p-6"><h2 className="mb-4 text-xl font-bold text-ku-900">All organisations</h2><DataTable columns={columns} rows={orgs} emptyMessage="No organisations have been added yet." /></section>
    <section className="surface mt-6 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-ku-900">Add organisation</h2>
      {newOrgDetails ? <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-900"><p className="font-semibold">Organisation created. Share these sign-in details securely with the organisation admin:</p><p className="mt-2">Org code: <strong>{newOrgDetails.orgCode || 'Not returned by the backend'}</strong></p><p>Passcode: <strong>{newOrgDetails.passcode || 'Not returned by the backend'}</strong></p></div> : null}
      {createdWithoutCredentials && !newOrgDetails && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">The organisation was created, but the backend did not return its generated org code and passcode. Retrieve the credentials securely from the backend before sharing access.</p>}
      <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={createOrganization}>
        <div><label className="field-label" htmlFor="new-org-name">Organisation name</label><input className="field" id="new-org-name" required value={form.orgName} onChange={(event) => setForm({ ...form, orgName: event.target.value })} /></div>
        <div><label className="field-label" htmlFor="new-org-type">Type</label><select className="field" id="new-org-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>NGO</option><option>College</option></select></div>
        <div><label className="field-label" htmlFor="new-org-quota">Quota</label><input className="field" id="new-org-quota" type="number" min="0" required value={form.quota} onChange={(event) => setForm({ ...form, quota: event.target.value })} /></div>
        <div><label className="field-label" htmlFor="new-org-deadline">Deadline</label><input className="field" id="new-org-deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></div>
        <div className="flex items-end"><button className="primary-button w-full" disabled={adding}>{adding ? 'Adding…' : 'Add organisation'}</button></div>
      </form>
    </section>
  </main>
}
