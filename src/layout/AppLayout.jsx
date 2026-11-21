
import { useEffect, useState } from 'react'
import {
    NavLink,
    Link,
    Outlet,
    useNavigate
} from 'react-router-dom'

import { clearToken, isLoggedIn } from '../auth/token'
import {
    cachedNickname,
    clearNickname,
    fetchMyNickname
} from '../auth/nickname'

import rengokuAvatar from '../assets/rengoku-landing-art.jpg'

import '../styles/header-slogan.css'
import { SignInLink } from '../components/SignInNotice'
import { SoundControls } from '../components/Soundtrack'

const nav = [
    {
        to: '/home',
        icon: '⌂',
        label: '대시보드',
        end: true
    },
    {
        to: '/calendar',
        icon: '▦',
        label: '운동 관리'
    },
    {
        to: '/stats',
        icon: '▥',
        label: '운동 통계'
    },
    {
        to: '/coaching',
        icon: '✦',
        label: 'AI 코칭'
    },
    {
        to: '/community',
        icon: '♧',
        label: '커뮤니티'
    },
    {
        to: '/crews',
        icon: '♧',
        label: '크루'
    },
    {
        to: '/my-page',
        icon: '♙',
        label: '나의 정보'
    }
]

export default function AppLayout() {
    const navigate = useNavigate()
    const signedIn = isLoggedIn()

    const [nickname, setNickname] = useState(cachedNickname)

    useEffect(() => {
        if (!signedIn) return
        let alive = true

        function syncNickname() {
            if (alive) {
                setNickname(cachedNickname())
            }
        }

        window.addEventListener(
            'nrnl:nickname',
            syncNickname
        )

        fetchMyNickname()
            .then(syncNickname)
            .catch(err => {
                console.warn('닉네임 조회 실패:', err)
            })

        return () => {
            alive = false

            window.removeEventListener(
                'nrnl:nickname',
                syncNickname
            )
        }
    }, [signedIn])

    function logout() {
        clearToken()
        clearNickname()

        navigate('/welcome', {
            replace: true
        })
    }

    return (
        <div className="app-shell flame-app-shell">

            {/* 왼쪽 사이드바 */}
            <aside className="sidebar flame-sidebar">

                <Link
                    to="/home"
                    className="brand flame-sidebar-brand"
                >
                    NO{' '}
                    <span className="nrnl-logo-fire">RUN</span>
                    {' '}NO{' '}
                    <span className="nrnl-logo-fire">LIFE</span>
                </Link>

                <nav
                    className="side-nav"
                    aria-label="주요 메뉴"
                >
                    {nav.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `side-link ${
                                    isActive ? 'is-active' : ''
                                }`
                            }
                        >
                            <span className="side-icon">
                                {item.icon}
                            </span>

                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {signedIn && <div className="sidebar-bottom">
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={logout}
                    >
                        ↪ 로그아웃
                    </button>
                </div>}
            </aside>

            <div className="app-main">

                {/* 상단 헤더 */}
                <header className="topbar flame-topbar nrnl-custom-topbar">

                    {/* 모바일 로고 */}
                    <div className="mobile-brand">
                        NO{' '}
                        <span className="nrnl-logo-fire">
                            RUN
                        </span>
                        {' '}NO{' '}
                        <span className="nrnl-logo-fire">
                            LIFE
                        </span>
                    </div>

                    {/* 중앙 일본어 붓글씨 이미지 */}
                    <div className="nrnl-header-slogan">
                        <img
                            src="/images/bannaer.png"
                            alt="こころをもやせ"
                            className="nrnl-header-slogan-image"
                        />
                    </div>

                    <div className="legacy-header-actions">
                    <SoundControls />
                    {signedIn ? <Link
                        to="/my-page"
                        className="topbar-actions nrnl-profile-link nrnl-topbar-profile"
                        aria-label="나의 정보로 이동"
                    >
                        <span className="profile-avatar flame-profile-avatar">
                            <img
                                src={rengokuAvatar}
                                alt="프로필 캐릭터"
                            />
                        </span>

                        <strong>
                            {nickname || '회원'}님
                        </strong>
                    </Link> : <SignInLink className="legacy-login" />}
                    </div>
                </header>

                {/* 페이지 콘텐츠 */}
                <main className="main-content">
                    <Outlet />
                </main>
            </div>

            {/* 모바일 하단 메뉴 */}
            <nav
                className="mobile-nav"
                aria-label="모바일 메뉴"
            >
                {nav.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `mobile-link ${
                                isActive ? 'is-active' : ''
                            }`
                        }
                    >
                        <span>{item.icon}</span>

                        <small>
                            {item.label.replace('운동 ', '')}
                        </small>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}
