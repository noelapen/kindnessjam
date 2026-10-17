import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { adminOrgRegistrations } from '../api/client'
import DataTable from '../components/DataTable'
import Spinner from '../components/Spinner'
import { downloadCsv } from '../utils/download'

export default function AdminOrg() {
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
    return rows.filter((row) => !value || [row.regNo, row.name, row.phone, row.email].some((item) => String(item || '').toLowerCase().includes(value)))
  }, [rows, query])
  const columns = [
    { key: 'regNo', label: 'Reg No' }, { key: 'name', label: 'Name' }, { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' }, { key: 'registeredAt', label: 'Registered at', render: (row) => row.registeredAt || row.registered_at || '—' },
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
