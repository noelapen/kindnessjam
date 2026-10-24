// src/utils/download.js
import { toPng } from 'html-to-image'

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

async function captureElement(element) {
  if (!element) throw new Error('Nothing is available to download.')

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }

  // Measure exact full dimensions
  const width = element.offsetWidth || 410
  const height = element.offsetHeight

  return toPng(element, {
    pixelRatio: 3,
    cacheBust: true,
    width: width,        // Forces full horizontal capture width
    height: height,      // Forces full vertical capture height
    style: {
      margin: '0',       // Resets auto-margin shifting during capture
      transform: 'none', // Prevents CSS transform offsets
    },
  })
}

export async function downloadElementPng(element, filename) {
  const dataUrl = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function downloadElementPdf(element, filename) {
  const dataUrl = await captureElement(element)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const rect = element.getBoundingClientRect()
  const margin = 28
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  const scale = Math.min(
    (pageWidth - margin * 2) / rect.width,
    (pageHeight - margin * 2) / rect.height,
  )
  const width = rect.width * scale
  const height = rect.height * scale

  pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height)
  pdf.save(filename)
}