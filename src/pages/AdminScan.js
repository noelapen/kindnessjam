import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { verifyRegistrationNumber, verifyTicketToken } from '../api/client'
import Spinner from '../components/Spinner'

let scannerInstanceId = 0

export default function AdminScan() {
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
