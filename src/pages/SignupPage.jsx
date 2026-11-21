
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/authApi'

const INITIAL = {
    email: '',
    password: '',
    nickname: '',
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

export default function SignupPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState(INITIAL)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    function change(event) {
        const { name, value } = event.target
        setForm(prev => ({
            ...prev,
            [name]: value
        }))
    }

    function selectExperience(value) {
        setForm(prev => ({
            ...prev,
            experienceLevel: value
        }))
    }

    function toggleExercise(exercise) {
        setForm(prev => ({
            ...prev,
            primaryExercises: prev.primaryExercises.includes(exercise)
                ? prev.primaryExercises.filter(item => item !== exercise)
                : [...prev.primaryExercises, exercise]
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError('')

        if (!/^[가-힣a-zA-Z0-9]{2,10}$/.test(form.nickname)) {
            setError('닉네임은 한글, 영문, 숫자 2~10자로 입력해주세요.')
            return
        }

        if (!form.experienceLevel) {
            setError('운동 경력을 선택해주세요.')
            return
        }

        if (form.primaryExercises.length === 0) {
            setError('주 운동 종목을 하나 이상 선택해주세요.')
            return
        }

        if (form.password.length > 64) {
            setError('비밀번호는 64자 이내로 입력해주세요.')
            return
        }

        const request = {
            email: form.email.trim(),
            password: form.password,
            nickname: form.nickname,
            profile: {
                gender: form.gender,
                age: Number(form.age),
                heightCm: Number(form.heightCm),
                weightKg: Number(form.weightKg),
                experienceLevel: form.experienceLevel,
                primaryExercises: form.primaryExercises,
                goal: form.goal.trim() || null
            }
        }

        setSubmitting(true)

        try {
            const response = await signup(request)

            if (!response.ok) {
                const data = await response.json().catch(() => null)

                if (response.status === 409) {
                    setError(data?.message || '이미 사용 중인 이메일 또는 닉네임입니다.')
                } else if (response.status === 400) {
                    setError(data?.message || '입력값을 다시 확인해주세요.')
                } else {
                    setError(data?.message || '회원가입에 실패했습니다.')
                }
                return
            }

            navigate('/login', {
                replace: true,
                state: { signupSuccess: true }
            })
        } catch (err) {
            console.error('회원가입 실패:', err)
            setError('서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="form-page nrnl-auth-theme nrnl-signup-page">
            <div className="page">
                <Link to="/welcome" className="nrnl-auth-logo">
                    <span>NO <em>RUN</em></span>
                    <span>NO <em>LIFE</em></span>
                </Link>

                <div className="form-card form-card--single">
                    <div className="form-left">
                        <h1>회원가입</h1>

                        <p className="description">
                            계정 정보와 운동 프로필을 입력해주세요.
                        </p>

                        <form onSubmit={handleSubmit}>
                            <h2 className="signup-section-title">
                                계정 정보
                            </h2>

                            <div className="signup-account-fields">
                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-email"
                                    >
                                        이메일
                                    </label>

                                    <div className="nrnl-input-wrap">
                                        <span className="nrnl-input-icon" aria-hidden="true">
                                            ✉
                                        </span>

                                        <input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={change}
                                            maxLength={255}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-password"
                                    >
                                        비밀번호
                                    </label>

                                    <div className="nrnl-input-wrap">
                                        <span className="nrnl-input-icon" aria-hidden="true">
                                            ♙
                                        </span>

                                        <input
                                            id="signup-password"
                                            name="password"
                                            type="password"
                                            className="form-control"
                                            placeholder="8~64자"
                                            value={form.password}
                                            onChange={change}
                                            minLength={8}
                                            maxLength={64}
                                            autoComplete="new-password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-nickname"
                                    >
                                        닉네임
                                    </label>

                                    <div className="nrnl-input-wrap">
                                        <span className="nrnl-input-icon" aria-hidden="true">
                                            ♟
                                        </span>

                                        <input
                                            id="signup-nickname"
                                            name="nickname"
                                            type="text"
                                            className="form-control"
                                            placeholder="2~10자, 한글/영문/숫자"
                                            value={form.nickname}
                                            onChange={change}
                                            minLength={2}
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <h2 className="signup-section-title">
                                운동 프로필
                            </h2>

                            <div className="signup-two-columns">
                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-gender"
                                    >
                                        성별
                                    </label>

                                    <select
                                        id="signup-gender"
                                        name="gender"
                                        className="form-control signup-control"
                                        value={form.gender}
                                        onChange={change}
                                        required
                                    >
                                        <option value="">선택해주세요</option>
                                        <option value="MAN">남성</option>
                                        <option value="WOMAN">여성</option>
                                    </select>
                                </div>

                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-age"
                                    >
                                        나이
                                    </label>

                                    <input
                                        id="signup-age"
                                        name="age"
                                        type="number"
                                        className="form-control signup-control signup-number-input"
                                        placeholder="만 나이"
                                        value={form.age}
                                        onChange={change}
                                        min="5"
                                        max="100"
                                        step="1"
                                        required
                                    />
                                </div>

                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-height"
                                    >
                                        키 (cm)
                                    </label>

                                    <input
                                        id="signup-height"
                                        name="heightCm"
                                        type="number"
                                        className="form-control signup-control signup-number-input"
                                        placeholder="예: 175.5"
                                        value={form.heightCm}
                                        onChange={change}
                                        min="100"
                                        max="250"
                                        step="0.1"
                                        required
                                    />
                                </div>

                                <div className="field-group">
                                    <label
                                        className="form-label"
                                        htmlFor="signup-weight"
                                    >
                                        몸무게 (kg)
                                    </label>

                                    <input
                                        id="signup-weight"
                                        name="weightKg"
                                        type="number"
                                        className="form-control signup-control signup-number-input"
                                        placeholder="예: 72.3"
                                        value={form.weightKg}
                                        onChange={change}
                                        min="30"
                                        max="200"
                                        step="0.1"
                                        required
                                    />
                                </div>
                            </div>

                            <fieldset className="signup-card-fieldset">
                                <legend className="form-label">
                                    운동 경력
                                </legend>

                                <div className="signup-experience-cards">
                                    {EXPERIENCE_OPTIONS.map(option => {
                                        const selected =
                                            form.experienceLevel === option.value

                                        return (
                                            <label
                                                key={option.value}
                                                className={`signup-select-card signup-experience-card ${
                                                    selected ? 'is-selected' : ''
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="experienceLevel"
                                                    value={option.value}
                                                    checked={selected}
                                                    onChange={() =>
                                                        selectExperience(option.value)
                                                    }
                                                    required
                                                />

                                                <span className="signup-card-indicator" />

                                                <strong>{option.label}</strong>

                                                <small>
                                                    {option.description}
                                                </small>
                                            </label>
                                        )
                                    })}
                                </div>
                            </fieldset>

                            <fieldset className="signup-card-fieldset">
                                <legend className="form-label">
                                    주 운동 종목 (복수 선택 가능)
                                </legend>

                                <div className="signup-workout-cards">
                                    {EXERCISE_OPTIONS.map(option => {
                                        const selected =
                                            form.primaryExercises.includes(option.value)

                                        return (
                                            <label
                                                key={option.value}
                                                className={`signup-select-card signup-workout-card ${
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

                                                <span className="signup-workout-icon">
                                                    {option.icon}
                                                </span>

                                                <strong>{option.label}</strong>

                                                <span className="signup-card-check">
                                                    {selected ? '✓ 선택됨' : '선택하기'}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </fieldset>

                            <div className="field-group">
                                <label
                                    className="form-label"
                                    htmlFor="signup-goal"
                                >
                                    운동 목표 (선택)
                                </label>

                                <textarea
                                    id="signup-goal"
                                    name="goal"
                                    className="form-control signup-control signup-textarea"
                                    placeholder="예: 10km를 50분 이내로 완주하기"
                                    value={form.goal}
                                    onChange={change}
                                    maxLength={255}
                                    rows={3}
                                />
                            </div>

                            {error && (
                                <div
                                    className="field-error"
                                    role="alert"
                                    style={{ marginBottom: 16 }}
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="main-btn"
                                disabled={submitting}
                            >
                                {submitting ? '가입 처리 중...' : '회원가입'}
                            </button>
                        </form>

                        <div className="auth-switch">
                            이미 계정이 있으신가요?{' '}
                            <Link to="/login">로그인</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
