import { getToken, isLoggedIn } from '../auth/token'

const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function crewRequest(path = '', { method = 'GET', body } = {}) {
    const headers = {}
    if (isLoggedIn()) headers.Authorization = `Bearer ${getToken()}`
    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const options = { method, headers }
    if (body !== undefined && method !== 'GET') options.body = JSON.stringify(body)
    const response = await fetch(`${base}/crews${path}`, options)

    if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw Object.assign(new Error(error.message || `요청에 실패했어요 (${response.status}).`), { status: response.status })
    }
    return response.status === 204 ? null : response.json()
}

export function crewList(options = {}) {
    const params = new URLSearchParams()
    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.set(key, value)
    })
    return crewRequest(`?${params}`)
}

export const sportLabel = { RUNNING: '러닝', BOXING: '복싱' }
export const crewStatus = { OPEN: '모집 중', CLOSED: '모집 마감' }
