export default function StatCard({ label, value, accent = 'text-ku-700' }) {
  return <div className="surface p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${accent}`}>{value ?? '—'}</p></div>
}
