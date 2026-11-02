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

/**
 * Forces the element to a fixed 410px width for capture, ensuring
 * pixel-identical output across all devices (phone, tablet, desktop).
 */
async function captureElement(element) {
  if (!element) throw new Error('Nothing is available to download.')

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }

  // Fixed render width — the poster is designed for 410px
  const FIXED_WIDTH = 410

  // Save original inline styles so we can restore them after capture
  const savedStyles = {
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    margin: element.style.margin,
    transform: element.style.transform,
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
  }

  // Force the element to the canonical 410px width for capture
  element.style.width = `${FIXED_WIDTH}px`
  element.style.maxWidth = `${FIXED_WIDTH}px`
  element.style.minWidth = `${FIXED_WIDTH}px`
  element.style.margin = '0'
  element.style.transform = 'none'

  // Let the browser reflow at the forced width
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const height = element.offsetHeight

  let dataUrl
  try {
    dataUrl = await toPng(element, {
      pixelRatio: 3,
      cacheBust: true,
      width: FIXED_WIDTH,
      height: height,
      style: {
        margin: '0',
        transform: 'none',
      },
    })
  } finally {
    // Restore original styles
    Object.entries(savedStyles).forEach(([key, value]) => {
      element.style[key] = value || ''
    })
  }

  return { dataUrl, width: FIXED_WIDTH, height }
}

export async function downloadElementPng(element, filename) {
  const { dataUrl } = await captureElement(element)
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function downloadElementPdf(element, filename) {
  const { dataUrl, width: capturedWidth, height: capturedHeight } = await captureElement(element)
  const { jsPDF } = await import('jspdf')

  // Use the captured dimensions (at fixed width) for consistent PDF layout
  const margin = 28
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const scale = Math.min(
    (pageWidth - margin * 2) / capturedWidth,
    (pageHeight - margin * 2) / capturedHeight,
  )
  const pdfImageWidth = capturedWidth * scale
  const pdfImageHeight = capturedHeight * scale

  pdf.addImage(
    dataUrl,
    'PNG',
    (pageWidth - pdfImageWidth) / 2,
    (pageHeight - pdfImageHeight) / 2,
    pdfImageWidth,
    pdfImageHeight,
  )
  pdf.save(filename)
}