export function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-ku-300 p-8 text-center text-sm text-slate-500">{emptyMessage}</div>
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.regNo || row.orgCode || index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody>
  </table></div>
}

export function Spinner({ label = 'Loading…' }) {
  return <span className="inline-flex items-center gap-2" role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
    <span>{label}</span>
  </span>
}

export function StatCard({ label, value, accent = 'text-ku-700' }) {
  return <div className="surface p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${accent}`}>{value ?? '—'}</p></div>
}
