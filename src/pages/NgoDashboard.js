import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ngoRegistrations } from '../api/client'
import DataTable from '../components/DataTable'
import Spinner from '../components/Spinner'
import StatCard from '../components/StatCard'
import { downloadCsv } from '../utils/download'

export default function NgoDashboard() {
  const navigate = useNavigate()
  const session = useMemo(() => {
    try { return JSON.parse(sessionStorage.getItem('kindnessJamNgo') || 'null') } catch { return null }
  }, [])
  const [result, setResult] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!session?.orgCode || !session?.passcode) {
      setError('Your organisation login has expired. Please sign in again.')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await ngoRegistrations(session.orgCode, session.passcode)
      const rows = Array.isArray(data) ? data : data?.registrations
      if (!Array.isArray(rows)) throw new Error('The organisation registration list is unavailable.')
      setResult({ ...(Array.isArray(data) ? {} : data), registrations: rows })
      setError('')
    } catch (requestError) { setError(requestError.message || 'Could not load your registrations.') }
    finally { setLoading(false) }
  }, [session])
  useEffect(() => { load() }, [load])

  const rows = result?.registrations || []
  const filtered = rows.filter((row) => !query.trim() || [row.regNo, row.name, row.phone].some((value) => String(value || '').toLowerCase().includes(query.trim().toLowerCase())))
  const quota = result?.quota ?? result?.org?.quota ?? '—'
  const used = result?.used ?? result?.registered ?? result?.org?.used ?? rows.length
  const remaining = result?.remaining ?? result?.org?.remaining ?? (Number.isFinite(Number(quota)) ? Math.max(0, Number(quota) - Number(used)) : '—')
  const columns = [
    { key: 'regNo', label: 'Reg No' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
    { key: 'checkedIn', label: 'Checked-in', render: (row) => row.checkedIn ? 'Yes' : 'No' },
  ]
  return <main className="page-shell mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold text-ku-900">Organisation dashboard</h1><p className="mt-1 text-sm text-slate-600">Your organisation: {result?.orgName || result?.org?.orgName || session?.orgCode}</p></div>
      <button className="secondary-button" onClick={() => { sessionStorage.removeItem('kindnessJamNgo'); navigate('/ngo/login', { replace: true }) }}>Sign out</button>
    </div>
    <section className="mt-6 grid gap-4 sm:grid-cols-3"><StatCard label="Quota" value={quota} /><StatCard label="Registered" value={used} /><StatCard label="Remaining" value={remaining} /></section>
    <section className="surface mt-6 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-ku-900">Your registrations</h2>
        <div className="flex w-full gap-2 sm:w-auto"><label className="sr-only" htmlFor="ngo-search">Search registrations</label><input className="field mt-0 min-w-0" id="ngo-search" placeholder="Search name, phone, reg no…" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="secondary-button shrink-0" disabled={!filtered.length} onClick={() => {
          try { downloadCsv(`KindnessJam-${session?.orgCode}.csv`, filtered, columns.map(({ key, label }) => ({ key, label }))) } catch { toast.error('Could not download CSV.') }
        }}>Download CSV</button></div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{error} <button className="font-semibold underline" onClick={load}>Retry</button></p>}
      {loading ? <Spinner label="Loading your registrations…" /> : <DataTable columns={columns} rows={filtered} emptyMessage={query ? 'No registrations match your search.' : 'No registrations yet.'} />}
    </section>
  </main>
}
