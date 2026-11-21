
import { useEffect, useState } from 'react'
import { getToken } from '../auth/token'
import {
    cachedNickname,
    fetchMyNickname,
    saveNickname
} from '../auth/nickname'
import {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
    updateNickname
} from '../api/userApi'

const EMPTY_PROFILE = {
    gender: '',
    age: '',
    heightCm: '',
    weightKg: '',
    experienceLevel: '',
    primaryExercises: [],
    goal: ''
}

const EXPERIENCE_OPTIONS = [
    {
        value: 'BEGINNER',
        label: '초급',
        description: '운동을 시작한 지 얼마 안 됐어요'
    },
    {
        value: 'INTERMEDIATE',
        label: '중급',
        description: '꾸준히 운동하고 있어요'
    },
    {
        value: 'ADVANCED',
        label: '고급',
        description: '매우 꾸준히 운동하고 잘해요'
    }
]

const EXERCISE_OPTIONS = [
    { value: 'RUNNING', label: '러닝', icon: '🏃' },
    { value: 'BOXING', label: '복싱', icon: '🥊' }
]

function emailFromToken() {
    try {
        const payload = getToken()?.split('.')[1]
        if (!payload) return ''

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        return JSON.parse(atob(base64)).email || ''
    } catch {
        return ''
    }
}

