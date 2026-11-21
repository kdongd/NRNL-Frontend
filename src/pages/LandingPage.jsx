import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../auth/token'
import { SoundControls, useSoundtrack } from '../components/Soundtrack'
import { SignInLink } from '../components/SignInNotice'
import originalWelcome from '../assets/nrnl-welcome-final.png'

export default function LandingPage() {
    const [entering, setEntering] = useState(false)
    const timer = useRef()
    const navigate = useNavigate()
    const { startOnEntry } = useSoundtrack()

    useEffect(() => () => clearTimeout(timer.current), [])

    function enter() {
        if (entering) return
        startOnEntry()
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            navigate('/home')
            return
        }
        setEntering(true)
        timer.current = setTimeout(() => navigate('/home'), 1850)
    }

    return (
        <main className={`castle-intro${entering ? ' castle-entering' : ''}`}>
            <div className="castle-scene">
                <div className="castle-gallery gallery-upper" aria-hidden="true" />
                <div className="castle-gallery gallery-lower" aria-hidden="true" />
                <div className="castle-gallery gallery-side" aria-hidden="true" />
                <div className="castle-depth">
                    <h1 className="gate-sign" aria-label="NO RUN NO LIFE">
                        <svg className="gate-wordmark" viewBox="0 0 936 92" aria-hidden="true">
                            <defs>
                                <image id="original-welcome-art" href={originalWelcome} width="1672" height="941" />
                                <filter id="original-logo-contrast" colorInterpolationFilters="sRGB">
                                    <feColorMatrix type="matrix" values="
                                        1 0 0 0 0
                                        0 1 0 0 0
                                        0 0 1 0 0
                                        2.5 0 0 0 -1.05" />
                                </filter>
                            </defs>
                            <svg width="455" height="92" viewBox="124 287 455 92" overflow="hidden">
                                <use href="#original-welcome-art" filter="url(#original-logo-contrast)" />
                            </svg>
                            <svg x="481" width="455" height="92" viewBox="124 381 455 92" overflow="hidden">
                                <use href="#original-welcome-art" filter="url(#original-logo-contrast)" />
                            </svg>
                        </svg>
                    </h1>
                    <button className="castle-gate" type="button" disabled={entering} onClick={enter}>
                        <span className="gate-light" aria-hidden="true" />
                        <span className="gate-panel gate-left" aria-hidden="true" />
                        <span className="gate-panel gate-right" aria-hidden="true" />
                        <span className="gate-entry">입장하기</span>
                    </button>
                </div>
            </div>
            <header className="castle-header">
                <SoundControls />
                {isLoggedIn() ? <Link to="/my-page">나의 정보</Link> : <>
                    <SignInLink returnTo="/home" />
                    <Link to="/signup">회원가입</Link>
                </>}
            </header>
        </main>
    )
}
