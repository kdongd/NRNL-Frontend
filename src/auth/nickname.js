
import { getToken } from './token'

const KEY = 'nrnl_nickname'

export function cachedNickname() {
    return localStorage.getItem(KEY) || ''
}

export function saveNickname(nickname) {
    if (typeof nickname === 'string' && nickname.trim()) {
        localStorage.setItem(KEY, nickname.trim())
    } else {
        localStorage.removeItem(KEY)
    }

    window.dispatchEvent(new Event('nrnl:nickname'))
}

export function clearNickname() {
    saveNickname(null)
}

export async function fetchMyNickname(token = getToken()) {
    if (!token) {
        throw new Error('로그인이 필요합니다.')
    }

    const base = import.meta.env.VITE_API_BASE_URL

    const response = await fetch(`${base}/users/me/nickname`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`닉네임 조회 실패 (${response.status})`)
    }

    const data = await response.json()
    saveNickname(data.nickname)

    return data.nickname || ''
}
