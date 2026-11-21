import { createContext, useContext, useRef, useState } from 'react'

const SoundContext = createContext(null)
const soundtrackUrl = import.meta.env.VITE_SOUNDTRACK_URL?.trim()

export function Soundtrack({ children }) {
    const audio = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [volume, setVolume] = useState(0.12)
    const [error, setError] = useState('')
    const choice = useRef(false)

    function play() {
        audio.current.volume = volume
        setError('')
        return audio.current.play().catch(() => setError('음악을 재생할 수 없어요.'))
    }

    function toggle() {
        choice.current = true
        if (audio.current.paused) play()
        else audio.current.pause()
    }

    function changeVolume(value) {
        audio.current.volume = value
        setVolume(value)
    }

    return (
        <SoundContext.Provider value={{
            available: Boolean(soundtrackUrl), playing, volume, error, toggle, changeVolume,
            startOnEntry: () => { if (!choice.current && audio.current?.paused) play() }
        }}>
            {soundtrackUrl && <audio ref={audio} src={soundtrackUrl} loop preload="none"
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />}
            {children}
        </SoundContext.Provider>
    )
}

export function useSoundtrack() {
    return useContext(SoundContext)
}

export function SoundControls() {
    const { available, playing, volume, error, toggle, changeVolume } = useSoundtrack()
    if (!available) return null
    const playbackLabel = playing ? '음악 일시정지' : '음악 재생'

    return (
        <div className="sound-controls" role="group" aria-label="배경 음악">
            <button className="sound-icon" type="button" onClick={toggle} aria-label={playbackLabel} title={playbackLabel}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    {playing ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" /> : <path d="m8 5 12 7-12 7z" />}
                </svg>
            </button>
            <details className="sound-volume" onKeyDown={event => {
                if (event.key === 'Escape' && event.currentTarget.open) {
                    event.currentTarget.open = false
                    event.currentTarget.querySelector('summary').focus()
                }
            }}>
                <summary className="sound-icon" aria-label="음량 조절" title="음량 조절">
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9h4l5-4v14l-5-4H3z" />
                        {volume === 0 ? <path d="m16 10 5 5m0-5-5 5" /> : <path d="M16 9a4.3 4.3 0 0 1 0 6m2.8-8.7a8 8 0 0 1 0 11.4" />}
                    </svg>
                </summary>
                <label className="sound-popover">
                    <span>음량 <output>{Math.round(volume * 100)}%</output></span>
                    <input type="range" min="0" max="1" step="0.01" value={volume}
                        onChange={event => changeVolume(event.currentTarget.valueAsNumber)} />
                </label>
            </details>
            {error && <p className="sound-error" role="alert">{error}</p>}
        </div>
    )
}
