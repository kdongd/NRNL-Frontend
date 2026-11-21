import { getToken } from '../auth/token'

const BASE = import.meta.env.VITE_API_BASE_URL

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(body.message || `요청 실패 (${response.status})`)
    error.status = response.status
    throw error
  }

  // 204 No Content: 저장된 코칭이 없는 경우
  if (response.status === 204) {
    return null
  }

  return response.json()
}

// 룰 기반 운동 상태 조회
export const fetchAssessment = () =>
  request('/coaching/assessment')

// 기존 AI 코칭 조회 (새로 추가)
export const fetchLatestCoaching = () =>
  request('/coaching/latest')

// AI 코칭 생성 또는 기존 캐시 재사용
export const generateCoaching = () =>
  request('/coaching', { method: 'POST' })

// 운동 컨디션 조회
export const fetchCondition = id =>
  request(`/workouts/${id}/condition`)

// 운동 컨디션 저장
export const saveCondition = (id, payload) =>
  request(`/workouts/${id}/condition`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })