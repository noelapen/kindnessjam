export const normalizePhone = (value) => value.replace(/\D/g, '')
export const isValidPhone = (value) => /^\d{10}$/.test(normalizePhone(value))

export function createOrgCode(name) {
  const base = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')
  return base || `ORG-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

export function createPasscode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase()
}
