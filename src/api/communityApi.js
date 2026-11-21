import { getToken, isLoggedIn } from '../auth/token'
const BASE = `${import.meta.env.VITE_API_BASE_URL}/community`
export async function communityRequest(path, options = {}) {
  const token = isLoggedIn() ? getToken() : null
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers }
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || `요청 실패 (${res.status})`)
  }
  return res.status === 204 ? null : res.json()
}
export const queryString = (data) => new URLSearchParams(Object.entries(data).filter(([,v])=>v!==undefined && v!==null)).toString()
