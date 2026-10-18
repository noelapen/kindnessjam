import { useState } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from './Shared'

export default function LoginForm({ title, description, fields, onSubmit, errorMessage }) {
  const [loading, setLoading] = useState(false)
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(({ name }) => [name, ''])))

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      await onSubmit(values)
    } catch (error) {
      toast.error(error.message || errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return <main className="page-shell mx-auto max-w-md px-4 py-12"><section className="surface p-6 sm:p-8">
    <h1 className="text-2xl font-bold text-ku-900">{title}</h1>
    <p className="mt-2 text-sm text-slate-600">{description}</p>
    <form className="mt-6 space-y-5" onSubmit={submit}>
      {fields.map(({ id, name, label, ...input }) => <div key={id}>
        <label className="field-label" htmlFor={id}>{label}</label>
        <input
          className="field"
          id={id}
          required
          {...input}
          value={values[name]}
          onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
        />
      </div>)}
      <button className="primary-button w-full" disabled={loading}>
        {loading ? <Spinner label="Signing in…" /> : 'Sign in'}
      </button>
    </form>
  </section></main>
}
