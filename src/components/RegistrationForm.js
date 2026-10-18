import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { register } from '../api/client'
import { isValidPhone, normalizePhone } from '../utils/validators'
import { Spinner } from './Shared'

export default function RegistrationForm({ orgCode, orgName }) {
  const [form, setForm] = useState({ name: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const update = (key) => (event) => setForm((current) => ({
    ...current,
    [key]: event.target.value,
  }))

  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) return toast.error('Enter your full name.')
    if (!isValidPhone(form.phone)) return toast.error('Enter a valid 10-digit phone number.')

    setLoading(true)
    try {
      const result = await register({
        orgCode,
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
      })
      if (!result?.regNo || !result?.token) {
        throw new Error('The registration service did not return both a registration number and ticket QR. Please contact the event team.')
      }
      localStorage.setItem('kindnessJamTicketToken', result.token)
      navigate(`/ticket/${encodeURIComponent(result.token)}`)
    } catch (error) {
      toast.error(error.message || 'Registration could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return <form className="space-y-5" onSubmit={submit}>
    <div><label className="field-label" htmlFor="full-name">Full name</label><input className="field" id="full-name" autoComplete="name" required maxLength={120} value={form.name} onChange={update('name')} /></div>
    <div><label className="field-label" htmlFor="phone">Phone number</label><input className="field" id="phone" type="tel" inputMode="numeric" autoComplete="tel" required maxLength={20} value={form.phone} onChange={update('phone')} aria-describedby="phone-help" /><p id="phone-help" className="mt-1 text-xs text-slate-500">Enter 10 digits. This number is used to recover your ticket.</p></div>
    <div><label className="field-label" htmlFor="org-name">Organisation</label><input className="field bg-ku-50" id="org-name" value={orgName} readOnly /></div>
    <button className="primary-button w-full" disabled={loading} type="submit">{loading ? <Spinner label="Registering…" /> : 'Complete registration'}</button>
  </form>
}
