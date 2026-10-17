export default function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-ku-300 p-8 text-center text-sm text-slate-500">{emptyMessage}</div>
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.regNo || row.orgCode || index}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody>
  </table></div>
}
