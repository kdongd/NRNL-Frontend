
import { getToken } from '../auth/token'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const USERS_URL = `${API_BASE_URL}/users`

function authHeaders() {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export function checkNicknameAvailability(nickname) {
    const query = new URLSearchParams({ nickname })

    return fetch(
        `${USERS_URL}/nicknames/availability?${query.toString()}`
    ).then(response => response.json())
}

export function updateNickname(nickname) {
    return fetch(`${USERS_URL}/me/nickname`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
        },
        body: JSON.stringify({ nickname })
    })
}

export function getMyProfile() {
    return fetch(`${USERS_URL}/me/profile`, {
        method: 'GET',
        headers: authHeaders()
    })
}

export function createMyProfile(profile) {
    return fetch(`${USERS_URL}/me/profile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
        },
        body: JSON.stringify(profile)
    })
}

export function updateMyProfile(profile) {
    return fetch(`${USERS_URL}/me/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
        },
        body: JSON.stringify(profile)
    })
}