export default function MyPage() {
    const [email] = useState(emailFromToken)
    const [nickname, setNickname] = useState(cachedNickname)
    const [nicknameMessage, setNicknameMessage] = useState('')
    const [profile, setProfile] = useState(EMPTY_PROFILE)
    const [profileMessage, setProfileMessage] = useState('')
    const [profileExists, setProfileExists] = useState(false)
    const [profileAvailable, setProfileAvailable] = useState(false)
    const [loading, setLoading] = useState(true)
    const [savingNickname, setSavingNickname] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    useEffect(() => {
        let active = true

        async function load() {
            try {
                const [nameResult, profileResult] = await Promise.allSettled([
                    fetchMyNickname(),
                    getMyProfile()
                ])

                if (!active) return

                if (nameResult.status === 'fulfilled') {
                    setNickname(nameResult.value)
                }

                if (profileResult.status === 'fulfilled') {
                    const response = profileResult.value

                    if (response.ok) {
                        const data = await response.json()
                        if (!active) return

                        setProfile({
                            gender: data.gender ?? '',
                            age: data.age ?? '',
                            heightCm: data.heightCm ?? '',
                            weightKg: data.weightKg ?? '',
                            experienceLevel: data.experienceLevel ?? '',
                            primaryExercises: data.primaryExercises ?? [],
                            goal: data.goal ?? ''
                        })

                        setProfileExists(true)
                        setProfileAvailable(true)
                    } else if (response.status === 404) {
                        setProfileExists(false)
                        setProfileAvailable(true)
                        setProfileMessage(
                            '등록된 운동 프로필이 없습니다. 정보를 입력하고 등록해주세요.'
                        )
                    } else {
                        setProfileAvailable(false)
                        setProfileMessage(
                            `운동 프로필을 불러오지 못했습니다. (${response.status})`
                        )
                    }
                } else {
                    setProfileAvailable(false)
                    setProfileMessage('서버에 연결할 수 없습니다.')
                }
            } finally {
                if (active) setLoading(false)
            }
        }

        load()

        return () => {
            active = false
        }
    }, [])

    function changeProfile(event) {
        const { name, value } = event.target

        setProfile(prev => ({
            ...prev,
            [name]: value
        }))
    }

    function selectExperience(value) {
        setProfile(prev => ({
            ...prev,
            experienceLevel: value
        }))
    }

    function toggleExercise(exercise) {
        setProfile(prev => ({
            ...prev,
            primaryExercises: prev.primaryExercises.includes(exercise)
                ? prev.primaryExercises.filter(value => value !== exercise)
                : [...prev.primaryExercises, exercise]
        }))
    }

    async function saveAccount(event) {
        event.preventDefault()
        setNicknameMessage('')

        if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(nickname)) {
            setNicknameMessage(
                '닉네임은 한글, 영문, 숫자 2~10자로 입력해주세요.'
            )
            return
        }

        if (nickname.trim() === cachedNickname()) {
            setNicknameMessage('변경된 닉네임이 없습니다.')
            return
        }

        setSavingNickname(true)

        try {
            const response = await updateNickname(nickname)

            if (!response.ok) {
                const data = await response.json().catch(() => null)

                setNicknameMessage(
                    data?.message ||
                    (response.status === 409
                        ? '이미 사용 중인 닉네임입니다.'
                        : '닉네임 변경에 실패했습니다.')
                )
                return
            }

            saveNickname(nickname)
            setNicknameMessage('닉네임이 변경되었습니다.')
        } catch (error) {
            console.error('닉네임 변경 실패:', error)
            setNicknameMessage('서버에 연결할 수 없습니다.')
        } finally {
            setSavingNickname(false)
        }
    }

    async function saveProfile(event) {
        event.preventDefault()
        setProfileMessage('')

        if (!profileAvailable) {
            setProfileMessage(
                '프로필 조회 상태를 확인할 수 없습니다. 새로고침 후 다시 시도해주세요.'
            )
            return
        }

        if (!profile.experienceLevel) {
            setProfileMessage('운동 경력을 선택해주세요.')
            return
        }

        if (profile.primaryExercises.length === 0) {
            setProfileMessage('주 운동 종목을 하나 이상 선택해주세요.')
            return
        }

        setSavingProfile(true)

        try {
            const request = {
                gender: profile.gender,
                age: Number(profile.age),
                heightCm: Number(profile.heightCm),
                weightKg: Number(profile.weightKg),
                experienceLevel: profile.experienceLevel,
                primaryExercises: profile.primaryExercises,
                goal: profile.goal.trim() || null
            }

            const response = profileExists
                ? await updateMyProfile(request)
                : await createMyProfile(request)

            if (!response.ok) {
                const data = await response.json().catch(() => null)

                setProfileMessage(
                    data?.message ||
                    `운동 프로필 저장에 실패했습니다. (${response.status})`
                )
                return
            }

            // POST는 응답 본문이 없을 수도 있으므로 다시 GET으로 조회
            const refreshed = await getMyProfile()

            if (refreshed.ok) {
                const data = await refreshed.json()

                setProfile({
                    gender: data.gender ?? '',
                    age: data.age ?? '',
                    heightCm: data.heightCm ?? '',
                    weightKg: data.weightKg ?? '',
                    experienceLevel: data.experienceLevel ?? '',
                    primaryExercises: data.primaryExercises ?? [],
                    goal: data.goal ?? ''
                })
            }

            setProfileExists(true)
            setProfileMessage('운동 프로필이 저장되었습니다.')
        } catch (error) {
            console.error('운동 프로필 저장 실패:', error)
            setProfileMessage('서버에 연결할 수 없습니다.')
        } finally {
            setSavingProfile(false)
        }
    }

    return (
        <div className="nrnl-my-page">
            <div className="nrnl-my-heading">
                <h1>나의 정보</h1>
                <p>계정 정보와 운동 프로필을 관리하세요.</p>
            </div>

            <section className="nrnl-my-card">
                <h2>계정 정보</h2>
                <p className="nrnl-my-subtitle">
                    이메일은 조회만 가능하며, 닉네임은 변경할 수 있습니다.
                </p>

                <form onSubmit={saveAccount}>
                    <div className="nrnl-my-field">
                        <label htmlFor="my-email">이메일</label>
                        <input
                            id="my-email"
                            type="email"
                            value={email}
                            disabled
                            readOnly
                        />
                    </div>

                    <div className="nrnl-my-field">
                        <label htmlFor="my-nickname">닉네임</label>
                        <input
                            id="my-nickname"
                            value={nickname}
                            onChange={event =>
                                setNickname(event.target.value)
                            }
                            minLength={2}
                            maxLength={10}
                            required
                        />
                    </div>

                    {nicknameMessage && (
                        <p className="nrnl-my-message" role="status">
                            {nicknameMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="nrnl-my-button"
                        disabled={savingNickname || loading}
                    >
                        {savingNickname ? '저장 중...' : '닉네임 저장'}
                    </button>
                </form>
            </section>

            <section className="nrnl-my-card">
                <h2>운동 프로필</h2>
                <p className="nrnl-my-subtitle">
                    AI 코칭에 활용되는 운동 정보를 관리할 수 있습니다.
                </p>

                {loading ? (
                    <p>운동 프로필을 불러오는 중...</p>
                ) : (
                    <form onSubmit={saveProfile}>
                        <div className="nrnl-my-grid">
                            <div className="nrnl-my-field">
                                <label htmlFor="my-gender">성별</label>
                                <select
                                    id="my-gender"
                                    name="gender"
                                    value={profile.gender}
                                    onChange={changeProfile}
                                    disabled={!profileAvailable}
                                    required
                                >
                                    <option value="">선택해주세요</option>
                                    <option value="MAN">남성</option>
                                    <option value="WOMAN">여성</option>
                                </select>
                            </div>

                            <div className="nrnl-my-field">
                                <label htmlFor="my-age">나이</label>
                                <input
                                    id="my-age"
                                    name="age"
                                    type="number"
                                    min="5"
                                    max="100"
                                    step="1"
                                    value={profile.age}
                                    onChange={changeProfile}
                                    disabled={!profileAvailable}
                                    required
                                />
                            </div>

                            <div className="nrnl-my-field">
                                <label htmlFor="my-height">
                                    키 (cm)
                                </label>
                                <input
                                    id="my-height"
                                    name="heightCm"
                                    type="number"
                                    min="100"
                                    max="250"
                                    step="0.1"
                                    value={profile.heightCm}
                                    onChange={changeProfile}
                                    disabled={!profileAvailable}
                                    required
                                />
                            </div>

                            <div className="nrnl-my-field">
                                <label htmlFor="my-weight">
                                    몸무게 (kg)
                                </label>
                                <input
                                    id="my-weight"
                                    name="weightKg"
                                    type="number"
                                    min="30"
                                    max="200"
                                    step="0.1"
                                    value={profile.weightKg}
                                    onChange={changeProfile}
                                    disabled={!profileAvailable}
                                    required
                                />
                            </div>
                        </div>

                        <fieldset
                            className="nrnl-my-card-fieldset"
                            disabled={!profileAvailable}
                        >
                            <legend>운동 경력</legend>

                            <div className="nrnl-my-experience-cards">
                                {EXPERIENCE_OPTIONS.map(option => {
                                    const selected =
                                        profile.experienceLevel === option.value

                                    return (
                                        <label
                                            key={option.value}
                                            className={`nrnl-my-select-card ${
                                                selected ? 'is-selected' : ''
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="experienceLevel"
                                                checked={selected}
                                                onChange={() =>
                                                    selectExperience(option.value)
                                                }
                                                required
                                            />

                                            <span className="nrnl-my-radio-indicator" />

                                            <strong>{option.label}</strong>

                                            <small>
                                                {option.description}
                                            </small>
                                        </label>
                                    )
                                })}
                            </div>
                        </fieldset>

                        <fieldset
                            className="nrnl-my-card-fieldset"
                            disabled={!profileAvailable}
                        >
                            <legend>
                                주 운동 종목 (복수 선택 가능)
                            </legend>

                            <div className="nrnl-my-workout-cards">
                                {EXERCISE_OPTIONS.map(option => {
                                    const selected =
                                        profile.primaryExercises.includes(
                                            option.value
                                        )

                                    return (
                                        <label
                                            key={option.value}
                                            className={`nrnl-my-select-card ${
                                                selected ? 'is-selected' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() =>
                                                    toggleExercise(option.value)
                                                }
                                            />

                                            <span className="nrnl-my-workout-icon">
                                                {option.icon}
                                            </span>

                                            <strong>{option.label}</strong>

                                            <small>
                                                {selected ? '✓ 선택됨' : '선택하기'}
                                            </small>
                                        </label>
                                    )
                                })}
                            </div>
                        </fieldset>

                        <div className="nrnl-my-field">
                            <label htmlFor="my-goal">
                                운동 목표 (선택)
                            </label>

                            <textarea
                                id="my-goal"
                                name="goal"
                                value={profile.goal}
                                onChange={changeProfile}
                                maxLength={255}
                                rows={3}
                                disabled={!profileAvailable}
                                placeholder="예: 10km를 50분 이내로 완주하기"
                            />
                        </div>

                        {profileMessage && (
                            <p className="nrnl-my-message" role="status">
                                {profileMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="nrnl-my-button"
                            disabled={!profileAvailable || savingProfile}
                        >
                            {savingProfile
                                ? '저장 중...'
                                : profileExists
                                    ? '운동 프로필 저장'
                                    : '운동 프로필 등록'}
                        </button>
                    </form>
                )}
            </section>
        </div>
    )
}
