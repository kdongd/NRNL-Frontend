
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const AUTH_URL = `${API_BASE_URL}/auth`

export function signup(request) {
    return fetch(`${AUTH_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
    })
}

export function login(email, password) {
    return fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
}

export function loginWithGoogle(idToken) {
    return fetch(`${AUTH_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
    })
}

// 로그인한 사용자의 닉네임 조회
export async function getMyNickname(accessToken) {
    const response = await fetch(`${API_BASE_URL}/users/me/nickname`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    if (!response.ok) {
        throw new Error(`닉네임 조회 실패 (${response.status})`)
    }

    return response.json()
}
