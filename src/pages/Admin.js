import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import {
  addOrg,
  adminLogin,
  adminOrgRegistrations,
  adminSummary,
  updateOrg,
  verifyRegistrationNumber,
  verifyTicketToken,
} from '../api/client'
import LoginForm from '../components/LoginForm'
import { DataTable, Spinner, StatCard } from '../components/Shared'
import event from '../config/event'
import { downloadCsv } from '../utils/download'

function AdminLogin() {
  const navigate = useNavigate()
  async function signIn({ adminKey }) {
    const result = await adminLogin(adminKey)
    if (result?.ok === false) throw new Error('The admin key was not accepted.')
    sessionStorage.setItem('kindnessJamAdmin', adminKey)
    navigate('/admin', { replace: true })
  }

  return <LoginForm
    title="Admin Login"
    description="Enter your authorized event-team key to continue."
    errorMessage="Could not sign in."
    onSubmit={signIn}
    fields={[
      { id: 'admin-key', name: 'adminKey', label: 'Admin key', type: 'password', autoComplete: 'current-password' },
    ]}
  />
}

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

function AdminDashboard() {
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
    // { key: 'type', label: 'Type' },
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
      <div className="flex flex-wrap gap-2">
        <a className="secondary-button" href={event.participantSheetUrl} target="_blank" rel="noreferrer">View participant sheet</a>
        <Link className="primary-button" to="/admin/scan">Scan QR for attendance</Link>
        <button className="secondary-button" onClick={() => refresh(true)} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
        <button className="secondary-button" onClick={() => { sessionStorage.removeItem('kindnessJamAdmin'); navigate('/admin/login', { replace: true }) }}>Sign out</button>
      </div>
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

function AdminOrg() {
  const { orgCode } = useParams()
  const adminKey = sessionStorage.getItem('kindnessJamAdmin') || ''
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(() => {
    let mounted = true
    setLoading(true)
    adminOrgRegistrations(adminKey, orgCode).then((result) => {
      const list = Array.isArray(result) ? result : result?.registrations
      if (!Array.isArray(list)) throw new Error('The registration list is unavailable.')
      if (mounted) { setRows(list); setError('') }
    }).catch((requestError) => { if (mounted) setError(requestError.message || 'Could not load registrations.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [adminKey, orgCode])
  useEffect(() => load(), [load])
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    return rows.filter((row) => !value || [row.regNo, row.name, row.phone].some((item) => String(item || '').toLowerCase().includes(value)))
  }, [rows, query])
  const columns = [
    { key: 'regNo', label: 'Reg No' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
    // { key: 'registeredAt', label: 'Registered at', render: (row) => row.registeredAt || row.registered_at || '—' },
    { key: 'checkedIn', label: 'Checked-in', render: (row) => row.checkedIn ? `Yes${row.checkedInAt ? ` · ${row.checkedInAt}` : ''}` : 'No' },
  ]
  return <main className="page-shell mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <Link className="text-sm font-semibold text-ku-700 underline" to="/admin">← Back to dashboard</Link>
    <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold text-ku-900">Organisation registrations</h1><p className="mt-1 text-sm text-slate-600">{orgCode}</p></div>
      <div className="flex w-full gap-2 sm:w-auto"><label className="sr-only" htmlFor="registration-search">Search registrations</label><input className="field mt-0 min-w-0" id="registration-search" placeholder="Search names, reg no, phone…" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="secondary-button shrink-0" disabled={!filtered.length} onClick={() => {
        try { downloadCsv(`KindnessJam-${orgCode}.csv`, filtered, columns.map(({ key, label }) => ({ key, label }))) } catch { toast.error('Could not download CSV.') }
      }}>Download CSV</button></div>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-800" role="alert">{error} <button className="font-semibold underline" onClick={load}>Retry</button></p>}
    <section className="surface mt-6 p-5 sm:p-6">{loading ? <Spinner label="Loading registrations…" /> : <DataTable columns={columns} rows={filtered} emptyMessage={query ? 'No registrations match your search.' : 'No registrations for this organisation yet.'} />}</section>
  </main>
}

let scannerInstanceId = 0

function AdminScan() {
  const adminKey = sessionStorage.getItem('kindnessJamAdmin') || ''
  const scannerHostRef = useRef(null)
  const scannerRef = useRef(null)
  const busyRef = useRef(false)
  const resumeTimer = useRef(null)
  const [scanError, setScanError] = useState('')
  const [result, setResult] = useState(null)
  const [manual, setManual] = useState('')
  const [checking, setChecking] = useState(false)

  const beep = useCallback(() => {
    try {
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.frequency.value = 880
      gain.gain.value = 0.08
      oscillator.start()
      oscillator.stop(context.currentTime + 0.16)
      oscillator.onended = () => context.close()
    } catch { /* Audio may be unavailable or blocked by the browser. */ }
    if ('vibrate' in navigator) navigator.vibrate(180)
  }, [])

  const verifyCode = useCallback(async (code, isRegistrationNumber = false) => {
    if (!code || busyRef.current) return
    busyRef.current = true
    setChecking(true)
    try {
      await scannerRef.current?.pause(true)
    } catch { /* Scanner may not yet be running for manual checks. */ }
    try {
      const data = isRegistrationNumber
        ? await verifyRegistrationNumber(adminKey, code)
        : await verifyTicketToken(adminKey, code)
      if (!data?.status) throw new Error('The verification service returned an invalid result.')
      setResult({ ...data, manualLookup: isRegistrationNumber })
      beep()
    } catch (error) {
      setResult({ status: 'ERROR', message: error.message || 'Could not verify this ticket.', manualLookup: isRegistrationNumber })
      beep()
    } finally {
      setChecking(false)
      setManual('')
      window.clearTimeout(resumeTimer.current)
      resumeTimer.current = window.setTimeout(async () => {
        setResult(null)
        busyRef.current = false
        try {
          if (scannerRef.current?.getState() === Html5QrcodeScannerState.PAUSED) await scannerRef.current.resume()
        } catch (error) {
          setScanError(error.message || 'Scanner could not resume. Reload the page to try again.')
        }
      }, 2500)
    }
  }, [adminKey, beep])

  useEffect(() => {
    let cancelled = false
    const host = document.createElement('div')
    host.id = `kindness-jam-reader-${++scannerInstanceId}`
    scannerHostRef.current?.append(host)
    const scanner = new Html5Qrcode(host.id, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    scannerRef.current = scanner
    const startPromise = scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
      (decodedText) => verifyCode(decodedText),
      () => {},
    ).catch((error) => {
      if (!cancelled) setScanError(error.message || 'Could not start the camera. Allow camera access or use manual lookup.')
    })
    return () => {
      cancelled = true
      window.clearTimeout(resumeTimer.current)
      startPromise.finally(async () => {
        try {
          if (scanner.getState() !== Html5QrcodeScannerState.NOT_STARTED) await scanner.stop()
        } catch {
          // The camera may have already stopped while the route was unmounting.
        } finally {
          scanner.clear()
          host.remove()
        }
      })
    }
  }, [verifyCode])

  const allowed = result?.status === 'ALLOWED'
  const used = result?.status === 'USED'
  const invalid = result?.status === 'INVALID' || result?.status === 'ERROR'
  return <main className="page-shell mx-auto max-w-3xl px-4 py-8">
    <Link className="text-sm font-semibold text-ku-700 underline" to="/admin">← Back to dashboard</Link>
    <h1 className="mt-4 text-3xl font-bold text-ku-900">Entry scanner</h1>
    <p className="mt-1 text-sm text-slate-600">Point the rear camera at a participant’s ticket QR code.</p>
    <div className="surface mt-6 p-4 sm:p-6">
      <div ref={scannerHostRef} className="mx-auto min-h-72 max-w-lg overflow-hidden rounded-xl bg-slate-950" aria-label="QR code camera scanner" />
      {scanError && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="alert">{scanError}</p>}
      {checking && <div className="mt-4 text-ku-700"><Spinner label="Verifying ticket…" /></div>}
    </div>
    <section className="surface mt-5 p-5">
      <h2 className="font-bold text-ku-900">Manual fallback</h2>
      <p className="mt-1 text-sm text-slate-600">Enter the registration number printed on the ticket. This uses the backend verification action’s <code>regNo</code> field.</p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); verifyCode(manual.trim(), true) }}>
        <label className="sr-only" htmlFor="manual-regno">Registration number</label><input className="field mt-0" id="manual-regno" placeholder="e.g. KJ-0001" value={manual} onChange={(event) => setManual(event.target.value)} required />
        <button className="primary-button shrink-0" disabled={checking}>Verify entry</button>
      </form>
    </section>
    {result && <div className={`fixed inset-0 z-50 flex items-center justify-center p-5 text-center text-white ${allowed ? 'bg-green-700' : 'bg-red-700'}`} role="alert" aria-live="assertive">
      <div><p className="text-4xl font-extrabold">{allowed ? 'Entry Allowed' : used ? 'Already used' : invalid ? (result.status === 'INVALID' ? 'Invalid ticket' : 'Verification failed') : 'Verification result'}</p>
        {allowed && <div className="mt-5 space-y-1 text-lg"><p>{result.name}</p><p>{result.orgName}</p><p className="font-bold">{result.regNo}</p></div>}
        {used && <p className="mt-4 text-lg">First scanned: {result.checkedInAt || 'Time unavailable'}</p>}
        {invalid && <p className="mt-4 text-sm">{result.message || (result.manualLookup ? 'The registration number was found, but its ticket could not be verified. Please check the registration status in the sheet.' : '')}</p>}
        <p className="mt-8 text-sm text-white/80">Scanner resumes automatically…</p>
      </div>
    </div>}
  </main>
}

export default function Admin({ page }) {
  if (page === 'login') return <AdminLogin />
  if (page === 'org') return <AdminOrg />
  if (page === 'scan') return <AdminScan />
  return <AdminDashboard />
}
