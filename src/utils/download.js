function escapeCell(value) {
  const text = value == null ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

export function downloadCsv(filename, rows, columns) {
  const content = [
    columns.map(({ label }) => escapeCell(label)).join(','),
    ...rows.map((row) => columns.map(({ key }) => escapeCell(row[key])).join(',')),
  ].join('\r\n')
  const blob = new Blob(['\uFEFF', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function renderElement(element) {
  if (!element) throw new Error('Nothing is available to download.')
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
}

export async function downloadElementPng(element, filename) {
  const canvas = await renderElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function downloadElementPdf(element, filename) {
  const canvas = await renderElement(element)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const margin = 28
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const scale = Math.min(
    (pageWidth - margin * 2) / canvas.width,
    (pageHeight - margin * 2) / canvas.height,
  )
  const width = canvas.width * scale
  const height = canvas.height * scale

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height)
  pdf.save(filename)
}
