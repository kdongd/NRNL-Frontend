
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login, loginWithGoogle, getMyNickname } from '../api/authApi'
import { setToken } from '../auth/token'

export default function LoginPage() {
    const navigate = useNavigate()
    const { state } = useLocation()
    const requestedPage = state?.from
    const returnTo = typeof requestedPage === 'string' && /^\/(?![/\\])/.test(requestedPage)
        ? requestedPage : '/home'
    const googleButtonRef = useRef(null)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true

        script.onload = () => {
            if (window.google && googleButtonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                    callback: handleGoogleCredential
                })

                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    {
                        theme: 'filled_black',
                        size: 'large',
                        width: 320
                    }
                )
            }
        }

        document.body.appendChild(script)

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script)
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function goHomeOrNicknameSetup(accessToken) {
        const { nickname } = await getMyNickname(accessToken)

        setToken(accessToken)

        navigate(
            typeof nickname === 'string' && nickname.trim()
                ? returnTo
                : '/nickname',
            { replace: true, state: { from: returnTo } }
        )
    }

    function handleGoogleCredential(response) {
        setError('')

        loginWithGoogle(response.credential)
            .then(res => {
                if (!res.ok) {
                    throw new Error('구글 로그인 실패')
                }

                return res.json()
            })
            .then(data => {
                if (!data.accessToken) {
                    throw new Error('로그인 토큰이 없습니다.')
                }

                return goHomeOrNicknameSetup(data.accessToken)
            })
            .catch(err => {
                console.error('구글 로그인 실패:', err)
                setError('구글 로그인 또는 닉네임 조회에 실패했습니다.')
            })
    }

    function handleSubmit(e) {
        e.preventDefault()
        setError('')

        login(email, password)
            .then(res => {
                if (res.status === 401) {
                    setError('이메일 또는 비밀번호가 올바르지 않습니다.')
                    return null
                }

                if (!res.ok) {
                    setError('로그인에 실패했습니다.')
                    return null
                }

                return res.json()
            })
            .then(data => {
                if (!data) return

                if (!data.accessToken) {
                    throw new Error('로그인 토큰이 없습니다.')
                }

                return goHomeOrNicknameSetup(data.accessToken)
            })
            .catch(err => {
                console.error('로그인 실패:', err)
                setError('로그인 또는 닉네임 조회에 실패했습니다.')
            })
    }

    return (
        <div className="form-page nrnl-auth-theme">
            <div className="page">
                <Link to="/welcome" className="nrnl-auth-logo">
                    <span>
                        NO <em>RUN</em>
                    </span>
                    <span>
                        NO <em>LIFE</em>
                    </span>
                </Link>

                <div className="form-card form-card--single">
                    <div className="form-left">
                        <h1>로그인</h1>

                        <p className="description">
                            다시 만나서 반가워요.
                            <br />
                            오늘의 운동을 기록하러 가볼까요?
                        </p>

                        <form onSubmit={handleSubmit}>
                            <div className="field-group">
                                <label
                                    className="form-label"
                                    htmlFor="login-email"
                                >
                                    이메일
                                </label>

                                <div className="nrnl-input-wrap">
                                    <span
                                        className="nrnl-input-icon"
                                        aria-hidden="true"
                                    >
                                        ✉
                                    </span>

                                    <input
                                        id="login-email"
                                        type="email"
                                        className="form-control"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="field-group">
                                <label
                                    className="form-label"
                                    htmlFor="login-password"
                                >
                                    비밀번호
                                </label>

                                <div className="nrnl-input-wrap">
                                    <span
                                        className="nrnl-input-icon"
                                        aria-hidden="true"
                                    >
                                        ♙
                                    </span>

                                    <input
                                        id="login-password"
                                        type="password"
                                        className="form-control"
                                        placeholder="비밀번호"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div
                                    className="field-error"
                                    role="alert"
                                    style={{ marginBottom: 20 }}
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="main-btn"
                            >
                                로그인
                            </button>
                        </form>

                        <div className="auth-divider">
                            또는
                        </div>

                        <div
                            className="google-btn-container"
                            ref={googleButtonRef}
                        />

                        <div className="auth-switch">
                            아직 계정이 없으신가요?{' '}
                            <Link to="/signup">
                                회원가입
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
