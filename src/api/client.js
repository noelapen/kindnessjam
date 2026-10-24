const API_URL = import.meta.env.VITE_API_URL

async function request(action, params = {}) {
  if (!API_URL) {
    throw new Error('The registration service is not configured. Please contact the event team.')
  }

  let response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...params }),
    })
  } catch {
    throw new Error('Could not reach the registration service. Please check your connection and try again.')
  }

  if (!response.ok) {
    throw new Error(`The registration service returned an error (${response.status}). Please try again.`)
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The registration service returned an unreadable response. Please try again later.')
  }

  if (result?.ok === false) throw new Error(result.error || 'The request could not be completed.')
  return Object.hasOwn(result ?? {}, 'data') ? result.data : result
}

export const getOrgs = () => request('getOrgs')
export const getOrg = (orgCode) => request('getOrg', { orgCode })
export const register = (payload) => request('register', payload)
export const getTicket = (token) => request('getTicket', { token })
export const findByPhone = (phone) => request('findByPhone', { phone })
export const adminLogin = (adminKey) => request('adminLogin', { adminKey })
export const ngoLogin = (orgCode, passcode) => request('ngoLogin', { orgCode, passcode })
export const adminSummary = (adminKey) => request('adminSummary', { adminKey })
export const adminOrgRegistrations = (adminKey, orgCode) => request('adminOrgRegistrations', { adminKey, orgCode })
export const ngoRegistrations = (orgCode, passcode) => request('ngoRegistrations', { orgCode, passcode })
export const updateOrg = (payload) => request('updateOrg', payload)
export const addOrg = (payload) => request('addOrg', payload)
export const verifyTicketToken = (adminKey, token) => request('verify', { adminKey, token })
export async function verifyRegistrationNumber(adminKey, regNo) {
  const lookup = await request('lookupRegNo', { adminKey, regNo })
  if (!lookup?.token) throw new Error('No ticket was found for that registration number.')
  return verifyTicketToken(adminKey, lookup.token)
}

export const resendConfirmationEmail = (adminKey, regNo) =>
  request('resendTicketEmail', { adminKey, regNo })
